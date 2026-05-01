// journal.js - Journal submission tab
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
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Analysing...`;
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
      doneProgress("journal-progress", `[OK] ${total} journals found - ${result.journals?.length || 0} detailed . ${result.extended_list?.length || 0} quick matches`);
      setTimeout(() => renderJournalResults(result, results), 400);
    } catch (err) {
      document.getElementById("journal-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)"><span class="p-dot" style="background:var(--danger)"></span><span>Error: ${esc(err.message)}</span></div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span></span> Find journals & check OA policy`;
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
    oa.risk_flag             ? `<p class="p-risk">[!] <span><strong>Risk:</strong> ${esc(oa.risk_flag)}</span></p>` : "",
  ].filter(Boolean).join("");

  return `
    <div class="card j-card">
      <div class="j-header">
        <div class="j-meta">#${idx + 1} . ${esc(j.publisher || "")}${j.issn ? ` . ISSN ${esc(j.issn)}` : ""}</div>
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
          <div class="detail-item"><h5> Submission strategy</h5><p>${esc(j.submission_strategy)}</p></div>
          <div class="detail-item"><h5>🔓 OA / compliance</h5><p>${esc(j.oa_compliance_note)}</p></div>
        </div>

        ${renderRankingBlock(j.ranking)}

        <hr class="divider">

        <div>
          <h5 style="font-size:14px;font-weight:600;margin-bottom:10px"> Green OA / self-archiving by version</h5>
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
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${esc(j.issn || "-")}</td>
        <td>${q ? quartileBadge(q) : '<span style="color:var(--text-light);font-size:12px">-</span>'}</td>
        <td style="font-size:12px;color:var(--text-muted)">${esc(j.fit_reason || "")}</td>
        <td>
          <div class="ext-links">
            ${vl.scopus  ? `<a href="${esc(vl.scopus)}"       target="_blank" class="el el-scopus"> Scopus </a>` : ""}
            ${vl.sherpa_romeo ? `<a href="${esc(vl.sherpa_romeo)}" target="_blank" class="el el-sherpa">SHERPA </a>` : ""}
          </div>
        </td>
      </tr>`;
  }).join("");

  return `
    <div class="extended-wrap">
      <button class="ext-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('show')">
        <span> Show ${list.length} more journal suggestions</span>
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
      <div class="card-header"><h2> Repository manager recommendation</h2></div>
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
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">[!] Manual checks required</h5>
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
        <button class="btn btn-ghost" id="journal-reset"> Start over</button>
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

// ── Subject browse mode (NEW - does not affect existing journalTab) ────────
export function subjectTab() {
  const form    = document.getElementById("subject-form");
  const results = document.getElementById("subject-results");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input   = document.getElementById("s-subject");
    const subject = input?.value?.trim();
    if (!subject) return;

    const submitBtn = form.querySelector(".btn-primary");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Searching journals...";
    results.innerHTML = "";
    results.classList.remove("hidden");

    showProgress("subject-progress", [
      "Identifying your subject...",
      "Searching journal database...",
      "Building results..."
    ]);

    try {
      setStep("subject-progress", 1);
      const data = await callAPI("/api/browse-subject", {
        subject,
        model: getModel()
      });
      setStep("subject-progress", 2);
      doneProgress("subject-progress",
        data.result.journals?.length
          ? `Found ${data.result.journals.length} journals`
          : "Search complete"
      );
      setTimeout(() => renderSubjectResults(data.result, results), 300);
    } catch (err) {
      document.getElementById("subject-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)">
           <span class="p-dot" style="background:var(--danger)"></span>
           <span>Error: ${esc(err.message)}</span>
         </div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Search journals";
    }
  });

  // Reset button
  document.getElementById("subject-reset")?.addEventListener("click", resetSubject);
}

function resetSubject() {
  const results = document.getElementById("subject-results");
  if (results) { results.innerHTML = ""; results.classList.add("hidden"); }
  document.getElementById("subject-progress")?.classList.remove("show");
  document.getElementById("subject-form")?.reset();
}

function renderSubjectResults(result, container) {
  const journals = result.journals || [];

  // Not found state
  if (result.confidence === "not_found" || !journals.length) {
    container.innerHTML = `
      <div class="subj-notfound">
        <div class="subj-notfound-icon">?</div>
        <h3>No journals found</h3>
        <p>${esc(result.user_message || "Try a different subject term.")}</p>
        <button class="btn btn-ghost" onclick="document.getElementById('subject-form').reset();document.getElementById('subject-results').classList.add('hidden')">
          Try again
        </button>
      </div>`;
    return;
  }

  // User message banner (correction / near match)
  const banner = result.user_message
    ? `<div class="subj-banner">
         <span class="subj-banner-icon">${result.confidence === "near" ? "Corrected:" : "Note:"}</span>
         ${esc(result.user_message)}
       </div>`
    : "";

  // Build table rows
  const rows = journals.map((j, i) => {
    const vl = j.verify_links || {};
    const q  = j.quartile;
    const qBadge = q
      ? `<span class="badge ${{"Q1":"b-q1","Q2":"b-q2","Q3":"b-q3","Q4":"b-q4"}[q]||"b-muted"}">${esc(q)}</span>`
      : '<span style="color:var(--text-light);font-size:12px">-</span>';
    const oaBadge = j.open_access === "Yes"
      ? '<span class="badge b-success" style="font-size:10px">OA</span>'
      : "";
    return `
      <tr>
        <td style="color:var(--text-muted);font-size:12px;font-family:'JetBrains Mono',monospace">${i + 1}</td>
        <td>
          <strong style="font-size:13px">${esc(j.name)}</strong>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${esc(j.publisher || "")}</div>
        </td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${esc(j.issn || "-")}</td>
        <td>${qBadge} ${oaBadge}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${j.h_index || "-"}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${vl.scopus       ? `<a href="${esc(vl.scopus)}"       target="_blank" class="el el-scopus">Scopus</a>` : ""}
            ${vl.sherpa_romeo ? `<a href="${esc(vl.sherpa_romeo)}" target="_blank" class="el el-sherpa">SHERPA</a>` : ""}
            ${vl.doaj         ? `<a href="${esc(vl.doaj)}"         target="_blank" class="el" style="background:#fef3c7;color:#92400e">DOAJ</a>` : ""}
          </div>
        </td>
      </tr>`;
  }).join("");

  container.innerHTML = `
    <div class="results-header">
      <h2 class="results-title">Top journals: ${esc(result.normalised)}</h2>
      <div class="results-meta">
        <span class="count-chip">${journals.length} journals</span>
        <button class="btn btn-ghost" id="subject-reset-btn">Reset</button>
      </div>
    </div>

    ${banner}

    <div class="card" style="overflow:hidden;margin-bottom:20px">
      <table class="ext-table" style="width:100%">
        <thead>
          <tr>
            <th>#</th>
            <th>Journal</th>
            <th>ISSN</th>
            <th>Quartile</th>
            <th>H-index</th>
            <th>Verify</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="subj-tip">
      <strong>Want deeper analysis?</strong>
      Switch to <em>Analyse manuscript</em> mode above for full Green OA policy,
      submission strategy, and personalised recommendations.
    </div>
  `;

  document.getElementById("subject-reset-btn")?.addEventListener("click", resetSubject);
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
