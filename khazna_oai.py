"""
khazna_oai.py — OAI-PMH harvester for Khazna (Khalifa University Pure Portal).

Endpoint: https://khazna.ku.ac.ae/ws/oai   (public, no API key)

KEY DESIGN DECISION
-------------------
Khazna exposes `publications:all` and `publications:withFiles` as separate OAI
sets. Full-text presence is therefore SET MEMBERSHIP, not something inferred by
parsing <accessCondition> free text. This removes the main guessing risk:
we ask Pure which records have files instead of deducing it.

Access status (open / embargoed / restricted / closed) comes from the
`openaire` set, which uses the OpenAIRE controlled vocabulary
`info:eu-repo/semantics/*` rather than free text.

Harvest strategy
----------------
    pass 1  publications:all        -> DOI, title, year, portal URL
    pass 2  publications:withFiles  -> mark has_files = True   (authoritative)
    pass 3  openaire                -> access_rights, embargo_end (vocabulary)

Anything not established by the above is None. The system says "not
determined" rather than guessing.

USAGE
-----
    python khazna_oai.py gap                  # deposit gap per year — start here
    python khazna_oai.py inspect --set publications:withFiles --raw
    python khazna_oai.py harvest              # full 3-pass -> khazna_index.json
    python khazna_oai.py harvest --from 2026-07-01T00:00:00Z   # incremental
    python khazna_oai.py lookup 10.1080/19322909.2023.2221477
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Iterator, Optional
from xml.etree import ElementTree as ET

import httpx

logger = logging.getLogger("khazna")

OAI_BASE = "https://khazna.ku.ac.ae/ws/oai"
CONTACT = "nikesh.narayanan@ku.ac.ae"
USER_AGENT = f"ResearchBee-Harvester/1.0 (KU Library; mailto:{CONTACT})"
INDEX_PATH = Path("khazna_index.json")

_DELAY = 0.5                     # politeness between pages
_TIMEOUT = httpx.Timeout(90.0, connect=10.0)

NS = {
    "oai":   "http://www.openarchives.org/OAI/2.0/",
    "dc":    "http://purl.org/dc/elements/1.1/",
    "oaidc": "http://www.openarchives.org/OAI/2.0/oai_dc/",
    "mods":  "http://www.loc.gov/mods/v3",
    "didl":  "urn:mpeg:mpeg21:2002:02-DIDL-NS",
}

DOI_RE = re.compile(r"\b(10\.\d{4,9}/[^\s\"'<>]+)", re.I)

# OpenAIRE controlled vocabulary -> our states
OPENAIRE_ACCESS = {
    "info:eu-repo/semantics/openaccess":      "open",
    "info:eu-repo/semantics/embargoedaccess": "embargoed",
    "info:eu-repo/semantics/restrictedaccess": "restricted",
    "info:eu-repo/semantics/closedaccess":    "closed",
}
EMBARGO_END_RE = re.compile(r"info:eu-repo/date/embargoEnd/(\d{4}-\d{2}-\d{2})", re.I)


# ── Record model ───────────────────────────────────────────────────────────
@dataclass
class KhaznaRecord:
    oai_id: str
    doi: Optional[str] = None
    title: str = ""
    year: str = ""
    portal_url: str = ""
    has_files: bool = False                 # from set membership — authoritative
    access_rights: Optional[str] = None     # from OpenAIRE vocabulary
    embargo_end: Optional[str] = None
    file_urls: list[str] = field(default_factory=list)

    @property
    def deposit_state(self) -> str:
        """
        open | embargoed | restricted | closed | metadata_only | undetermined

        Conservative by design: a file being present does NOT imply it is open.
        """
        if not self.has_files:
            return "metadata_only"
        if self.access_rights in ("open", "embargoed", "restricted", "closed"):
            return self.access_rights
        return "undetermined"

    @property
    def needs_deposit(self) -> bool:
        """True when Khazna holds only metadata — i.e. it's on the worklist."""
        return self.deposit_state in ("metadata_only", "closed")


# ── OAI plumbing ───────────────────────────────────────────────────────────
def _get(client: httpx.Client, params: dict) -> ET.Element:
    r = client.get(OAI_BASE, params=params)
    r.raise_for_status()
    root = ET.fromstring(r.content)
    err = root.find("oai:error", NS)
    if err is not None:
        code = err.get("code")
        if code == "noRecordsMatch":
            return root
        raise RuntimeError(f"OAI error [{code}]: {err.text}")
    return root


def _paged(verb: str, container: str, child: str,
           metadata_prefix: str = "oai_dc", oai_set: Optional[str] = None,
           from_date: Optional[str] = None,
           max_items: Optional[int] = None) -> Iterator[ET.Element]:
    params = {"verb": verb, "metadataPrefix": metadata_prefix}
    if oai_set:
        params["set"] = oai_set
    if from_date:
        params["from"] = from_date

    seen = 0
    with httpx.Client(timeout=_TIMEOUT, headers={"User-Agent": USER_AGENT},
                      follow_redirects=True) as client:
        while True:
            root = _get(client, params)
            box = root.find(f"oai:{container}", NS)
            if box is None:
                return
            for el in box.findall(f"oai:{child}", NS):
                yield el
                seen += 1
                if max_items and seen >= max_items:
                    return
            tok_el = box.find("oai:resumptionToken", NS)
            tok = (tok_el.text or "").strip() if tok_el is not None else ""
            if not tok:
                return
            if seen % 1000 < 100:
                logger.info("  …%d", seen)
            params = {"verb": verb, "resumptionToken": tok}
            time.sleep(_DELAY)


def iter_identifiers(oai_set: str, from_date: Optional[str] = None) -> Iterator[str]:
    for h in _paged("ListIdentifiers", "ListIdentifiers", "header",
                    oai_set=oai_set, from_date=from_date):
        ident = h.findtext("oai:identifier", default="", namespaces=NS)
        if ident:
            yield ident.strip()


def iter_records(oai_set: str, metadata_prefix: str = "mods",
                 from_date: Optional[str] = None,
                 max_items: Optional[int] = None) -> Iterator[ET.Element]:
    yield from _paged("ListRecords", "ListRecords", "record",
                      metadata_prefix=metadata_prefix, oai_set=oai_set,
                      from_date=from_date, max_items=max_items)


# ── Parsing ────────────────────────────────────────────────────────────────
def _texts(el: Optional[ET.Element], path: str) -> list[str]:
    if el is None:
        return []
    return [(e.text or "").strip() for e in el.findall(path, NS) if (e.text or "").strip()]


def _extract_doi(cands: list[str]) -> Optional[str]:
    for c in cands:
        m = DOI_RE.search(c)
        if m:
            return m.group(1).rstrip(".,;)").lower()
    return None


def parse_record(rec: ET.Element) -> Optional[KhaznaRecord]:
    header = rec.find("oai:header", NS)
    if header is None:
        return None
    out = KhaznaRecord(
        oai_id=(header.findtext("oai:identifier", default="", namespaces=NS) or "").strip()
    )
    md = rec.find("oai:metadata", NS)
    if md is None:
        return out

    mods = md.find("mods:mods", NS)
    if mods is not None:
        out.title = " ".join(_texts(mods, ".//mods:titleInfo/mods:title"))[:500]
        out.year = next(iter(_texts(mods, ".//mods:originInfo/mods:dateIssued")), "")
        typed = [e.text.strip() for e in mods.findall(".//mods:identifier", NS)
                 if (e.get("type") or "").lower() == "doi" and e.text]
        out.doi = _extract_doi(typed + _texts(mods, ".//mods:identifier"))
        for url_el in mods.findall(".//mods:location/mods:url", NS):
            url = (url_el.text or "").strip()
            if not url:
                continue
            if "khazna.ku.ac.ae" in url and not out.portal_url:
                out.portal_url = url
            elif url.lower().endswith(".pdf") or "/files/" in url:
                out.file_urls.append(url)

    dc = md.find("oaidc:dc", NS)
    if dc is not None:
        out.title = out.title or next(iter(_texts(dc, "dc:title")), "")
        out.year = out.year or next(iter(_texts(dc, "dc:date")), "")
        idents = _texts(dc, "dc:identifier") + _texts(dc, "dc:relation")
        out.doi = out.doi or _extract_doi(idents)
        for i in idents:
            if "khazna.ku.ac.ae" in i and not out.portal_url:
                out.portal_url = i
        # OpenAIRE access vocabulary lives in dc:rights
        for r in _texts(dc, "dc:rights"):
            key = r.strip().lower()
            if key in OPENAIRE_ACCESS:
                out.access_rights = OPENAIRE_ACCESS[key]
            m = EMBARGO_END_RE.search(r)
            if m:
                out.embargo_end = m.group(1)

    for res in md.findall(".//didl:Resource", NS):
        ref = res.get("ref")
        if ref and (ref.lower().endswith(".pdf") or "/files/" in ref):
            out.file_urls.append(ref)

    out.file_urls = sorted(set(out.file_urls))
    return out


# ── Commands ───────────────────────────────────────────────────────────────
def cmd_gap(args) -> None:
    """
    The headline number: publications:all vs publications:withFiles, per year.
    Uses ListIdentifiers only — no full records, so it's fast and light.
    """
    years = range(args.start, args.end + 1)
    print(f"{'Year':<8}{'Records':>10}{'With files':>13}{'Gap':>10}{'% deposited':>14}")
    print("-" * 55)
    tot_all = tot_files = 0
    for y in years:
        n_all = sum(1 for _ in iter_identifiers(f"publications:year{y}"))
        if n_all == 0:
            continue
        n_files = sum(1 for _ in iter_identifiers(f"publications:year{y}:withFiles"))
        tot_all += n_all
        tot_files += n_files
        print(f"{y:<8}{n_all:>10,}{n_files:>13,}{n_all - n_files:>10,}"
              f"{100 * n_files / n_all:>13.1f}%")
    print("-" * 55)
    pct = 100 * tot_files / tot_all if tot_all else 0
    print(f"{'TOTAL':<8}{tot_all:>10,}{tot_files:>13,}{tot_all - tot_files:>10,}{pct:>13.1f}%")
    print("\nThe 'Gap' column is the deposit worklist.")


def cmd_inspect(args) -> None:
    print(f"=== Sample: set={args.set} format={args.format} ===")
    for i, rec in enumerate(iter_records(args.set, args.format, max_items=args.n)):
        if args.raw:
            print(ET.tostring(rec, encoding="unicode")[:4000])
            print("-" * 70)
        print(f"[{i}] {json.dumps(asdict(parse_record(rec)), ensure_ascii=False)[:700]}\n")


def cmd_harvest(args) -> None:
    by_oai: dict[str, KhaznaRecord] = {}

    logger.info("Pass 1/3 — publications:all (%s)", args.format)
    for rec in iter_records("publications:all", args.format, from_date=args.from_date,
                            max_items=args.limit):
        r = parse_record(rec)
        if r:
            by_oai[r.oai_id] = r

    logger.info("Pass 2/3 — publications:withFiles (set membership)")
    with_files = set(iter_identifiers("publications:withFiles", from_date=args.from_date))
    for oid in with_files:
        if oid in by_oai:
            by_oai[oid].has_files = True
    logger.info("  %d records flagged as having files", len(with_files))

    logger.info("Pass 3/3 — openaire (access rights vocabulary)")
    n_rights = 0
    for rec in iter_records("openaire", "oai_dc", from_date=args.from_date):
        r = parse_record(rec)
        if r and r.oai_id in by_oai and r.access_rights:
            by_oai[r.oai_id].access_rights = r.access_rights
            by_oai[r.oai_id].embargo_end = r.embargo_end
            n_rights += 1
    logger.info("  %d records enriched with access rights", n_rights)

    index = {r.doi: asdict(r) | {"deposit_state": r.deposit_state}
             for r in by_oai.values() if r.doi}
    INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")

    states: dict[str, int] = {}
    for r in by_oai.values():
        states[r.deposit_state] = states.get(r.deposit_state, 0) + 1

    print(f"\nHarvested {len(by_oai):,} records | {len(index):,} had a DOI "
          f"({100 * len(index) / max(len(by_oai), 1):.1f}%)")
    print(f"Written to {INDEX_PATH}\n")
    print("Deposit state:")
    for k, v in sorted(states.items(), key=lambda x: -x[1]):
        print(f"  {k:<16}{v:>8,}  ({100 * v / len(by_oai):.1f}%)")
    print("\nRecords without a DOI cannot be matched by ResearchBee — "
          "if that share is large, add title-based matching.")


def cmd_lookup(args) -> None:
    if not INDEX_PATH.exists():
        sys.exit("No index. Run: python khazna_oai.py harvest")
    idx = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    hit = idx.get(args.doi.lower().strip())
    print(json.dumps(hit, indent=2, ensure_ascii=False) if hit else "Not in Khazna.")


# ── Runtime lookup for app.py ──────────────────────────────────────────────
class KhaznaIndex:
    """Load once at FastAPI startup; O(1) lookups thereafter."""

    def __init__(self, path: Path = INDEX_PATH):
        self._idx: dict[str, dict] = {}
        if path.exists():
            self._idx = json.loads(path.read_text(encoding="utf-8"))
            logger.info("Khazna index loaded: %d DOIs", len(self._idx))
        else:
            logger.warning("Khazna index missing at %s — lookups return None", path)

    def get(self, doi: str) -> Optional[dict]:
        d = (doi or "").lower().strip()
        for p in ("https://doi.org/", "http://doi.org/", "doi:"):
            if d.startswith(p):
                d = d[len(p):]
        return self._idx.get(d)

    @property
    def available(self) -> bool:
        return bool(self._idx)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    p = argparse.ArgumentParser(description="Khazna OAI-PMH harvester")
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("gap", help="deposit gap per year (fast, identifiers only)")
    g.add_argument("--start", type=int, default=2015)
    g.add_argument("--end", type=int, default=2026)
    g.set_defaults(func=cmd_gap)

    i = sub.add_parser("inspect")
    i.add_argument("--set", default="publications:withFiles")
    i.add_argument("--format", default="mods")
    i.add_argument("-n", type=int, default=3)
    i.add_argument("--raw", action="store_true")
    i.set_defaults(func=cmd_inspect)

    h = sub.add_parser("harvest")
    h.add_argument("--format", default="mods")
    h.add_argument("--from", dest="from_date", default=None,
                   help="ISO datetime for incremental harvest")
    h.add_argument("--limit", type=int, default=None)
    h.set_defaults(func=cmd_harvest)

    l = sub.add_parser("lookup")
    l.add_argument("doi")
    l.set_defaults(func=cmd_lookup)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
