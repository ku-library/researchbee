// journal.js — Journal submission tab
import { callAPI, getModel } from "./api.js";
import { showProgress, setStep, doneProgress } from "./app.js";
import {
  esc, quartileBadge, confidenceBadge, oaStatusBadge,
  renderVersionBlock, renderVerifyLinks, renderOpenAlexMetrics,
  renderRankingBlock, renderKhaznaCard, renderHelpCard,
  renderNextActions, renderManuscriptUnderstanding
} from "./render.js";

export function journalTab() {
  const form    = document.getElementById("journal-form");
  const results = document.getElementById("journal-results");
  const resetBtn= document.getElementById("journal-reset");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector(".btn-primary");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner">⏳</span> Analysing...`;
    results.innerHTML = "";
    results.classList.remove("hidden");

    showProgress("journal-progress", [
      "Analysing your manuscript...",
      "Matching journals to your criteria...",
      "Enriching with journal metrics...",
      "Building results..."
    ]);

    try {
      const manuscript = getManuscriptData();
      setStep("journal-progress", 1);
      const data = await callAPI("/api/analyze-journal", { manuscript, model: getModel() });
      setStep("journal-progress", 2);
      await new Promise(r => setTimeout(r, 300));
      setStep("journal-progress", 3);
      const result = data.result;
      const total = (result.journals?.length || 0) + (result.extended_list?.length || 0);
      doneProgress("journal-progress", `✅ ${total} journals found — ${result.journals?.length || 0} detailed · ${result.extended_list?.length || 0} quick matches`);
      setTimeout(() => renderJournalResults(result, results), 400);
    } catch (err) {
      document.getElementById("journal-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)"><span class="p-dot" style="background:var(--danger)"></span><span>Error: ${esc(err.message)}</span></div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🔍</span> Find journals & check OA policy`;
    }
  });

  resetBtn?.addEventListener("click", () => {
    results.innerHTML = "";
    results.classList.add("hidden");
    document.getElementById("journal-progress")?.classList.remove("show");
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function getManuscriptData() {
  const g = (id) => document.getElementById(id)?.value?.trim() || "";
  return {
    title:               g("j-title"),
    abstract:            g("j-abstract"),
    keywords:            g("j-keywords"),
    discipline:          g("j-discipline"),
    article_type:        g("j-article-type"),
    methods:             g("j-methods"),
    audience:            g("j-audience"),
    funder:              g("j-funder"),
    institution:         g("j-institution"),
    country:             g("j-country"),
    apc_budget:          g("j-apc"),
    oa_preference:       g("j-oa-pref"),
    ranking_preference:  g("j-ranking-pref"),
    ranking_source:      g("j-ranking-src"),
    speed_preference:    g("j-speed"),
    preferred_journals:  g("j-preferred"),
    avoid_journals:      g("j-avoid"),
    repository_target:   g("j-repo-target"),
  };
}

function renderJournalCard(j, idx) {
  const oa = j.green_oa || {};
  const policyNotes = [
    oa.licence_notes         ? `<p><strong>Licence notes:</strong> ${esc(oa.licence_notes)}</p>` : "",
    oa.repository_action_note? `<p><strong>Repository action:</strong> ${esc(oa.repository_action_note)}</p>` : "",
    oa.evidence_note         ? `<p style="font-style:italic;font-size:12px;color:var(--text-muted)">Evidence: ${esc(oa.evidence_note)}</p>` : "",
    oa.risk_flag             ? `<p class="p-risk">⚠ <span><strong>Risk:</strong> ${esc(oa.risk_flag)}</span></p>` : "",
  ].filter(Boolean).join("");

  return `
    <div class="card j-card">
      <div class="j-header">
        <div class="j-meta">#${idx + 1} · ${esc(j.publisher || "")}${j.issn ? ` · ISSN ${esc(j.issn)}` : ""}</div>
        <div class="j-title">${esc(j.name)}</div>
        <div class="badge-row">
          ${confidenceBadge(j.confidence)}
          ${j.ranking?.quartile ? quartileBadge(j.ranking.quartile) : ""}
          ${oaStatusBadge(oa.policy_status || "Not confirmed")}
        </div>
      </div>
      <div class="j-body">
        <div class="detail-grid">
          <div class="detail-item"><h5>🎯 Why it fits</h5><p>${esc(j.fit_reason)}</p></div>
          <div class="detail-item"><h5>👥 Audience match</h5><p>${esc(j.audience_match)}</p></div>
          <div class="detail-item"><h5>📝 Submission strategy</h5><p>${esc(j.submission_strategy)}</p></div>
          <div class="detail-item"><h5>🔓 OA / compliance</h5><p>${esc(j.oa_compliance_note)}</p></div>
        </div>

        ${renderRankingBlock(j.ranking)}

        <hr class="divider">

        <div>
          <h5 style="font-size:14px;font-weight:600;margin-bottom:10px">🛡 Green OA / self-archiving by version</h5>
          <div class="version-list">
            ${renderVersionBlock("Submitted version / preprint", oa.preprint)}
            ${renderVersionBlock("Accepted manuscript (AAM / postprint)", oa.postprint)}
            ${renderVersionBlock("Published version (Version of Record)", oa.published_version)}
          </div>
        </div>

        ${policyNotes ? `<div class="policy-notes">${policyNotes}</div>` : ""}
        ${renderOpenAlexMetrics(j.openalex)}
        ${renderVerifyLinks(j.verify_links)}
      </div>
    </div>`;
}

function renderExtendedList(list) {
  if (!list?.length) return "";
  const rows = list.map((j, i) => {
    const vl = j.verify_links || {};
    const q  = j.quartile;
    return `
      <tr>
        <td>${i + 6}</td>
        <td><strong>${esc(j.name)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${esc(j.publisher || "")}</span></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${esc(j.issn || "—")}</td>
        <td>${q ? quartileBadge(q) : '<span style="color:var(--text-light);font-size:12px">—</span>'}</td>
        <td style="font-size:12px;color:var(--text-muted)">${esc(j.fit_reason || "")}</td>
        <td>
          <div class="ext-links">
            ${vl.scopus  ? `<a href="${esc(vl.scopus)}"       target="_blank" class="el el-scopus">📊 Scopus ↗</a>` : ""}
            ${vl.sherpa_romeo ? `<a href="${esc(vl.sherpa_romeo)}" target="_blank" class="el el-sherpa">SHERPA ↗</a>` : ""}
          </div>
        </td>
      </tr>`;
  }).join("");

  return `
    <div class="extended-wrap">
      <button class="ext-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('show')">
        <span>📋 Show ${list.length} more journal suggestions</span>
        <span class="ext-arrow">▼</span>
      </button>
      <div class="ext-body">
        <table class="ext-table">
          <thead>
            <tr>
              <th>#</th><th>Journal</th><th>ISSN</th><th>Quartile</th><th>Why it fits</th><th>Verify</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderRepoRecommendation(r) {
  if (!r) return "";
  return `
    <div class="card rec-card mt-6">
      <div class="card-header"><h2>📦 Repository manager recommendation</h2></div>
      <div class="card-body space-y">
        <dl class="rec-grid">
          <div class="rec-item"><dt>Best version to deposit</dt><dd>${esc(r.best_version_to_deposit)}</dd></div>
          <div class="rec-item"><dt>Best timing</dt><dd>${esc(r.best_timing)}</dd></div>
          <div class="rec-item"><dt>Immediate open deposit</dt><dd>${esc(r.immediate_open_deposit_possible)}</dd></div>
          <div class="rec-item"><dt>Embargoed deposit needed</dt><dd>${esc(r.embargoed_deposit_needed)}</dd></div>
          <div class="rec-item"><dt>Metadata-only first</dt><dd>${esc(r.metadata_only_first)}</dd></div>
        </dl>
        ${r.khazna_note ? `<div class="policy-notes"><p><strong>Khazna note:</strong> ${esc(r.khazna_note)}</p></div>` : ""}
        ${r.manual_checks_required?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">⚠ Manual checks required</h5>
            <ul class="checks-list">${r.manual_checks_required.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
          </div>` : ""}
      </div>
    </div>`;
}

function renderJournalResults(result, container) {
  const journals = result.journals || [];
  const extended = result.extended_list || [];
  const total    = journals.length + extended.length;

  container.innerHTML = `
    <div class="results-header">
      <h2 class="results-title">Analysis</h2>
      <div class="results-meta">
        <span class="count-chip">${total} journals found</span>
        <button class="btn btn-ghost" id="journal-reset">↺ Start over</button>
      </div>
    </div>

    ${renderManuscriptUnderstanding(result.manuscript_understanding)}

    <h3 style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:16px">🏆 Best-fit journal shortlist</h3>
    ${journals.map((j, i) => renderJournalCard(j, i)).join("")}
    ${renderExtendedList(extended)}

    ${renderRepoRecommendation(result.repository_recommendation)}
    ${result.khazna ? renderKhaznaCard(result.khazna, "article") : ""}
    ${renderNextActions(result.next_actions, result.global_notes)}
    ${renderHelpCard()}
  `;

  document.getElementById("journal-reset")?.addEventListener("click", () => {
    container.innerHTML = "";
    container.classList.add("hidden");
    document.getElementById("journal-progress")?.classList.remove("show");
    document.getElementById("journal-form")?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
