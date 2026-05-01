// app.js - tab router, model selector, progress indicator
import { journalTab }    from "./journal.js";
import { licenseTab }    from "./license.js";
import { repositoryTab } from "./repository.js";

// ── Tab routing ────────────────────────────────────────────────────────────
function activateTab(target) {
  // Deactivate all tab buttons
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  // Hide all tab panels
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.classList.remove("active");
    p.style.display = "none";
  });
  // Activate chosen tab button
  const btn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
  if (btn) btn.classList.add("active");
  // Show chosen tab panel
  const panel = document.getElementById(`tab-${target}`);
  if (panel) {
    panel.classList.add("active");
    panel.style.display = "block";
  }
}

// Wire up tab buttons
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

// Initialise - show journals tab by default
activateTab("journals");

// ── Model selector ─────────────────────────────────────────────────────────
document.querySelectorAll(".model-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".model-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const hint = document.getElementById("model-hint");
    if (hint) {
      hint.textContent = btn.dataset.model === "gpt-4o"
        ? "Deeper analysis . slower . higher cost"
        : "Default . faster . lower cost";
    }
  });
});

// ── Progress helpers ───────────────────────────────────────────────────────
export function showProgress(containerId, steps) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = steps.map(s =>
    `<div class="p-step"><span class="p-dot"></span><span>${s}</span></div>`
  ).join("");
  wrap.classList.add("show");
  setStep(containerId, 0);
}

export function setStep(containerId, idx) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.querySelectorAll(".p-step").forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i < idx)  el.classList.add("done");
    if (i === idx) el.classList.add("active");
  });
}

export function doneProgress(containerId, message) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.querySelectorAll(".p-step").forEach(el => {
    el.classList.remove("active");
    el.classList.add("done");
  });
  if (message) {
    const el = document.createElement("div");
    el.className = "p-step done";
    el.style.marginTop = "6px";
    el.style.fontWeight = "600";
    el.innerHTML = `<span class="p-dot"></span><span>${message}</span>`;
    wrap.appendChild(el);
  }
}

export function hideProgress(containerId) {
  document.getElementById(containerId)?.classList.remove("show");
}

// ── Init ───────────────────────────────────────────────────────────────────
journalTab();
licenseTab();
repositoryTab();
