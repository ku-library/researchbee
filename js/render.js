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
        <span>📄 View highly cited works in this journal</span>
        <span class="acc-arrow" style="transition:transform .2s;display:inline-block">▾</span>
      </button>
      <div class="acc-body" id="rw-${uid}">
        <div class="rw-loading">Click to load...</div>
      </div>
    </div>`;
}

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

    const rows = works.map(w => {
      const doi    = w.doi    ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      const oaLink = w.openalex_url ? `<a href="${w.openalex_url}" target="_blank" class="vlink" style="font-size:11px">OpenAlex ↗</a>` : "";
      const authors = (w.authors || []).slice(0, 3).join(", ");
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}</div>` : ""}
          <div class="rw-meta">
            ${w.year    ? `<span>${w.year}</span>` : ""}
            ${w.cited_by ? `<span>📊 ${w.cited_by.toLocaleString()} citations</span>` : ""}
            ${doi} ${oaLink}
          </div>
        </div>`;
    }).join("");

    container.innerHTML = `
      <div class="rw-list">
        ${rows}
        <div class="rw-src">Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a></div>
      </div>`;
  } catch (e) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">Could not load works data.</p>`;
  }
};
