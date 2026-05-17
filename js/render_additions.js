

// ─── New exports for Altmetric + Related Works ────────────────────────────
// HF_BASE duplicated here so render.js stays self-contained
const _HF = "https://nikeshn-researchbee.hf.space";

export function renderAltmetricPlaceholder(issn) {
  if (!issn) return "";
  const uid = issn.replace(/[^a-zA-Z0-9]/g, "");
  return `<div id="altmetric-${uid}" class="altmetric-loading"></div>`;
}

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
        <div class="rw-loading">Loading...</div>
      </div>
    </div>`;
}

// Called from inline onclick — global scope
window._loadRelatedWorks = async function(uid, sourceId, issn) {
  const container = document.getElementById(`rw-${uid}`);
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = "1";

  try {
    const id = sourceId.replace("https://openalex.org/sources/", "").replace(/^S/, "");
    if (!id) { container.innerHTML = "<p style='font-size:13px;color:var(--text-muted)'>No OpenAlex ID available.</p>"; return; }

    const r = await fetch(`${_HF}/api/openalex-works?source_id=${encodeURIComponent(id)}&per_page=5`);
    if (!r.ok) throw new Error("API error");
    const data  = await r.json();
    const works = data.works || [];

    if (!works.length) {
      container.innerHTML = "<p style='font-size:13px;color:var(--text-muted)'>No works data available for this journal.</p>";
      return;
    }

    const rows = works.map(w => {
      const doi = w.doi ? `<a href="${w.doi}" target="_blank" class="vlink" style="font-size:11px">DOI ↗</a>` : "";
      const oaLink = w.openalex_url ? `<a href="${w.openalex_url}" target="_blank" class="vlink" style="font-size:11px">OpenAlex ↗</a>` : "";
      const authors = (w.authors || []).join(", ");
      return `
        <div class="rw-item">
          <div class="rw-title">${w.title || "Untitled"}</div>
          ${authors ? `<div class="rw-authors">${authors}</div>` : ""}
          <div class="rw-meta">
            ${w.year ? `<span>${w.year}</span>` : ""}
            ${w.cited_by ? `<span>📊 ${w.cited_by.toLocaleString()} citations</span>` : ""}
            ${doi} ${oaLink}
          </div>
        </div>`;
    }).join("");

    container.innerHTML = `<div class="rw-list">${rows}<div class="rw-src">Source: <a href="https://openalex.org" target="_blank" class="vlink">OpenAlex</a></div></div>`;
  } catch (e) {
    container.innerHTML = "<p style='font-size:13px;color:var(--text-muted)'>Could not load works data.</p>";
  }
};

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
          ? `<a href="${data.url || '#'}" target="_blank" rel="noopener"><img src="${data.image}" class="altmetric-img" alt="Altmetric ${data.score}"></a>`
          : `<a href="${data.url || '#'}" target="_blank" class="altmetric-score-pill">${data.score}</a>`}
        <span class="altmetric-score-label">Score: <strong>${data.score}</strong></span>
        <a href="https://www.altmetric.com/about-our-data/our-sources/" target="_blank" class="altmetric-src">What is this?</a>
      </div>`;
  } catch (_) { /* silent fail */ }
}
