// app.js - tab router, model selector, progress indicator, chat widget
import { journalTab, subjectTab } from "./journal.js";
import { licenseTab }    from "./license.js";
import { repositoryTab } from "./repository.js";


// ── Mode switcher (subject browse vs manuscript analyse) ──────────────────
function switchMode(mode) {
  document.querySelectorAll(".mode-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  const subjectEl    = document.getElementById("mode-subject");
  const manuscriptEl = document.getElementById("mode-manuscript");
  if (subjectEl)    subjectEl.style.display    = mode === "subject"    ? "block" : "none";
  if (manuscriptEl) manuscriptEl.style.display = mode === "manuscript" ? "block" : "none";
}
window.switchMode = switchMode;

// ── Tab routing ────────────────────────────────────────────────────────────
function activateTab(target) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.classList.remove("active");
    p.style.display = "none";
  });
  const btn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${target}`);
  if (panel) {
    panel.classList.add("active");
    panel.style.display = "block";
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

activateTab("journals");

// ── Language selector + UI translation ───────────────────────────────────
const TRANSLATIONS = {
  "lbl-title":          { en: "Title",                    ar: "العنوان" },
  "lbl-abstract":       { en: "Abstract",                 ar: "الملخص" },
  "lbl-keywords":       { en: "Keywords (comma-separated)", ar: "الكلمات المفتاحية (مفصولة بفاصلة)" },
  "lbl-discipline":     { en: "Discipline / sub-discipline", ar: "التخصص / الفرع العلمي" },
  "lbl-article-type":   { en: "Article type",             ar: "نوع المقالة" },
  "lbl-methods":        { en: "Methods (brief)",           ar: "المنهجية (موجزة)" },
  "lbl-oa-pref":        { en: "OA preference",            ar: "تفضيل الوصول المفتوح" },
  "lbl-apc":            { en: "APC budget",               ar: "ميزانية رسوم النشر" },
  "lbl-ranking-pref":   { en: "Ranking filter",           ar: "تصفية حسب التصنيف" },
  "lbl-ranking-src":    { en: "Ranking source",           ar: "مصدر التصنيف" },
  "lbl-speed":          { en: "Publication speed",        ar: "سرعة النشر" },
  "lbl-repo-target":    { en: "Repository target",        ar: "المستودع المستهدف" },
  "lbl-funder":         { en: "Funder",                   ar: "الجهة الممولة" },
  "lbl-institution":    { en: "Institution",              ar: "المؤسسة" },
  "lbl-country":        { en: "Country / region",         ar: "الدولة / المنطقة" },
  "lbl-audience":       { en: "Target audience",          ar: "الجمهور المستهدف" },
  "lbl-preferred":      { en: "Preferred journals (optional)", ar: "المجلات المفضلة (اختياري)" },
  "lbl-avoid":          { en: "Journals to avoid (optional)", ar: "المجلات المراد تجنبها (اختياري)" },
  "btn-journal-submit": { en: "Find journals & check OA policy", ar: "ابحث عن مجلات وتحقق من سياسة الوصول المفتوح" },
  "lbl-subject":        { en: "Subject / discipline",     ar: "الموضوع / التخصص" },
  "btn-subject-submit": { en: "Search journals",          ar: "ابحث عن مجلات" },
  "lbl-l-journal":      { en: "Journal name",             ar: "اسم المجلة" },
  "lbl-l-issn":         { en: "ISSN (optional)",          ar: "الرقم الدولي ISSN (اختياري)" },
  "lbl-l-publisher":    { en: "Publisher (optional)",     ar: "الناشر (اختياري)" },
  "lbl-l-version":      { en: "Manuscript version of interest", ar: "نسخة المخطوطة المطلوبة" },
  "lbl-l-funder":       { en: "Funder (affects rights retention)", ar: "الجهة الممولة (تؤثر على حقوق الاحتفاظ)" },
  "lbl-l-repo":         { en: "Intended deposit location", ar: "موقع الإيداع المقصود" },
  "lbl-l-licence":      { en: "Intended licence",         ar: "الرخصة المقصودة" },
  "lbl-l-notes":        { en: "Additional context (optional)", ar: "سياق إضافي (اختياري)" },
  "btn-license-submit": { en: "Check Green OA policy",    ar: "تحقق من سياسة الوصول المفتوح الأخضر" },
  "lbl-r-title":        { en: "Dataset title",            ar: "عنوان مجموعة البيانات" },
  "lbl-r-desc":         { en: "Description",              ar: "الوصف" },
  "lbl-r-discipline":   { en: "Discipline / domain",      ar: "التخصص / المجال" },
  "lbl-r-datatypes":    { en: "Data types",               ar: "أنواع البيانات" },
  "lbl-r-formats":      { en: "File formats",             ar: "صيغ الملفات" },
  "lbl-r-size":         { en: "Approximate total size",   ar: "الحجم الإجمالي التقريبي" },
  "lbl-r-sensitivity":  { en: "Sensitivity classification", ar: "تصنيف الحساسية" },
  "lbl-r-personal":     { en: "Contains personal / health data?", ar: "يحتوي على بيانات شخصية / صحية؟" },
  "lbl-r-licence":      { en: "Intended licence",         ar: "الرخصة المقصودة" },
  "lbl-r-embargo":      { en: "Embargo required?",        ar: "هل يلزم حظر نشر؟" },
  "lbl-r-doi":          { en: "Persistent identifier (DOI) required?", ar: "هل يلزم معرف دائم (DOI)؟" },
  "lbl-r-versioning":   { en: "Versioning required?",     ar: "هل يلزم إدارة الإصدارات؟" },
  "lbl-r-funder":       { en: "Funder",                   ar: "الجهة الممولة" },
  "lbl-r-institution":  { en: "Institution",              ar: "المؤسسة" },
  "lbl-r-country":      { en: "Country / region",         ar: "الدولة / المنطقة" },
  "lbl-r-preferred":    { en: "Preferred / required repository (optional)", ar: "المستودع المفضل / المطلوب (اختياري)" },
  "lbl-r-publication":  { en: "Linked publication / DOI (optional)", ar: "المنشور المرتبط / DOI (اختياري)" },
  "lbl-r-notes":        { en: "Additional notes",         ar: "ملاحظات إضافية" },
  "btn-repo-submit":    { en: "Find best repositories",   ar: "ابحث عن أفضل المستودعات" },
};

const PLACEHOLDERS = {
  "j-title":       { en: "Full manuscript title",           ar: "عنوان المخطوطة كاملاً" },
  "j-abstract":    { en: "Paste your full abstract here...", ar: "الصق ملخصك الكامل هنا..." },
  "j-keywords":    { en: "e.g. machine learning, library, open access", ar: "مثال: تعلم آلي، مكتبة، وصول مفتوح" },
  "j-discipline":  { en: "e.g. Library and Information Science", ar: "مثال: علم المكتبات والمعلومات" },
  "j-methods":     { en: "e.g. survey, experiment, case study", ar: "مثال: مسح، تجربة، دراسة حالة" },
  "j-apc":         { en: "e.g. up to USD 2000, or no APC",  ar: "مثال: حتى 2000 دولار، أو بدون رسوم" },
  "j-funder":      { en: "e.g. ERC, NIH, Wellcome",         ar: "مثال: المجلس الأوروبي للبحوث، NIH" },
  "j-institution": { en: "e.g. Khalifa University",          ar: "مثال: جامعة خليفة" },
  "j-country":     { en: "e.g. UAE",                        ar: "مثال: الإمارات العربية المتحدة" },
  "j-audience":    { en: "e.g. library practitioners, AI researchers", ar: "مثال: أمناء المكتبات، باحثو الذكاء الاصطناعي" },
  "j-preferred":   { en: "e.g. Nature Communications, PLOS ONE", ar: "مثال: Nature Communications، PLOS ONE" },
  "j-avoid":       { en: "Journals to exclude from recommendations", ar: "المجلات المراد استبعادها من التوصيات" },
  "s-subject":     { en: "e.g. Petroleum Engineering, Machine Learning...", ar: "مثال: هندسة البترول، تعلم آلي..." },
  "l-journal":     { en: "e.g. Nature Communications",      ar: "مثال: Nature Communications" },
  "l-issn":        { en: "e.g. 2041-1723",                  ar: "مثال: 2041-1723" },
  "l-publisher":   { en: "e.g. Springer Nature",            ar: "مثال: Springer Nature" },
  "l-funder":      { en: "e.g. cOAlition S, ERC, NIH",      ar: "مثال: تحالف S، المجلس الأوروبي للبحوث" },
  "l-notes":       { en: "Already accepted? Embargo concerns?", ar: "هل تم قبولها؟ مخاوف بشأن الحظر؟" },
  "r-title":       { en: "Descriptive title for your dataset", ar: "عنوان وصفي لمجموعة بياناتك" },
  "r-desc":        { en: "What does the dataset contain?",  ar: "ماذا تحتوي مجموعة البيانات؟" },
  "r-discipline":  { en: "e.g. genomics, climate science",  ar: "مثال: علم الجينوم، علوم المناخ" },
  "r-datatypes":   { en: "e.g. tabular, images, time series", ar: "مثال: جداول، صور، سلاسل زمنية" },
  "r-formats":     { en: "e.g. CSV, FASTQ, NetCDF, TIFF",   ar: "مثال: CSV، FASTQ، NetCDF" },
  "r-size":        { en: "e.g. 250 MB / 5 GB / 2 TB",       ar: "مثال: 250 ميغابايت / 5 جيجابايت" },
  "r-funder":      { en: "e.g. Horizon Europe, NIH, ADEK",  ar: "مثال: أفق أوروبا، NIH، أديك" },
  "r-institution": { en: "e.g. Khalifa University",          ar: "مثال: جامعة خليفة" },
  "r-country":     { en: "e.g. UAE",                        ar: "مثال: الإمارات العربية المتحدة" },
  "r-preferred":   { en: "e.g. Zenodo, GenBank",            ar: "مثال: Zenodo، GenBank" },
  "r-publication": { en: "Related article DOI or title",    ar: "DOI أو عنوان المقالة المرتبطة" },
  "r-notes":       { en: "Any special requirements...",     ar: "أي متطلبات خاصة..." },
};

function applyLanguage(lang) {
  const isAr = lang === "arabic";

  Object.entries(TRANSLATIONS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (isAr ? t.ar : t.en) + (el.innerHTML.includes('class="req"') ? ' <span class="req">*</span>' : '');
  });

  Object.entries(PLACEHOLDERS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = isAr ? t.ar : t.en;
  });

  let banner = document.getElementById("ar-instruction-banner");
  if (isAr) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "ar-instruction-banner";
      banner.className = "ar-banner";
      banner.innerHTML = `
        <span class="ar-banner-icon">🌐</span>
        <span>تم تفعيل اللغة العربية. يمكنك كتابة مدخلاتك باللغة العربية — سيرد الذكاء الاصطناعي بالكامل باللغة العربية.</span>
        <em style="font-size:11px;opacity:.7;display:block;margin-top:3px">Arabic mode active. Type your inputs in Arabic — AI will respond fully in Arabic.</em>`;
      const main = document.querySelector(".main-content");
      if (main) main.insertBefore(banner, main.firstChild);
    }
    banner.style.display = "flex";
  } else if (banner) {
    banner.style.display = "none";
  }

  document.querySelectorAll("input[type=text], textarea").forEach(el => {
    // Don't apply RTL to the chat input
    if (el.id === "rb-chat-input") return;
    el.style.direction = isAr ? "rtl" : "ltr";
    el.style.textAlign = isAr ? "right" : "left";
  });

  // Notify chat widget of language change
  window._rbChatLang = lang;
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyLanguage(btn.dataset.lang);
  });
});

// ── Model selector ─────────────────────────────────────────────────────────
document.querySelectorAll(".model-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".model-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const hint = document.getElementById("model-hint");
    if (hint) {
      hint.textContent = btn.dataset.model === "gpt-4o"
        ? "Deeper analysis · slower · higher cost"
        : "Default · faster · lower cost";
    }
    // Notify chat widget of model change
    window._rbChatModel = btn.dataset.model;
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

// ── Clipboard helper (used by journal.js subject browse rows) ─────────────
window.copyToClipboard = function(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.innerHTML;
    el.innerHTML = "Copied!";
    setTimeout(() => { el.innerHTML = orig; }, 1500);
  });
};

// ── Chat widget ────────────────────────────────────────────────────────────
(function initChat() {
  const API_BASE  = "https://nikeshn-researchbee.hf.space";
  const MAX_HIST  = 20;

  const STARTERS = [
    "Can I post my preprint to arXiv before submitting to Elsevier?",
    "What's the difference between Green OA and Gold OA?",
    "Which repository should I use for genomics data?",
    "How do I deposit my accepted manuscript to Khazna?",
  ];

  const WELCOME = "Hi! I'm ResearchBee 🐝 — KU Library's AI publishing assistant.\n\nI can help with journal selection, Open Access self-archiving rights, and research data deposit. For detailed structured analysis, use the tools above.\n\nWhat would you like to know?";

  // ── State
  let isOpen   = false;
  let isTyping = false;
  let history  = [];

  // ── DOM refs
  const panel    = document.getElementById("rb-chat-panel");
  const launcher = document.getElementById("rb-chat-launcher");
  const closeBtn = document.getElementById("rb-chat-close");
  const msgs     = document.getElementById("rb-chat-messages");
  const input    = document.getElementById("rb-chat-input");
  const sendBtn  = document.getElementById("rb-chat-send");
  const badge    = document.getElementById("rb-chat-badge");
  const tooltip  = document.getElementById("rb-chat-tooltip");

  // Abort if widget HTML not present (e.g. old index.html)
  if (!panel || !launcher) return;

  // ── Helpers
  function getModel() {
    return window._rbChatModel
      || document.querySelector(".model-btn.active")?.dataset.model
      || "gpt-4o-mini";
  }

  function getLang() {
    return window._rbChatLang
      || document.querySelector(".lang-btn.active")?.dataset.lang
      || "english";
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function scrollBottom() {
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addMessage(role, text) {
    // Remove starter buttons once conversation starts
    msgs.querySelector(".rb-starters-wrap")?.remove();

    const wrap   = document.createElement("div");
    wrap.className = `rb-msg ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "rb-bubble";
    bubble.innerHTML = esc(text)
      .replace(/\n/g, "<br>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const wrap = document.createElement("div");
    wrap.className = "rb-msg assistant";
    wrap.id = "rb-typing-indicator";
    wrap.innerHTML = '<div class="rb-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function removeTyping() {
    document.getElementById("rb-typing-indicator")?.remove();
  }

  function showStarters() {
    const wrap = document.createElement("div");
    wrap.className = "rb-starters-wrap";
    const list = document.createElement("div");
    list.className = "rb-starters";
    STARTERS.forEach(q => {
      const btn = document.createElement("button");
      btn.className = "rb-starter-btn";
      btn.textContent = q;
      btn.addEventListener("click", () => {
        input.value = q;
        sendMessage();
      });
      list.appendChild(btn);
    });
    wrap.appendChild(list);
    msgs.appendChild(wrap);
    scrollBottom();
  }

  // ── Open / close
  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    badge.classList.remove("visible");
    tooltip.classList.remove("show");
    input.focus();
    if (history.length === 0) {
      addMessage("assistant", WELCOME);
      showStarters();
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
  }

  launcher.addEventListener("click", () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener("click", closePanel);

  document.addEventListener("click", (e) => {
    if (isOpen && !panel.contains(e.target) && !launcher.contains(e.target)) {
      closePanel();
    }
  });

  // ── Input behaviour
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
    sendBtn.disabled = !input.value.trim() || isTyping;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  // ── Send
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    isTyping = true;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    if (history.length > MAX_HIST) history = history.slice(-MAX_HIST);

    showTyping();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model:    getModel(),
          language: getLang(),
        }),
      });

      removeTyping();

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data  = await res.json();
      const reply = data.reply || "Sorry, I didn't get a response. Please try again.";

      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
      if (history.length > MAX_HIST) history = history.slice(-MAX_HIST);

    } catch (err) {
      removeTyping();
      addMessage("assistant", "⚠️ Something went wrong connecting to ResearchBee. Please try again in a moment.");
      console.error("[ResearchBee chat]", err);
    }

    isTyping = false;
    sendBtn.disabled = !input.value.trim();
  }

  // ── Tooltip on first load
  setTimeout(() => {
    tooltip.classList.add("show");
    badge.classList.add("visible");
    setTimeout(() => tooltip.classList.remove("show"), 4000);
  }, 2500);

})();

// ── Init tabs ──────────────────────────────────────────────────────────────
journalTab();
subjectTab();
licenseTab();
repositoryTab();
