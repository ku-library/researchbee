// api.js — fetch wrapper for Research Navigator backend
// Set HF_BASE to your HuggingFace Space URL before deploying
const HF_BASE = "https://nikeshn-researchbee.hf.space";

export async function callAPI(endpoint, payload) {
  const res = await fetch(`${HF_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function getModel() {
  return document.querySelector(".model-btn.active")?.dataset.model || "gpt-4o-mini";
}
