// license.js — License checking tab
import { callAPI, getModel } from "./api.js";
import { showProgress, setStep, doneProgress } from "./app.js";
import {
  esc, oaStatusBadge, renderVersionBlock, renderVerifyLinks,
  renderKhaznaCard, renderHelpCard, renderNextActions
} from "./render.js";

export function licenseTab() {
  const form    = document.getElementById("license-form");
  const results = document.getElementById("license-results");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector(".btn-primary");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ Checking policy...`;
    results.innerHTML = "";
    results.classList.remove("hidden");

    showProgress("license-progress", [
      "Looking up journal...",
      "Checking Green OA policy...",
      "Building deposit guidance..."
    ]);

    try {
      const license_input = getLicenseData();
      setStep("license-progress", 1);
      const data = await callAPI("/api/check-license", { license_input, model: getModel() });
      setStep("license-progress", 2);
      doneProgress("license-progress", "✅ Policy check complete");
      setTimeout(() => renderLicenseResults(data.result, results), 400);
    } catch (err) {
      document.getElementById("license-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)"><span class="p-dot" style="background:var(--danger)"></span><span>Error: ${esc(err.message)}</span></div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `🛡 Check Green OA policy`;
    }
  });
}

function getLicenseData() {
  const g = id => document.getElementById(id)?.value?.trim() || "";
  return {
    journal_name:        g("l-journal"),
    issn:                g("l-issn"),
    publisher:           g("l-publisher"),
    manuscript_version:  g("l-version"),
    funder:              g("l-funder"),
    intended_repository: g("l-repo"),
    intended_licence:    g("l-licence"),
    notes:               g("l-notes"),
  };
}

function renderPolicyCard(j) {
  const oa = j.green_oa || {};
  const policyNotes = [
    oa.licence_notes          ? `<p><strong>Licence notes:</strong> ${esc(oa.licence_notes)}</p>` : "",
    oa.repository_action_note ? `<p><strong>Repository action:</strong> ${esc(oa.repository_action_note)}</p>` : "",
    oa.evidence_note          ? `<p style="font-style:italic;font-size:12px;color:var(--text-muted)">Evidence: ${esc(oa.evidence_note)}</p>` : "",
    oa.risk_flag              ? `<p class="p-risk">⚠ <span><strong>Risk:</strong> ${esc(oa.risk_flag)}</span></p>` : "",
  ].filter(Boolean).join("");

  const vl = j.verify_links || {};
  const licenseVerifyLinks = {
    sherpa_romeo: vl.sherpa_romeo,
    doaj:         vl.doaj,
    scopus:       vl.scopus,
    openalex:     vl.openalex,
  };

  return `
    <div class="card j-card">
      <div class="j-header">
        <div class="j-meta">${esc(j.publisher || "")}${j.issn ? ` · ISSN ${esc(j.issn)}` : ""}</div>
        <div class="j-title">${esc(j.name)}</div>
        <div class="badge-row">
          ${oaStatusBadge(oa.policy_status || "Not confirmed")}
        </div>
      </div>
      <div class="j-body">
        <div>
          <h5 style="font-size:14px;font-weight:600;margin-bottom:10px">🛡 Green OA / self-archiving by version</h5>
          <div class="version-list">
            ${renderVersionBlock("Submitted version / preprint", oa.preprint)}
            ${renderVersionBlock("Accepted manuscript (AAM / postprint)", oa.postprint)}
            ${renderVersionBlock("Published version (Version of Record)", oa.published_version)}
          </div>
        </div>
        ${policyNotes ? `<div class="policy-notes">${policyNotes}</div>` : ""}
        ${renderVerifyLinks(licenseVerifyLinks, false)}
      </div>
    </div>`;
}

function renderDepositRecommendation(r) {
  if (!r) return "";
  return `
    <div class="card rec-card mt-6">
      <div class="card-header"><h2>📦 Repository deposit recommendation</h2></div>
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

function renderLicenseResults(result, container) {
  const journals = result.journals || [];
  container.innerHTML = `
    <div class="results-header">
      <h2 class="results-title">Policy result</h2>
      <div class="results-meta">
        <button class="btn btn-ghost" id="license-reset">↺ Start over</button>
      </div>
    </div>

    <h3 style="font-family:'DM Serif Display',serif;font-size:20px;margin-bottom:14px">🛡 Green OA / self-archiving by version</h3>
    ${journals.map(j => renderPolicyCard(j)).join("")}
    ${renderDepositRecommendation(result.repository_recommendation)}
    ${result.khazna ? renderKhaznaCard(result.khazna, "article") : ""}
    ${renderNextActions(result.next_actions, result.global_notes)}
    ${renderHelpCard()}
  `;

  document.getElementById("license-reset")?.addEventListener("click", () => {
    container.innerHTML = "";
    container.classList.add("hidden");
    document.getElementById("license-progress")?.classList.remove("show");
    document.getElementById("license-form")?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
