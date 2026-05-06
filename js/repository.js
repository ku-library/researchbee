// repository.js - Data repository tab
import { callAPI, getModel } from "./api.js";
import { showProgress, setStep, doneProgress } from "./app.js";
import {
  esc, renderRepoCard, renderKhaznaCard,
  renderHelpCard, renderNextActions, renderMascotRow
} from "./render.js";

export function repositoryTab() {
  const form    = document.getElementById("repo-form");
  const results = document.getElementById("repo-results");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector(".btn-primary");
    submitBtn.disabled = true;
    submitBtn.innerHTML = ` Finding repositories...`;
    results.innerHTML = "";
    results.classList.remove("hidden");

    showProgress("repo-progress", [
      "Analysing your dataset...",
      "Matching repositories...",
      "Building recommendations..."
    ]);

    try {
      const dataset = getDatasetData();
      setStep("repo-progress", 1);
      const data = await callAPI("/api/find-repository", { dataset, model: getModel() });
      setStep("repo-progress", 2);
      doneProgress("repo-progress", `[OK] Repository search complete`);
      setTimeout(() => renderRepoResults(data.result, results), 400);
    } catch (err) {
      document.getElementById("repo-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)"><span class="p-dot" style="background:var(--danger)"></span><span>Error: ${esc(err.message)}</span></div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = ` Find best repositories`;
    }
  });
}

function getDatasetData() {
  const g = id => document.getElementById(id)?.value?.trim() || "";
  return {
    title:                g("r-title"),
    description:          g("r-desc"),
    discipline:           g("r-discipline"),
    data_types:           g("r-datatypes"),
    file_formats:         g("r-formats"),
    approx_size:          g("r-size"),
    sensitivity:          g("r-sensitivity"),
    contains_personal_data: g("r-personal"),
    licence_intent:       g("r-licence"),
    funder:               g("r-funder"),
    institution:          g("r-institution"),
    country:              g("r-country"),
    needs_doi:            g("r-doi"),
    needs_versioning:     g("r-versioning"),
    embargo_required:     g("r-embargo"),
    preferred_repository: g("r-preferred"),
    related_publication:  g("r-publication"),
    notes:                g("r-notes"),
  };
}

function renderDatasetUnderstanding(d) {
  if (!d) return "";
  return `
    <div class="card understanding">
      <div class="card-header"><h2>🗂 Dataset understanding</h2></div>
      <div class="card-body">
        <p style="font-size:14px">${esc(d.summary)}</p>
        <div class="tag-row">
          ${d.discipline ? `<span class="badge b-primary">${esc(d.discipline)}</span>` : ""}
          <span class="badge b-muted">Sensitivity: ${esc(d.sensitivity_assessment)}</span>
          ${(d.data_types || []).map(t => `<span class="badge b-muted">${esc(t)}</span>`).join("")}
        </div>
        ${d.inferred_requirements?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">Inferred requirements</h5>
            <ul style="list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:3px">
              ${d.inferred_requirements.map(r => `<li style="font-size:13px;color:var(--text-muted)">${esc(r)}</li>`).join("")}
            </ul>
          </div>` : ""}
        ${d.assumptions?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">Assumptions made</h5>
            <ul style="list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:3px">
              ${d.assumptions.map(a => `<li style="font-size:13px;color:var(--text-muted)">${esc(a)}</li>`).join("")}
            </ul>
          </div>` : ""}
      </div>
    </div>`;
}

function renderDepositStrategy(s) {
  if (!s) return "";
  return `
    <div class="card rec-card mt-6">
      <div class="card-header"><h2> Deposit strategy</h2></div>
      <div class="card-body space-y">
        <dl class="rec-grid">
          <div class="rec-item"><dt>Primary choice</dt><dd>${esc(s.primary_choice)}</dd></div>
          <div class="rec-item"><dt>Secondary choice</dt><dd>${esc(s.secondary_choice)}</dd></div>
          <div class="rec-item" style="grid-column:1/-1"><dt>Metadata standard</dt><dd>${esc(s.metadata_standard)}</dd></div>
        </dl>
        ${s.khazna_metadata_note ? `
          <div class="khazna-tip" style="background:var(--primary-xlight);border-color:var(--primary-light)">
            <span>️</span><span style="color:var(--primary)">${esc(s.khazna_metadata_note)}</span>
          </div>` : ""}
        ${s.deposit_workflow?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">🔄 Deposit workflow</h5>
            <ol style="list-style:decimal;padding-left:18px;display:flex;flex-direction:column;gap:4px">
              ${s.deposit_workflow.map(w => `<li style="font-size:13px;color:var(--text-muted)">${esc(w)}</li>`).join("")}
            </ol>
          </div>` : ""}
        ${s.manual_checks_required?.length ? `
          <div>
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">[!] Manual checks required</h5>
            <ul class="checks-list">${s.manual_checks_required.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
          </div>` : ""}
      </div>
    </div>`;
}

function renderRepoResults(result, container) {
  const repos = result.repositories || [];
  container.innerHTML = `
    ${renderMascotRow('Here are the best repositories for your dataset.')}
    <div class="results-header">
      <h2 class="results-title">Recommended repositories</h2>
      <div class="results-meta">
        <span class="count-chip">${repos.length} repositories</span>
        <button class="btn btn-ghost" id="repo-reset"> Start over</button>
      </div>
    </div>

    ${renderDatasetUnderstanding(result.dataset_understanding)}

    <h3 style="font-family:'DM Serif Display',serif;font-size:22px;margin:20px 0 14px"> Recommended repositories</h3>
    ${repos.map((r, i) => renderRepoCard(r, i)).join("")}

    ${renderDepositStrategy(result.deposit_strategy)}
    ${renderNextActions(result.next_actions, result.global_notes)}
    ${renderHelpCard()}
  `;

  document.getElementById("repo-reset")?.addEventListener("click", () => {
    container.innerHTML = "";
    container.classList.add("hidden");
    document.getElementById("repo-progress")?.classList.remove("show");
    document.getElementById("repo-form")?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
