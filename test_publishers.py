"""
test_publishers.py — validate oaworks.py against real articles from the
publishers that matter most to KU.

No DOIs are hardcoded. For each publisher we:
    1. pick a representative journal from your SCImago CSV (deterministic)
    2. ask Crossref for a real recent DOI from that journal
    3. query OA.Works permissions for it
    4. print a comparison table

Usage:
    python test_publishers.py                       # top KU-relevant publishers
    python test_publishers.py --publisher Wiley     # just one
    python test_publishers.py --q1-only             # restrict to Q1 journals
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
import sys
from pathlib import Path

import httpx

import oaworks

SCIMAGO = Path("scimagojr_2025.csv")
CROSSREF = "https://api.crossref.org"
MAILTO = oaworks.CONTACT
UA = oaworks.USER_AGENT

# Publisher group -> substrings matched against the SCImago Publisher column.
PUBLISHERS: dict[str, list[str]] = {
    "Wiley":            ["wiley", "blackwell"],
    "Emerald":          ["emerald"],
    "SAGE":             ["sage publications"],
    "Oxford UP":        ["oxford university press"],
    "Cambridge UP":     ["cambridge university press"],
    "IEEE":             ["institute of electrical and electronics engineers"],
    "ACS":              ["american chemical society"],
    "MDPI":             ["multidisciplinary digital publishing"],
    "Frontiers":        ["frontiers media"],
    "De Gruyter":       ["de gruyter"],
    "Wolters Kluwer":   ["wolters kluwer", "lippincott"],
    "IOP":              ["iop publishing", "institute of physics"],
    "RSC":              ["royal society of chemistry"],
    "ACM":              ["association for computing machinery"],
    "Elsevier":         ["elsevier"],
    "Springer Nature":  ["springer"],
    "Taylor & Francis": ["taylor and francis", "routledge"],
}

ISSN_RE = re.compile(r"\d{4}-?\d{3}[\dXx]")


def _norm(s: str) -> str:
    s = (s or "").lower().replace("&amp;", "&").replace("&", "and")
    return re.sub(r"\s+", " ", s.replace(".", "").replace(",", "")).strip()


def pick_journals(q1_only: bool = False) -> dict[str, tuple[str, str]]:
    """publisher -> (journal title, ISSN), chosen by highest SJR rank."""
    if not SCIMAGO.exists():
        sys.exit(f"{SCIMAGO} not found — run this from the ResearchBee directory.")

    picks: dict[str, tuple[str, str]] = {}
    with SCIMAGO.open(encoding="latin-1", newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("Type") != "journal":
                continue
            if q1_only and row.get("SJR Best Quartile") != "Q1":
                continue
            pub = _norm(row.get("Publisher", ""))
            if not pub:
                continue
            issns = ISSN_RE.findall(row.get("Issn", "") or "")
            if not issns:
                continue
            issn = issns[0]
            if "-" not in issn:
                issn = f"{issn[:4]}-{issn[4:]}"
            for label, toks in PUBLISHERS.items():
                if label in picks:
                    continue
                if any(t in pub for t in toks):
                    picks[label] = (row.get("Title", ""), issn)
    return picks


async def doi_for_issn(client: httpx.AsyncClient, issn: str) -> str:
    """Ask Crossref for one real, recent journal article DOI."""
    try:
        r = await client.get(
            f"{CROSSREF}/journals/{issn}/works",
            params={"rows": 1, "filter": "type:journal-article,from-pub-date:2022-01-01",
                    "select": "DOI,title", "mailto": MAILTO},
        )
        if r.status_code != 200:
            return ""
        items = r.json().get("message", {}).get("items", [])
        return items[0].get("DOI", "") if items else ""
    except (httpx.HTTPError, ValueError):
        return ""


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--publisher", help="test a single publisher label")
    ap.add_argument("--q1-only", action="store_true")
    args = ap.parse_args()

    picks = pick_journals(args.q1_only)
    if args.publisher:
        picks = {k: v for k, v in picks.items()
                 if k.lower() == args.publisher.lower()}
        if not picks:
            sys.exit(f"Unknown publisher. Options: {', '.join(PUBLISHERS)}")

    print(f"{'Publisher':<18}{'Journal':<34}{'ISSN':<11}DOI")
    print("-" * 100)
    rows = []
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": UA}) as client:
        for label, (title, issn) in picks.items():
            doi = await doi_for_issn(client, issn)
            print(f"{label:<18}{title[:32]:<34}{issn:<11}{doi or '— none found —'}")
            if doi:
                rows.append((label, title, doi))
            await asyncio.sleep(0.3)

    print("\n" + "=" * 100)
    print("OA.WORKS PERMISSIONS")
    print("=" * 100)
    hdr = f"{'Publisher':<18}{'preprint':<26}{'postprint':<26}{'licence':<22}{'oa_type'}"
    print(hdr)
    print("-" * 100)

    for label, title, doi in rows:
        payload = await oaworks.fetch_permissions(doi, ror=oaworks.KU_ROR)
        green = oaworks.parse_permissions(payload)
        if not green:
            print(f"{label:<18}{'no permission record':<26}")
            continue

        def cell(slot: str) -> str:
            s = green[slot]
            if s["allowed"] != "Yes":
                return s["allowed"]
            emb = s["embargo"]
            if emb.startswith("Not stated"):
                return "Yes / embargo not stated"
            return f"Yes / {emb.split(' (')[0]}"

        print(f"{label:<18}{cell('preprint'):<26}{cell('postprint'):<26}"
              f"{green['_licence'][:20]:<22}{green['journal_oa_type']}")
        if green["deposit_statement"]:
            print(f"{'':<18}stmt: {green['deposit_statement'][:72]}…")
        await asyncio.sleep(0.4)

    print("\nNotes:")
    print(" * 'embargo not stated' means the record carries no embargo field —")
    print("   verify against the publisher's own policy before advising immediate deposit.")
    print(" * Elsevier publishes separate UK (12mo) and non-UK (24mo) embargoes;")
    print("   oaworks.py deliberately selects the longer one for KU.")


if __name__ == "__main__":
    asyncio.run(main())
