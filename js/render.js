// render.js - shared rendering helpers

const MASCOT = "assets/researchbeemascot.png";
const _HF    = "https://nikeshn-researchbee.hf.space";

export function renderMascotRow(message) {
  return `
    <div class="results-mascot-row">
      <img src="${MASCOT}" class="results-mascot-img" alt="ResearchBee">
      <div class="results-mascot-bubble">${message}</div>
    </div>`;
}

export function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function quartileBadge(q) {
  if (!q || q === "-") return "";
  const cls = { Q1: "b-q1", Q2: "b-q2", Q3: "b-q3", Q4: "b-q4" }[q] || "b-muted";
  return `<span class="badge ${cls}">${esc(q)}</span>`;
}

export function confidenceBadge(c) {
  const cls = { High: "b-success", Medium: "b-warning", Low: "b-muted" }[c] || "b-muted";
  return `<span class="badge ${cls}">Fit: ${esc(c)}</span>`;
}

export function oaStatusBadge(s) {
  const cls = s === "Confirmed" ? "b-success"
    : s === "Partially confirmed" ? "b-warning" : "b-danger";
  return `<span class="badge ${cls}">OA: ${esc(s)}</span>`;
}

export function accessBadge(a) {
  const cls = a === "Open" ? "b-success" : a === "Controlled" ? "b-danger" : "b-warning";
  return `<span class="badge ${cls}">${esc(a)}</span>`;
}

export function fairBadge(f) {
  const cls = f === "High" ? "b-success" : f === "Medium" ? "b-warning" : "b-muted";
  return `<span class="badge ${cls}">FAIR: ${esc(f)}</span>`;
}

export function allowedClass(a) {
  return a === "Yes" ? "v-yes" : a === "No" ? "v-no" : "v-unclear";
}

export function renderVersionBlock(title, v) {
  if (!v) return "";
  return `
    <div class="version-card">
      <div class="v-head">
        <span class="v-title">${esc(title)}</span>
        <span class="v-allowed ${allowedClass(v.allowed)}">${esc(v.allowed || "Unclear")}</span>
      </div>
      <dl class="v-grid">
        ${v.where    ? `<div><dt>Where</dt><dd>${esc(v.where)}</dd></div>` : ""}
        ${v.embargo  ? `<div><dt>Embargo</dt><dd>${esc(v.embargo)}</dd></div>` : ""}
        ${v.licence  ? `<div><dt>Licence</dt><dd>${esc(v.licence)}</dd></div>` : ""}
        ${v.conditions ? `<div class="v-full"><dt>Conditions</dt><dd>${esc(v.conditions)}</dd></div>` : ""}
      </dl>
    </div>`;
}

export function renderVerifyLinks(vl, showScopusPrimary = true) {
  if (!vl) return "";
  return `
    <div class="verify-row">
      <span class="verify-lbl">Verify on:</span>
      ${showScopusPrimary && vl.scopus ? `<a href="${esc(vl.scopus)}" target="_blank" class="vlink vlink-scopus">Scopus</a>` : ""}
      ${vl.sherpa_romeo ? `<a href="${esc(vl.sherpa_romeo)}" target="_blank" class="vlink">Open Policy Finder</a>` : ""}
      ${!showScopusPrimary && vl.scopus ? `<a href="${esc(vl.scopus)}" target="_blank" class="vlink">Scopus</a>` : ""}
      ${vl.doaj     ? `<a href="${esc(vl.doaj)}"     target="_blank" class="vlink">DOAJ</a>`     : ""}
      ${vl.openalex ? `<a href="${esc(vl.openalex)}" target="_blank" class="vlink">OpenAlex</a>` : ""}
    </div>`;
}

export function renderOpenAlexMetrics(oa) {
  if (!oa) return "";
  const fmt = (n) => n != null ? Number(n).toLocaleString() : "-";
  const tags = [oa.is_in_doaj ? "· DOAJ-listed" : "", oa.is_oa ? "· OA journal" : ""].filter(Boolean).join(" ");
  return `
    <dl class="oa-metrics">
      <div class="oa-m"><dt>Works</dt><dd>${fmt(oa.works_count)}</dd></div>
      <div class="oa-m"><dt>Citations</dt><dd>${fmt(oa.cited_by_count)}</dd></div>
      <div class="oa-m"><dt>h-index</dt><dd>${fmt(oa.h_index)}</dd></div>
      <div class="oa-m"><dt>2-yr citedness</dt><dd>${oa.two_yr_mean_citedness != null ? Number(oa.two_yr_mean_citedness).toFixed(2) : "-"}</dd></div>
      <div class="oa-src">Source: OpenAlex ${tags}</div>
    </dl>`;
}

export function renderRankingBlock(r) {
  if (!r) return "";
  const isConfirmed  = r.verification_status === "Confirmed";
  const isDerived    = /openalex-derived/i.test(r.verification_status || "");
  const cls = isConfirmed ? "confirmed" : isDerived ? "derived" : "unverified";
  const badge = isConfirmed
    ? `<span class="badge b-success">✓ Verified by ISSN</span>`
    : isDerived
    ? `<span class="badge b-warning">[!] OpenAlex-derived</span>`
    : `<span class="badge b-danger">[!] Unverified — check manually</span>`;
  return `
    <div class="rank-box ${cls}">
      <div class="rank-head">
        <h5>📊 Journal metrics</h5>
        ${badge}
      </div>
      <dl class="rank-grid">
        <div class="rank-item"><dt>Source</dt><dd>${esc(r.source || "-")}</dd></div>
        <div class="rank-item"><dt>Year</dt><dd>${esc(r.year || "-")}</dd></div>
        <div class="rank-item"><dt>Quartile</dt><dd>${r.quartile ? `<span class="badge ${["b-q1","b-q2","b-q3","b-q4"][["Q1","Q2","Q3","Q4"].indexOf(r.quartile)] || "b-muted"}">${esc(r.quartile)}</span>` : "-"}</dd></div>
        ${r.percentile ? `<div class="rank-item"><dt>Rank/Percentile</dt><dd>${esc(r.percentile)}</dd></div>` : ""}
        ${r.category   ? `<div class="rank-item"><dt>Category</dt><dd style="font-size:11px">${esc(r.category)}</dd></div>` : ""}
        ${r.h_index    ? `<div class="rank-item"><dt>h-index</dt><dd>${esc(r.h_index)}</dd></div>` : ""}
      </dl>
      ${r.interpretation ? `<p class="rank-note">${esc(r.interpretation)}</p>` : ""}
      ${r.verification_status ? `<p class="rank-verify"><strong>Verification:</strong> ${esc(r.verification_status)}</p>` : ""}
    </div>`;
}

export function renderKhaznaCard(k, mode = "article") {
  const tip = mode === "data"
    ? "Even if depositing data in a domain-specific repository, always register metadata in Khazna so your work appears in KU's research portfolio."
    : "Deposit your accepted manuscript (or metadata record if under embargo) to Khazna for KU institutional visibility and compliance.";
  return `
    <div class="khazna-card">
      <div class="khazna-head">
        <span style="font-size:22px">🏛️</span>
        <div>
          <h3>Khazna — KU Institutional Repository</h3>
          <div style="font-size:12px;opacity:.8">khazna.ku.ac.ae</div>
        </div>
      </div>
      <div class="khazna-body">
        <p>${esc(k.message || tip)}</p>
        <div class="khazna-tip"><span>💡</span><span>${esc(tip)}</span></div>
        <div class="khazna-actions">
          <a href="${esc(k.url || "https://khazna.ku.ac.ae")}" target="_blank" class="k-btn k-btn-fill">🔗 Visit Khazna</a>
          <a href="mailto:${esc(k.contact || "khazna@ku.ac.ae")}" class="k-btn k-btn-outline">✉ khazna@ku.ac.ae</a>
          <a href="${esc(k.library_url || "https://library.ku.ac.ae/lib")}" target="_blank" class="k-btn k-btn-outline">📚 KU Library</a>
        </div>
      </div>
    </div>`;
}

export function renderHelpCard() {
  return `
    <div class="help-card">
      <div class="help-left">
        <span class="help-icon">📚</span>
        <div class="help-text">
          <h4>Need help? Contact KU Library</h4>
          <p>Not sure what to deposit, which version, or how? Our librarians can advise on open access, self-archiving, and research data management.</p>
        </div>
      </div>
      <div class="help-links">
        <a href="mailto:library@ku.ac.ae" class="k-btn k-btn-fill" style="font-size:12px;padding:7px 14px">✉ Contact Library</a>
        <a href="https://library.ku.ac.ae/lib" target="_blank" class="k-btn k-btn-outline" style="font-size:12px;padding:7px 14px">🔗 Library Website</a>
      </div>
    </div>`;
}

export function renderRepoCard(r, idx) {
  const isKhazna = r.is_khazna;
  const vl = r.verify_links || {};
  return `
    <div class="card j-card r-card ${isKhazna ? "is-khazna" : ""}">
      <div class="j-header">
        <div class="j-meta">#${idx + 1} · ${esc(r.type)} · ${esc(r.cost)}${isKhazna ? " · KU Institutional" : ""}</div>
        <div class="j-title">
          ${esc(r.name)}
          ${r.url ? `<a href="${esc(r.url)}" target="_blank" style="font-size:14px;font-family:'DM Sans',sans-serif;font-weight:400;color:var(--primary);margin-left:8px">↗ visit</a>` : ""}
        </div>
        <div class="badge-row">
          ${confidenceBadge(r.confidence)}
          ${accessBadge(r.access_model)}
          ${fairBadge(r.fair_alignment)}
          ${r.certification && r.certification !== "None" ? `<span class="badge b-accent">${esc(r.certification)}</span>` : ""}
        </div>
      </div>
      <div class="j-body">
        <p style="color:var(--text-muted);font-size:13px">${esc(r.scope)}</p>
        <div class="detail-grid">
          <div class="detail-item"><h5>Why it fits</h5><p>${esc(r.fit_reason)}</p></div>
          <div class="detail-item"><h5>Data types</h5><p>${esc(r.data_types_accepted)}</p></div>
        </div>
        <hr class="divider">
        <dl class="r-specs">
          <div><dt>Max file size</dt><dd>${esc(r.max_file_size)}</dd></div>
          <div><dt>Licences</dt><dd>${esc(r.licences_supported)}</dd></div>
          <div><dt>Persistent ID</dt><dd>${esc(r.persistent_identifier)}</dd></div>
          <div><dt>Versioning</dt><dd>${esc(r.versioning)}</dd></div>
          <div><dt>Embargo support</dt><dd>${esc(r.embargo_support)}</dd></div>
          <div><dt>Sensitive data</dt><dd>${esc(r.sensitive_data_suitable)}</dd></div>
        </dl>
        ${r.funder_compliance_note ? `<div class="policy-notes"><p><strong>Funder compliance:</strong> ${esc(r.funder_compliance_note)}</p></div>` : ""}
        ${r.risk_flag ? `<p style="color:var(--danger);font-size:13px;display:flex;gap:6px;align-items:flex-start"><span>[!]</span><span>${esc(r.risk_flag)}</span></p>` : ""}
        <p style="font-size:12px"><strong>Verification:</strong> ${esc(r.verification_status)}</p>
        ${!isKhazna ? `
          <div class="verify-row">
            <span class="verify-lbl">Verify on:</span>
            ${vl.re3data     ? `<a href="${esc(vl.re3data)}"     target="_blank" class="vlink">re3data ↗</a>` : ""}
            ${vl.fairsharing ? `<a href="${esc(vl.fairsharing)}" target="_blank" class="vlink">FAIRsharing ↗</a>` : ""}
          </div>` : `
          <div class="verify-row">
            <span class="verify-lbl">Contact:</span>
            <a href="mailto:khazna@ku.ac.ae" class="vlink">khazna@ku.ac.ae</a>
            <a href="https://khazna.ku.ac.ae" target="_blank" class="vlink">khazna.ku.ac.ae ↗</a>
          </div>`}
      </div>
    </div>`;
}

export function renderNextActions(actions, global_notes) {
  if (!actions?.length) return "";
  return `
    <div class="card mt-6">
      <div class="card-header"><h2>✅ Next best actions</h2></div>
      <div class="card-body">
        <ol class="actions-list">
          ${actions.map((a, i) => `
            <li class="action-item">
              <span class="a-num">${i + 1}</span>
              <span>${esc(a)}</span>
            </li>`).join("")}
        </ol>
        ${global_notes ? `<p class="global-note">${esc(global_notes)}</p>` : ""}
      </div>
    </div>`;
}

export function renderManuscriptUnderstanding(m) {
  if (!m) return "";
  return `
    <div class="card understanding">
      <div class="card-header"><h2>🧠 Manuscript understanding</h2></div>
      <div class="card-body">
        <p style="font-size:14px">${esc(m.summary)}</p>
        <div class="tag-row">
          ${m.discipline   ? `<span class="badge b-primary">${esc(m.discipline)}</span>` : ""}
          ${m.article_type ? `<span class="badge b-muted">${esc(m.article_type)}</span>` : ""}
        </div>
        ${m.inferred_criteria?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">Inferred selection criteria</h5>
            <ul style="list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:3px">
              ${m.inferred_criteria.map(c => `<li style="font-size:13px;color:var(--text-muted)">${esc(c)}</li>`).join("")}
            </ul>
          </div>` : ""}
        ${m.assumptions?.length ? `
          <div class="acc">
            <button class="acc-btn" onclick="this.nextElementSibling.classList.toggle('open')">
              Assumptions made (${m.assumptions.length}) <span>▾</span>
            </button>
            <div class="acc-body">
              <ul>${m.assumptions.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
            </div>
          </div>` : ""}
      </div>
    </div>`;
}

export function renderSubmissionChecklist(sc) {
  if (!sc) return "";
  const steps = (sc.key_steps || []).map((s, i) =>
    `<li class="action-item"><span class="a-num">${i+1}</span><span>${esc(s)}</span></li>`
  ).join("");
  const docs = (sc.required_documents || []).map(d =>
    `<li style="font-size:13px;color:var(--text-muted)">${esc(d)}</li>`
  ).join("");
  return `
    <div class="acc">
      <button class="acc-btn" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.acc-arrow').classList.toggle('open')">
        <span>📋 Submission checklist &amp; requirements</span>
        <span class="acc-arrow" style="transition:transform .2s;display:inline-block">▾</span>
      </button>
      <div class="acc-body">
        <dl class="r-specs" style="margin-bottom:12px">
          <div><dt>Submission system</dt><dd>${esc(sc.submission_system || "Not specified")}</dd></div>
          <div><dt>Word limit</dt><dd>${esc(sc.word_limit || "Not specified")}</dd></div>
          <div><dt>Cover letter required</dt><dd>${esc(sc.cover_letter_required || "Unclear")}</dd></div>
          <div><dt>Data availability</dt><dd>${esc(sc.data_availability_statement || "Unclear")}</dd></div>
          <div><dt>Ethical approval</dt><dd>${esc(sc.ethical_approval || "If applicable")}</dd></div>
        </dl>
        ${sc.formatting_notes ? `<p style="font-size:13px;margin-bottom:10px"><strong>Formatting:</strong> ${esc(sc.formatting_notes)}</p>` : ""}
        ${docs ? `<div style="margin-bottom:10px"><strong style="font-size:13px">Required documents:</strong><ul style="list-style:disc;padding-left:18px;margin-top:4px">${docs}</ul></div>` : ""}
        ${steps ? `<div><strong style="font-size:13px">Key submission steps:</strong><ol class="actions-list" style="margin-top:6px">${steps}</ol></div>` : ""}
      </div>
    </div>`;
}

export function renderCoverLetterBtn(journal, manuscript) {
  const safe = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " ");
  const jName  = safe(journal.name);
  const jPub   = safe(journal.publisher);
  const mTitle = safe(manuscript?.title);
  const mAbs   = safe((manuscript?.abstract || "").substring(0, 300));
  const mType  = safe(manuscript?.article_type || "Original research article");
  const mDisc  = safe(manuscript?.discipline);
  const uid    = (journal.issn || journal.name || "").replace(/[^a-zA-Z0-9]/g, "");
  return `
    <button class="btn btn-ghost" style="margin-top:4px;font-size:13px"
      onclick="generateCoverLetter('${jName}','${jPub}','${mTitle}','${mAbs}','${mType}','${mDisc}','${uid}',this)">
      ✉ Generate cover letter
    </button>
    <div id="cover-letter-${uid}"></div>`;
}

// ── Altmetric badge — async loaded after journal cards render ─────────────
export function renderAltmetricPlaceholder(issn) {
  if (!issn) return "";
  const uid = issn.replace(/[^a-zA-Z0-9]/g, "");
  return `<div id="altmetric-${uid}"></div>`;
}

export async function loadAltmetricBadge(issn) {
  if (!issn) return;
  const uid       = issn.replace(/[^a-zA-Z0-9]/g, "");
  const container = document.getElementById(`altmetric-${uid}`);
  if (!container) return;

  try {
    const r = await fetch(`${_HF}/api/altmetric?issn=${encodeURIComponent(issn)}`);
    if (!r.ok) return;
    const data = await r.json();
    if (!data.score) return;

    container.innerHTML = `
      <div class="altmetric-wrap">
        <span class="altmetric-label">Altmetric</span>
        ${data.image
          ? `<a href="${data.url || '#'}" target="_blank" rel="noopener">
               <img src="${data.image}" class="altmetric-img" alt="Altmetric score ${data.score}">
             </a>`
          : `<a href="${data.url || '#'}" target="_blank" class="altmetric-score-pill">${data.score}</a>`}
        <span class="altmetric-score-label">Score: <strong>${data.score}</strong></span>
        <a href="https://www.altmetric.com/about-our-data/our-sources/"
           target="_blank" class="altmetric-src">What is this?</a>
      </div>`;
  } catch (_) { /* silent fail — Altmetric is optional enrichment */ }
}

// ── Related works accordion — lazy loaded on click ────────────────────────
export function renderRelatedWorksAccordion(journal) {
  const sourceId = (journal.openalex || {}).openalex_id || "";
  const issn     = journal.issn || "";
  if (!sourceId && !issn) return "";

  const uid = (issn || sourceId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  return `
    <div class="acc" style="margin-top:0">
      <button class="acc-btn" onclick="
        this.nextElementSibling.classList.toggle('open');
        this.querySelector('.acc-arrow').classList.toggle('open');
        window._loadRelatedWorks('${uid}', '${sourceId}', '${issn}');
      ">
        <span>📄 Related works in this journal</span>
        <span class="acc-arrow" style="transition:transform .2s;display:inline-block">▾</span>
      </button>
      <div class="acc-body" id="rw-${uid}">
        <!-- Sub-tabs: Highly Cited | Papers Citing -->
        <div class="rw-tabs" style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:10px">
          <button class="rw-tab active" id="rwtab-cited-${uid}"
            onclick="window._switchRwTab('${uid}','cited')"
            style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid #4338CA;color:#4338CA;font-family:'DM Sans',sans-serif">
            Highly cited
          </button>
          <button class="rw-tab" id="rwtab-chain-${uid}"
            onclick="window._switchRwTab('${uid}','chain')"
            style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:var(--text-muted);font-family:'DM Sans',sans-serif">
            Citation chain
          </button>
        </div>
        <div id="rwpanel-cited-${uid}"><div class="rw-loading">Loading...</div></div>
        <div id="rwpanel-chain-${uid}" style="display:none">
          <p style="font-size:12px;color:var(--text-muted);padding:4px 0 8px">
            Select a paper from "Highly cited" first, then click <strong>See who cites this →</strong>
          </p>
        </div>
      </div>
    </div>`;
}

window._switchRwTab = function(uid, tab) {
  ["cited","chain"].forEach(t => {
    const btn   = document.getElementById(`rwtab-${t}-${uid}`);
    const panel = document.getElementById(`rwpanel-${t}-${uid}`);
    if (!btn || !panel) return;
    const active = t === tab;
    btn.style.borderBottomColor = active ? "#4338CA" : "transparent";
    btn.style.color = active ? "#4338CA" : "var(--text-muted)";
    panel.style.display = active ? "block" : "none";
  });
};

// Global — called from inline onclick in renderRelatedWorksAccordion
window._loadRelatedWorks = async function(uid, sourceId, issn) {
  const container = document.getElementById(`rw-${uid}`);
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = "1";
  container.innerHTML = `<div class="rw-loading">Loading...</div>`;

  try {
    const id = sourceId.replace("https://openalex.org/sources/", "").replace(/^S/, "");
    if (!id) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">No OpenAlex ID available for this journal.</p>`;
      return;
    }

    const r = await fetch(`${_HF}/api/openalex-works?source_id=${encodeURIComponent(id)}&per_page=5`);
    if (!r.ok) throw new Error("API error");

    const data  = await r.json();
    const works = data.works || [];

    if (!works.length) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">No works data available for this journal.</p>`;
      return;
    }

    const rows = works.map((w, i) => {
      const doi    = w.doi    ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      const oaLink = w.openalex_url ? `<a href="${w.openalex_url}" target="_blank" class="vlink" style="font-size:11px">OpenAlex ↗</a>` : "";
      const authors = (w.authors || []).slice(0, 3).join(", ");
      const workId = w.openalex_url || "";
      const chainUid = uid + i;
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}</div>` : ""}
          <div class="rw-meta">
            ${w.year    ? `<span>${w.year}</span>` : ""}
            ${w.cited_by ? `<span>📊 ${w.cited_by.toLocaleString()} citations</span>` : ""}
            ${doi} ${oaLink}
            ${workId ? `<button onclick="window._startCitationChain('${uid}','${workId}','${(w.title||'').replace(/'/g,'').slice(0,40)}')"
              style="font-size:11px;background:#e0e7ff;color:#4338CA;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;font-family:'DM Sans',sans-serif">
              See who cites this →
            </button>` : ""}
          </div>
        </div>`;
    }).join("");

    // Store the panel ref for later (citation chain needs it)
    container._uid = uid;

    container.innerHTML = `
      <div class="rw-list">
        ${rows}
        <div class="rw-src">Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a></div>
      </div>`;
  } catch (e) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">Could not load works data.</p>`;
  }
};

// ── Deeper Analysis Strip — links to Scopus, WoS, SciVal ─────────────────
const KU_PROXY = "http://login.khalifa.idm.oclc.org/login?url=";
const SCOPUS_URL  = `${KU_PROXY}https://www.scopus.com`;
const WOS_URL     = `${KU_PROXY}https://www.webofscience.com`;
const SCIVAL_URL  = `${KU_PROXY}https://www.scival.com`;

export function renderDeeperAnalysisStrip(journalName, issn) {
  const q = issn
    ? `${KU_PROXY}https://www.scopus.com/sources?ORIGIN=SRCTITLE&title=${encodeURIComponent(journalName)}`
    : `${KU_PROXY}https://www.scopus.com/sources`;
  return `
    <div class="deeper-analysis-strip">
      <span class="deeper-analysis-label">🔬 Deeper analysis:</span>
      <a href="${esc(q)}"          target="_blank" rel="noopener" class="da-link da-scopus">📊 Scopus Sources</a>
      <a href="${esc(WOS_URL)}"    target="_blank" rel="noopener" class="da-link da-wos">🔬 Web of Science</a>
      <a href="${esc(SCIVAL_URL)}" target="_blank" rel="noopener" class="da-link da-scival">📈 SciVal</a>
    </div>`;
}

export function renderSubjectDeeperAnalysisStrip() {
  return `
    <div class="subject-deeper-strip">
      <span style="font-size:13px;font-weight:600;color:var(--text-muted)">🔬 For citation analysis, author metrics &amp; research performance:</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <a href="${esc(SCOPUS_URL)}"  target="_blank" rel="noopener" class="da-link da-scopus">📊 Scopus</a>
        <a href="${esc(WOS_URL)}"     target="_blank" rel="noopener" class="da-link da-wos">🔬 Web of Science</a>
        <a href="${esc(SCIVAL_URL)}"  target="_blank" rel="noopener" class="da-link da-scival">📈 SciVal</a>
        <a href="https://library.ku.ac.ae/lib" target="_blank" rel="noopener" class="da-link da-library">🏛️ KU Library</a>
      </div>
    </div>`;
}

// ── Trending papers placeholder — loaded async via window._loadTrendingPapers ─
export function renderTrendingPapersSection(concept, conceptId) {
  if (!concept && !conceptId) return "";
  const uid = (concept || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "topic";
  const _HF = "https://nikeshn-researchbee.hf.space";
  return `
    <div class="trending-papers-wrap">
      <button class="ext-toggle" onclick="
        this.classList.toggle('open');
        var b = this.nextElementSibling;
        b.style.display = b.style.display === 'none' || b.style.display === '' ? 'block' : 'none';
        window._loadTrendingPapers('${uid}', '${encodeURIComponent(conceptId || concept || "")}', '${esc(concept || "")}');
      ">
        <span>📈 Trending papers in ${esc(concept || "this field")}</span>
        <span class="ext-arrow">▼</span>
      </button>
      <div id="trending-${uid}" style="display:none;margin-top:6px">
        <div style="font-size:12px;color:var(--text-muted);padding:8px">Click to load trending papers...</div>
      </div>
    </div>`;
}

// Global — called from inline onclick
window._loadTrendingPapers = async function(uid, conceptParam, conceptLabel) {
  const container = document.getElementById(`trending-${uid}`);
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = "1";
  container.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px">Loading trending papers...</div>`;

  try {
    const _HF = "https://nikeshn-researchbee.hf.space";
    const concept = decodeURIComponent(conceptParam);
    // Use OpenAlex works API — filter by concept, sort by citation, last 3 years
    const year = new Date().getFullYear() - 3;
    const filter = concept.startsWith("C")
      ? `concepts.id:${concept},publication_year:>${year},is_retracted:false`
      : `concepts.display_name.search:${encodeURIComponent(concept)},publication_year:>${year},is_retracted:false`;

    const r = await fetch(
      `https://api.openalex.org/works?filter=${filter}&sort=cited_by_count:desc&per_page=5&select=id,title,publication_year,doi,cited_by_count,authorships,primary_location`
    );
    if (!r.ok) throw new Error("API error");
    const data  = await r.json();
    const works = data.results || [];

    if (!works.length) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:8px">No trending papers found for this field.</p>`;
      return;
    }

    const rows = works.map((w, i) => {
      const authors = (w.authorships || []).slice(0,3).map(a => a?.author?.display_name || "").filter(Boolean).join(", ");
      const journal = w.primary_location?.source?.display_name || "";
      const doi     = w.doi ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      const oaLink  = w.id  ? `<a href="${w.id}"  target="_blank" class="vlink" style="font-size:11px">OpenAlex ↗</a>` : "";
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}${journal ? ` · <em>${journal}</em>` : ""}</div>` : ""}
          <div class="rw-meta">
            ${w.publication_year ? `<span>${w.publication_year}</span>` : ""}
            ${w.cited_by_count   ? `<span>📊 ${w.cited_by_count.toLocaleString()} citations</span>` : ""}
            ${doi} ${oaLink}
          </div>
        </div>`;
    }).join("");

    container.innerHTML = `
      <div class="rw-list">
        ${rows}
        <div class="rw-src">Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a> · Most cited in last 3 years</div>
      </div>`;
  } catch(e) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:8px">Could not load trending papers.</p>`;
  }
};

// ── Citation chaining — forward citations for a specific paper ────────────
window._loadCitedBy = async function(workId, uid) {
  const container = document.getElementById(`citedby-${uid}`);
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = "1";
  container.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px">Loading citing papers...</div>`;

  try {
    const cleanId = workId.replace("https://openalex.org/", "");
    const r = await fetch(
      `https://api.openalex.org/works?filter=cites:${cleanId}&sort=cited_by_count:desc&per_page=5&select=id,title,publication_year,doi,cited_by_count,authorships`
    );
    if (!r.ok) throw new Error("API error");
    const data  = await r.json();
    const works = data.results || [];

    if (!works.length) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:8px">No citing papers found.</p>`;
      return;
    }

    const rows = works.map(w => {
      const authors = (w.authorships || []).slice(0,2).map(a => a?.author?.display_name || "").filter(Boolean).join(", ");
      const doi = w.doi ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}</div>` : ""}
          <div class="rw-meta">
            ${w.publication_year ? `<span>${w.publication_year}</span>` : ""}
            ${w.cited_by_count   ? `<span>📊 ${w.cited_by_count.toLocaleString()} citations</span>` : ""}
            ${doi}
          </div>
        </div>`;
    }).join("");

    container.innerHTML = `<div class="rw-list">${rows}<div class="rw-src">Papers citing this work · Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a></div></div>`;
  } catch(e) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:8px">Could not load citing papers.</p>`;
  }
};
// ── Start citation chain from a selected paper ────────────────────────────
window._startCitationChain = async function(uid, workId, title) {
  // Switch to citation chain tab
  window._switchRwTab(uid, "chain");
  const chainPanel = document.getElementById(`rwpanel-chain-${uid}`);
  if (!chainPanel) return;
  chainPanel.innerHTML = `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Papers citing: <strong>${title}...</strong></p><div class="rw-loading">Loading...</div>`;

  try {
    const cleanId = workId.replace("https://openalex.org/", "");
    const r = await fetch(
      `https://api.openalex.org/works?filter=cites:${cleanId}&sort=cited_by_count:desc&per_page=5&select=id,title,publication_year,doi,cited_by_count,authorships`
    );
    if (!r.ok) throw new Error();
    const data  = await r.json();
    const works = data.results || [];

    if (!works.length) {
      chainPanel.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">No citing papers found for this work.</p>`;
      return;
    }

    const rows = works.map(w => {
      const authors = (w.authorships || []).slice(0,2).map(a => a?.author?.display_name || "").filter(Boolean).join(", ");
      const doi = w.doi ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}</div>` : ""}
          <div class="rw-meta">
            ${w.publication_year ? `<span>${w.publication_year}</span>` : ""}
            ${w.cited_by_count   ? `<span>📊 ${w.cited_by_count.toLocaleString()} citations</span>` : ""}
            ${doi}
          </div>
        </div>`;
    }).join("");

    chainPanel.innerHTML = `
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Papers citing: <strong>${title}...</strong></p>
      <div class="rw-list">${rows}
        <div class="rw-src">Forward citations · Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a></div>
      </div>
      <button onclick="window._switchRwTab('${uid}','cited')" style="font-size:11px;margin-top:6px;background:none;border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer;color:var(--text-muted);font-family:'DM Sans',sans-serif">← Back to highly cited</button>`;
  } catch(e) {
    chainPanel.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">Could not load citing papers.</p>`;
  }
};
