// license.js - License checking tab
import { callAPI, getModel, getLanguage } from "./api.js";
import { showProgress, setStep, doneProgress } from "./app.js";
import {
  esc, oaStatusBadge, renderVersionBlock, renderVerifyLinks,
  renderKhaznaCard, renderHelpCard, renderNextActions, renderMascotRow
} from "./render.js";

const HF_BASE = "https://nikeshn-researchbee.hf.space";

// ── Journal name auto-lookup ──────────────────────────────────────────────
let _lookupTimer = null;

function initJournalLookup() {
  const nameInput   = document.getElementById("l-journal");
  const issnInput   = document.getElementById("l-issn");
  const pubInput    = document.getElementById("l-publisher");
  if (!nameInput) return;

  // Container for autofill chip + suggestion
  const chipWrap = document.createElement("div");
  chipWrap.id = "journal-lookup-wrap";
  chipWrap.style.cssText = "margin-top:5px;min-height:20px;";
  nameInput.parentNode.appendChild(chipWrap);

  nameInput.addEventListener("input", () => {
    clearTimeout(_lookupTimer);
    chipWrap.innerHTML = "";

    const val = nameInput.value.trim();
    if (val.length < 4) return;

    // Debounce 650ms
    _lookupTimer = setTimeout(() => runLookup(val, issnInput, pubInput, chipWrap), 650);
  });
}

async function runLookup(name, issnInput, pubInput, chipWrap) {
  // Show loading indicator
  chipWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted);font-style:italic">🔍 Looking up journal...</span>`;

  try {
    const res = await fetch(
      `${HF_BASE}/api/lookup-journal-meta?name=${encodeURIComponent(name)}`
    );
    if (!res.ok) { chipWrap.innerHTML = ""; return; }
    const data = await res.json();

    // ── Layer 1 hit: ISSN + publisher found ───────────────────────────────
    if (data.found) {
      // Only auto-fill ISSN if field is empty or was auto-filled before
      if (data.issn && (!issnInput.value || issnInput.dataset.autofilled === "1")) {
        issnInput.value = data.issn;
        issnInput.dataset.autofilled = "1";
      }
      if (data.publisher && (!pubInput.value || pubInput.dataset.autofilled === "1")) {
        pubInput.value = data.publisher;
        pubInput.dataset.autofilled = "1";
      }

      const confIcon  = data.confidence === "high" ? "✓" : "~";
      const confColor = data.confidence === "high" ? "var(--success)" : "var(--warning)";
      const srcLabel  = data.source || "Database";

      chipWrap.innerHTML = `
        <div class="lookup-chip" style="
          display:inline-flex;align-items:center;gap:6px;
          background:var(--success-light);border:1px solid #6ee7b7;
          border-radius:8px;padding:4px 10px;font-size:11.5px;
          color:var(--success);font-family:'DM Sans',sans-serif;
        ">
          <span style="font-weight:700">${confIcon}</span>
          <span>
            Auto-filled from <strong>${esc(srcLabel)}</strong>
            ${data.title && data.title.toLowerCase() !== name.toLowerCase()
              ? ` — matched as <em>${esc(data.title)}</em>`
              : ""}
          </span>
          <button onclick="clearAutofill()" style="
            background:none;border:none;cursor:pointer;
            color:var(--success);font-size:13px;padding:0 2px;line-height:1;
            opacity:.7;
          " title="Clear auto-fill">×</button>
        </div>`;

    // ── Layer 2: spelling suggestion from LLM ─────────────────────────────
    } else if (data.suggestion) {
      chipWrap.innerHTML = `
        <div class="lookup-suggestion" style="
          display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;
          background:var(--accent-light);border:1px solid #fcd34d;
          border-radius:8px;padding:5px 10px;font-size:11.5px;
          color:#92400e;font-family:'DM Sans',sans-serif;
        ">
          <span>💡 Did you mean: <strong>${esc(data.suggestion)}</strong>?</span>
          <button id="accept-suggestion" style="
            background:#92400e;color:#fff;border:none;
            border-radius:6px;padding:3px 10px;font-size:11px;
            font-family:'DM Sans',sans-serif;cursor:pointer;
            font-weight:600;transition:opacity .15s;
          ">Accept</button>
          <button onclick="this.closest('.lookup-suggestion').remove()" style="
            background:none;border:none;cursor:pointer;
            color:#92400e;font-size:13px;padding:0 2px;opacity:.6;
          ">×</button>
        </div>`;

      // Accept button — replace name and re-run lookup
      document.getElementById("accept-suggestion")?.addEventListener("click", () => {
        const nameInput = document.getElementById("l-journal");
        if (nameInput) {
          nameInput.value = data.suggestion;
          chipWrap.innerHTML = "";
          runLookup(data.suggestion, issnInput, pubInput, chipWrap);
        }
      });

    } else {
      // Nothing found — clear chip
      chipWrap.innerHTML = "";
    }

  } catch (e) {
    chipWrap.innerHTML = "";
  }
}

// Clear auto-fill — lets user enter manually
window.clearAutofill = function() {
  const issnInput = document.getElementById("l-issn");
  const pubInput  = document.getElementById("l-publisher");
  const chipWrap  = document.getElementById("journal-lookup-wrap");
  if (issnInput) { issnInput.value = ""; delete issnInput.dataset.autofilled; }
  if (pubInput)  { pubInput.value  = ""; delete pubInput.dataset.autofilled;  }
  if (chipWrap)  chipWrap.innerHTML = "";
};

// ── License tab ───────────────────────────────────────────────────────────
export function licenseTab() {
  const form    = document.getElementById("license-form");
  const results = document.getElementById("license-results");
  if (!form) return;

  // Init journal lookup on load
  initJournalLookup();

  // Clear autofill flags when user manually edits ISSN or publisher
  document.getElementById("l-issn")?.addEventListener("input", (e) => {
    if (e.isTrusted) delete e.target.dataset.autofilled;
  });
  document.getElementById("l-publisher")?.addEventListener("input", (e) => {
    if (e.isTrusted) delete e.target.dataset.autofilled;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector(".btn-primary");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `🔍 Checking policy...`;
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
      const data = await callAPI("/api/check-license", {
        license_input, model: getModel(), language: getLanguage()
      });
      setStep("license-progress", 2);
      doneProgress("license-progress", "[OK] Policy check complete");
      setTimeout(() => renderLicenseResults(data.result, results), 400);
    } catch (err) {
      document.getElementById("license-progress").innerHTML =
        `<div class="p-step" style="color:var(--danger)">
           <span class="p-dot" style="background:var(--danger)"></span>
           <span>Error: ${esc(err.message)}</span>
         </div>`;
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
    oa.risk_flag              ? `<p class="p-risk">[!] <span><strong>Risk:</strong> ${esc(oa.risk_flag)}</span></p>` : "",
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
          <h5 style="font-size:14px;font-weight:600;margin-bottom:10px">🟢 Green OA / self-archiving by version</h5>
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
            <h5 style="font-size:13px;font-weight:600;margin-bottom:6px">[!] Manual checks required</h5>
            <ul class="checks-list">${r.manual_checks_required.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
          </div>` : ""}
      </div>
    </div>`;
}

function renderLicenseResults(result, container) {
  const journals = result.journals || [];
  container.innerHTML = `
    ${renderMascotRow('Here is the self-archiving policy for your journal.')}
    <div class="results-header">
      <h2 class="results-title">Policy result</h2>
      <div class="results-meta">
        <button class="btn btn-ghost" id="license-reset">↩ Start over</button>
      </div>
    </div>
    <h3 style="font-family:'DM Serif Display',serif;font-size:20px;margin-bottom:14px">🟢 Green OA / self-archiving by version</h3>
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
    document.getElementById("journal-lookup-wrap") && (document.getElementById("journal-lookup-wrap").innerHTML = "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
