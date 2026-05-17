// license.js - License checking tab
import { callAPI, getModel, getLanguage } from "./api.js";
import { showProgress, setStep, doneProgress } from "./app.js";
import {
  esc, oaStatusBadge, renderVersionBlock, renderVerifyLinks,
  renderKhaznaCard, renderHelpCard, renderNextActions, renderMascotRow
} from "./render.js";

const HF_BASE = "https://nikeshn-researchbee.hf.space";

// ── Journal name auto-lookup — multi-suggestion ──────────────────────────
let _lookupTimer = null;

function initJournalLookup() {
  const nameInput = document.getElementById("l-journal");
  const issnInput = document.getElementById("l-issn");
  const pubInput  = document.getElementById("l-publisher");
  if (!nameInput) return;

  const chipWrap = document.createElement("div");
  chipWrap.id = "journal-lookup-wrap";
  chipWrap.style.cssText = "margin-top:6px;";
  nameInput.parentNode.appendChild(chipWrap);

  nameInput.addEventListener("input", () => {
    clearTimeout(_lookupTimer);
    chipWrap.innerHTML = "";
    const val = nameInput.value.trim();
    if (val.length < 4) return;
    _lookupTimer = setTimeout(() => runLookup(val, nameInput, issnInput, pubInput, chipWrap), 650);
  });
}

async function runLookup(name, nameInput, issnInput, pubInput, chipWrap) {
  chipWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted);font-style:italic">🔍 Searching journal database...</span>`;

  try {
    const res = await fetch(`${HF_BASE}/api/lookup-journal-meta?name=${encodeURIComponent(name)}`);
    if (!res.ok) { chipWrap.innerHTML = ""; return; }
    const data = await res.json();

    const suggestions    = data.suggestions    || [];
    const llmSuggestions = data.llm_suggestions|| [];

    // ── SCImago/OpenAlex suggestions — fill name + ISSN + publisher ───────
    if (suggestions.length) {
      const items = suggestions.map((s, i) => {
        const icon = s.confidence === "high" ? "✓" : "~";
        const bg   = s.confidence === "high" ? "#f0fdf4" : "#fffbeb";
        const bc   = s.confidence === "high" ? "#6ee7b7" : "#fcd34d";
        const tc   = s.confidence === "high" ? "var(--success)" : "#92400e";
        return `
          <button class="lookup-suggestion-chip" data-idx="${i}" style="
            display:flex;align-items:flex-start;gap:8px;width:100%;
            background:${bg};border:1.5px solid ${bc};border-radius:9px;
            padding:7px 11px;font-family:'DM Sans',sans-serif;cursor:pointer;
            text-align:left;transition:box-shadow .15s;margin-bottom:4px;
          "
          onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.1)'"
          onmouseout="this.style.boxShadow='none'">
            <span style="color:${tc};font-weight:700;font-size:12px;flex-shrink:0;margin-top:1px">${icon}</span>
            <span style="flex:1;min-width:0;">
              <span style="font-size:12.5px;font-weight:600;color:#1e293b;display:block;line-height:1.3">
                ${esc(s.title)}
              </span>
              <span style="font-size:11px;color:var(--text-muted);display:flex;gap:8px;margin-top:2px;flex-wrap:wrap">
                ${s.issn     ? `<span>ISSN: ${esc(s.issn)}</span>` : ""}
                ${s.publisher? `<span>${esc(s.publisher)}</span>`  : ""}
                <span style="opacity:.6">${esc(s.source)}</span>
              </span>
            </span>
          </button>`;
      }).join("");

      chipWrap.innerHTML = `
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:500">
          📚 Select a journal:
        </div>
        ${items}
        <button onclick="document.getElementById('journal-lookup-wrap').innerHTML=''" style="
          background:none;border:none;font-size:11px;color:var(--text-muted);
          cursor:pointer;padding:2px 4px;margin-top:2px;
        ">✕ Dismiss</button>`;

      // Wire click handlers
      chipWrap.querySelectorAll(".lookup-suggestion-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const s   = suggestions[idx];

          // Fill journal name field (Option A — fills all fields)
          nameInput.value = s.title;

          // Fill ISSN + publisher from verified source
          if (s.issn) {
            issnInput.value = s.issn;
            issnInput.dataset.autofilled = "1";
          }
          if (s.publisher) {
            pubInput.value = s.publisher;
            pubInput.dataset.autofilled = "1";
          }

          // Show confirmed chip
          chipWrap.innerHTML = `
            <div style="
              display:inline-flex;align-items:center;gap:6px;
              background:var(--success-light);border:1px solid #6ee7b7;
              border-radius:8px;padding:4px 10px;font-size:11.5px;
              color:var(--success);font-family:'DM Sans',sans-serif;
            ">
              <span style="font-weight:700">✓</span>
              <span>Filled from <strong>${esc(s.source)}</strong></span>
              <button onclick="clearAutofill()" style="
                background:none;border:none;cursor:pointer;color:var(--success);
                font-size:13px;padding:0 2px;opacity:.7;line-height:1;
              " title="Clear">×</button>
            </div>`;
        });
      });

    // ── LLM name suggestions — fill name only, re-run lookup for ISSN ────
    } else if (llmSuggestions.length) {
      const items = llmSuggestions.map((s, i) => `
        <button class="lookup-llm-chip" data-idx="${i}" style="
          display:inline-flex;align-items:center;gap:6px;
          background:#fef3c7;border:1.5px solid #fcd34d;border-radius:20px;
          padding:4px 12px;font-size:12px;color:#92400e;
          font-family:'DM Sans',sans-serif;cursor:pointer;
          font-weight:500;transition:background .15s;margin:2px;
        "
        onmouseover="this.style.background='#fde68a'"
        onmouseout="this.style.background='#fef3c7'">
          💡 ${esc(s.name)}
        </button>`).join("");

      chipWrap.innerHTML = `
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-weight:500">
          Did you mean one of these?
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${items}</div>
        <div style="font-size:10.5px;color:var(--text-light);margin-top:4px">
          ℹ️ Selecting will search for ISSN automatically
        </div>`;

      // Wire LLM chip clicks — fill name only, re-run Layer 1 for ISSN
      chipWrap.querySelectorAll(".lookup-llm-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const s   = llmSuggestions[idx];
          nameInput.value = s.name;
          chipWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted);font-style:italic">🔍 Looking up ISSN for ${esc(s.name)}...</span>`;
          // Re-run Layer 1 with corrected name
          runLookup(s.name, nameInput, issnInput, pubInput, chipWrap);
        });
      });

    } else {
      chipWrap.innerHTML = "";
    }

  } catch (e) {
    chipWrap.innerHTML = "";
  }
}

// Clear auto-fill
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
