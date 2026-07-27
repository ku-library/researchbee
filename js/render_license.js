// render_license.js — rendering helpers for the verified-sources License tab.
//
// Design rule mirrored from the backend: the UI must never make an answer look
// more certain than it is. Provenance is always visible, and "we could not
// check" is rendered differently from "it is not there".

import { esc } from "./render.js";

// ── Provenance badge ──────────────────────────────────────────────────────
export function provenanceBadge(green, sourceMode) {
  const status = green?.policy_status || "Not confirmed";
  if (status === "Confirmed") {
    return `<span class="prov-badge prov-verified" title="Retrieved from a policy database">
              ✓ Verified &middot; OA.Works Permissions
            </span>`;
  }
  const label = sourceMode === "doi"
    ? "No record found for this article"
    : "Unverified &middot; journal-level estimate";
  return `<span class="prov-badge prov-unverified" title="Not checked against a policy database">
            ⚠ ${label}
          </span>`;
}

// ── Source panel: where every fact came from ──────────────────────────────
export function renderSourcePanel(green, result) {
  const verified = green?.policy_status === "Confirmed";
  const urls = green?.evidence_urls || [];
  const verifyUrl = green?._verify_url || "https://openpolicyfinder.jisc.ac.uk/";

  return `
    <div class="source-panel ${verified ? "sp-verified" : "sp-unverified"}">
      <div class="sp-head">
        <span class="sp-icon">${verified ? "🔒" : "⚠️"}</span>
        <strong>${verified ? "Where this answer came from" : "This answer is not verified"}</strong>
      </div>
      <p class="sp-note">${esc(green?.evidence_note || "")}</p>
      ${green?.policy_updated ? `
        <p class="sp-meta">Policy record last updated: <strong>${esc(green.policy_updated)}</strong>
        ${green.monitoring ? ` &middot; monitoring: ${esc(green.monitoring)}` : ""}</p>` : ""}
      ${green?.policy_issuer ? `
        <p class="sp-meta">Policy set by: <strong>${esc(green.policy_issuer)}</strong>
        ${green.journal_oa_type ? ` &middot; journal type: ${esc(green.journal_oa_type)}` : ""}</p>` : ""}
      <div class="sp-links">
        ${urls.slice(0, 4).map((u, i) =>
          `<a href="${esc(u)}" target="_blank" rel="noopener" class="sp-link">Evidence ${i + 1}</a>`).join("")}
        <a href="${esc(verifyUrl)}" target="_blank" rel="noopener" class="sp-link sp-link-primary">
          Verify at Open Policy Finder
        </a>
        ${result?.doi_url ? `<a href="${esc(result.doi_url)}" target="_blank" rel="noopener" class="sp-link">View article</a>` : ""}
      </div>
    </div>`;
}

// ── Deposit statement — must be reproduced verbatim ───────────────────────
export function renderDepositStatement(green) {
  const stmt = green?.deposit_statement;
  if (!stmt) return "";
  return `
    <div class="deposit-stmt">
      <div class="ds-head">
        <span>📋 Required deposit statement</span>
        <button type="button" class="ds-copy" data-stmt="${esc(stmt)}">Copy</button>
      </div>
      <p class="ds-body">${esc(stmt)}</p>
      <p class="ds-note">The publisher requires this exact wording to accompany your deposited file.
        Reproduce it verbatim &mdash; do not paraphrase.</p>
    </div>`;
}

// ── Khazna deposit status — three-valued ──────────────────────────────────
export function renderKhaznaStatus(k) {
  if (!k) return "";

  if (!k.checked) {
    return `
      <div class="khazna-status ks-unknown">
        <span class="ks-icon">❔</span>
        <div>
          <strong>Khazna status not checked</strong>
          <p>${esc(k.reason === "no DOI supplied"
              ? "Enter your article's DOI to check whether it is already deposited in Khazna."
              : "The Khazna index is temporarily unavailable, so we could not check. This does not mean the article is absent.")}</p>
        </div>
      </div>`;
  }

  if (!k.in_khazna) {
    return `
      <div class="khazna-status ks-absent">
        <span class="ks-icon">📭</span>
        <div>
          <strong>Not yet in Khazna</strong>
          <p>${esc(k.message)} Depositing adds it to KU's research portfolio.</p>
        </div>
      </div>`;
  }

  const state = k.deposit_state || "undetermined";
  const cls = { open: "ks-open", embargoed: "ks-embargo", restricted: "ks-restricted",
                closed: "ks-restricted", metadata_only: "ks-gap" }[state] || "ks-unknown";
  const icon = { open: "✅", embargoed: "⏳", restricted: "🔒",
                 closed: "🔒", metadata_only: "📄" }[state] || "❔";

  return `
    <div class="khazna-status ${cls}">
      <span class="ks-icon">${icon}</span>
      <div>
        <strong>In Khazna &mdash; ${esc(state.replace("_", " "))}</strong>
        <p>${esc(k.message)}</p>
        ${k.embargo_end ? `<p class="ks-meta">Embargo ends: <strong>${esc(k.embargo_end)}</strong></p>` : ""}
        ${k.portal_url ? `<a href="${esc(k.portal_url)}" target="_blank" rel="noopener" class="ks-link">View Khazna record →</a>` : ""}
      </div>
    </div>`;
}

// ── ShareYourPaper deposit call-to-action ─────────────────────────────────
export function renderShareYourPaper(result, green) {
  if (!result?.shareyourpaper_url || !green?._can_archive) return "";
  return `
    <div class="syp-card">
      <div class="syp-body">
        <h4>Deposit this article in minutes</h4>
        <p>ShareYourPaper walks you through a legal deposit and checks the file you
           upload. It's run by OA.Works, the non-profit whose permissions data powers
           this answer.</p>
        <a href="${esc(result.shareyourpaper_url)}" target="_blank" rel="noopener" class="syp-btn">
          Open ShareYourPaper →
        </a>
      </div>
    </div>`;
}

// ── Copy-button wiring (call once after rendering) ────────────────────────
export function wireCopyButtons(root) {
  root.querySelectorAll(".ds-copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.stmt || "");
        const original = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => { btn.textContent = original; }, 1800);
      } catch {
        btn.textContent = "Press Ctrl+C";
      }
    });
  });
}
