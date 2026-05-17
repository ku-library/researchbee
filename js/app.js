// app.js - tab router, language selector, progress helpers, chat widget
import { journalTab, subjectTab } from "./journal.js";
import { licenseTab }    from "./license.js";
import { repositoryTab } from "./repository.js";

const API_BASE = "https://nikeshn-researchbee.hf.space";

// ── Mode switcher ──────────────────────────────────────────────────────────
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
  if (panel) { panel.classList.add("active"); panel.style.display = "block"; }
}
window.activateTab = activateTab;

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});
activateTab("journals");

// ── Language selector ──────────────────────────────────────────────────────
const TRANSLATIONS = {
  "lbl-title":          { en: "Title",                              ar: "العنوان" },
  "lbl-abstract":       { en: "Abstract",                           ar: "الملخص" },
  "lbl-keywords":       { en: "Keywords (comma-separated)",         ar: "الكلمات المفتاحية (مفصولة بفاصلة)" },
  "lbl-discipline":     { en: "Discipline / sub-discipline",        ar: "التخصص / الفرع العلمي" },
  "lbl-article-type":   { en: "Article type",                       ar: "نوع المقالة" },
  "lbl-methods":        { en: "Methods (brief)",                    ar: "المنهجية (موجزة)" },
  "lbl-oa-pref":        { en: "OA preference",                      ar: "تفضيل الوصول المفتوح" },
  "lbl-apc":            { en: "APC budget",                         ar: "ميزانية رسوم النشر" },
  "lbl-ranking-pref":   { en: "Ranking filter",                     ar: "تصفية حسب التصنيف" },
  "lbl-ranking-src":    { en: "Ranking source",                     ar: "مصدر التصنيف" },
  "lbl-speed":          { en: "Publication speed",                  ar: "سرعة النشر" },
  "lbl-repo-target":    { en: "Repository target",                  ar: "المستودع المستهدف" },
  "lbl-funder":         { en: "Funder",                             ar: "الجهة الممولة" },
  "lbl-institution":    { en: "Institution",                        ar: "المؤسسة" },
  "lbl-country":        { en: "Country / region",                   ar: "الدولة / المنطقة" },
  "lbl-audience":       { en: "Target audience",                    ar: "الجمهور المستهدف" },
  "lbl-preferred":      { en: "Preferred journals (optional)",       ar: "المجلات المفضلة (اختياري)" },
  "lbl-avoid":          { en: "Journals to avoid (optional)",        ar: "المجلات المراد تجنبها (اختياري)" },
  "btn-journal-submit": { en: "Find journals & check OA policy",    ar: "ابحث عن مجلات وتحقق من سياسة الوصول المفتوح" },
  "lbl-subject":        { en: "Subject / discipline",               ar: "الموضوع / التخصص" },
  "btn-subject-submit": { en: "Search journals",                    ar: "ابحث عن مجلات" },
  "lbl-l-journal":      { en: "Journal name",                       ar: "اسم المجلة" },
  "lbl-l-issn":         { en: "ISSN (optional)",                    ar: "الرقم الدولي ISSN (اختياري)" },
  "lbl-l-publisher":    { en: "Publisher (optional)",               ar: "الناشر (اختياري)" },
  "lbl-l-version":      { en: "Manuscript version of interest",     ar: "نسخة المخطوطة المطلوبة" },
  "lbl-l-funder":       { en: "Funder (affects rights retention)",  ar: "الجهة الممولة (تؤثر على حقوق الاحتفاظ)" },
  "lbl-l-repo":         { en: "Intended deposit location",          ar: "موقع الإيداع المقصود" },
  "lbl-l-licence":      { en: "Intended licence",                   ar: "الرخصة المقصودة" },
  "lbl-l-notes":        { en: "Additional context (optional)",      ar: "سياق إضافي (اختياري)" },
  "btn-license-submit": { en: "Check Green OA policy",              ar: "تحقق من سياسة الوصول المفتوح الأخضر" },
  "lbl-r-title":        { en: "Dataset title",                      ar: "عنوان مجموعة البيانات" },
  "lbl-r-desc":         { en: "Description",                        ar: "الوصف" },
  "lbl-r-discipline":   { en: "Discipline / domain",                ar: "التخصص / المجال" },
  "lbl-r-datatypes":    { en: "Data types",                         ar: "أنواع البيانات" },
  "lbl-r-formats":      { en: "File formats",                       ar: "صيغ الملفات" },
  "lbl-r-size":         { en: "Approximate total size",             ar: "الحجم الإجمالي التقريبي" },
  "lbl-r-sensitivity":  { en: "Sensitivity classification",         ar: "تصنيف الحساسية" },
  "lbl-r-personal":     { en: "Contains personal / health data?",   ar: "يحتوي على بيانات شخصية / صحية؟" },
  "lbl-r-licence":      { en: "Intended licence",                   ar: "الرخصة المقصودة" },
  "lbl-r-embargo":      { en: "Embargo required?",                  ar: "هل يلزم حظر نشر؟" },
  "lbl-r-doi":          { en: "Persistent identifier (DOI) required?", ar: "هل يلزم معرف دائم (DOI)؟" },
  "lbl-r-versioning":   { en: "Versioning required?",               ar: "هل يلزم إدارة الإصدارات؟" },
  "lbl-r-funder":       { en: "Funder",                             ar: "الجهة الممولة" },
  "lbl-r-institution":  { en: "Institution",                        ar: "المؤسسة" },
  "lbl-r-country":      { en: "Country / region",                   ar: "الدولة / المنطقة" },
  "lbl-r-preferred":    { en: "Preferred / required repository (optional)", ar: "المستودع المفضل / المطلوب (اختياري)" },
  "lbl-r-publication":  { en: "Linked publication / DOI (optional)", ar: "المنشور المرتبط / DOI (اختياري)" },
  "lbl-r-notes":        { en: "Additional notes",                   ar: "ملاحظات إضافية" },
  "btn-repo-submit":    { en: "Find best repositories",             ar: "ابحث عن أفضل المستودعات" },
};

const PLACEHOLDERS = {
  "j-title":       { en: "Full manuscript title",                          ar: "عنوان المخطوطة كاملاً" },
  "j-abstract":    { en: "Paste your full abstract here...",               ar: "الصق ملخصك الكامل هنا..." },
  "j-keywords":    { en: "e.g. machine learning, library, open access",    ar: "مثال: تعلم آلي، مكتبة، وصول مفتوح" },
  "j-discipline":  { en: "e.g. Library and Information Science",           ar: "مثال: علم المكتبات والمعلومات" },
  "j-methods":     { en: "e.g. survey, experiment, case study",            ar: "مثال: مسح، تجربة، دراسة حالة" },
  "j-apc":         { en: "e.g. up to USD 2000, or no APC",                ar: "مثال: حتى 2000 دولار، أو بدون رسوم" },
  "j-funder":      { en: "e.g. ERC, NIH, Wellcome",                       ar: "مثال: المجلس الأوروبي للبحوث، NIH" },
  "j-institution": { en: "e.g. Khalifa University",                        ar: "مثال: جامعة خليفة" },
  "j-country":     { en: "e.g. UAE",                                       ar: "مثال: الإمارات العربية المتحدة" },
  "j-audience":    { en: "e.g. library practitioners, AI researchers",     ar: "مثال: أمناء المكتبات، باحثو الذكاء الاصطناعي" },
  "j-preferred":   { en: "e.g. Nature Communications, PLOS ONE",           ar: "مثال: Nature Communications، PLOS ONE" },
  "j-avoid":       { en: "Journals to exclude from recommendations",       ar: "المجلات المراد استبعادها من التوصيات" },
  "s-subject":     { en: "e.g. Petroleum Engineering, Machine Learning...", ar: "مثال: هندسة البترول، تعلم آلي..." },
  "l-journal":     { en: "e.g. Nature Communications",                     ar: "مثال: Nature Communications" },
  "l-issn":        { en: "e.g. 2041-1723",                                 ar: "مثال: 2041-1723" },
  "l-publisher":   { en: "e.g. Springer Nature",                           ar: "مثال: Springer Nature" },
  "l-funder":      { en: "e.g. cOAlition S, ERC, NIH",                     ar: "مثال: تحالف S، المجلس الأوروبي للبحوث" },
  "l-notes":       { en: "Already accepted? Embargo concerns?",            ar: "هل تم قبولها؟ مخاوف بشأن الحظر؟" },
  "r-title":       { en: "Descriptive title for your dataset",             ar: "عنوان وصفي لمجموعة بياناتك" },
  "r-desc":        { en: "What does the dataset contain?",                 ar: "ماذا تحتوي مجموعة البيانات؟" },
  "r-discipline":  { en: "e.g. genomics, climate science",                 ar: "مثال: علم الجينوم، علوم المناخ" },
  "r-datatypes":   { en: "e.g. tabular, images, time series",              ar: "مثال: جداول، صور، سلاسل زمنية" },
  "r-formats":     { en: "e.g. CSV, FASTQ, NetCDF, TIFF",                  ar: "مثال: CSV، FASTQ، NetCDF" },
  "r-size":        { en: "e.g. 250 MB / 5 GB / 2 TB",                      ar: "مثال: 250 ميغابايت / 5 جيجابايت" },
  "r-funder":      { en: "e.g. Horizon Europe, NIH, ADEK",                 ar: "مثال: أفق أوروبا، NIH، أديك" },
  "r-institution": { en: "e.g. Khalifa University",                        ar: "مثال: جامعة خليفة" },
  "r-country":     { en: "e.g. UAE",                                       ar: "مثال: الإمارات العربية المتحدة" },
  "r-preferred":   { en: "e.g. Zenodo, GenBank",                           ar: "مثال: Zenodo، GenBank" },
  "r-publication": { en: "Related article DOI or title",                   ar: "DOI أو عنوان المقالة المرتبطة" },
  "r-notes":       { en: "Any special requirements...",                    ar: "أي متطلبات خاصة..." },
};

function applyLanguage(lang) {
  const isAr = lang === "arabic";
  Object.entries(TRANSLATIONS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (isAr ? t.ar : t.en) +
      (el.innerHTML.includes('class="req"') ? ' <span class="req">*</span>' : '');
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
      banner.innerHTML = `<span class="ar-banner-icon">🌐</span>
        <span>تم تفعيل اللغة العربية. يمكنك كتابة مدخلاتك باللغة العربية — سيرد الذكاء الاصطناعي بالكامل باللغة العربية.</span>
        <em style="font-size:11px;opacity:.7;display:block;margin-top:3px">Arabic mode active. Type inputs in Arabic — AI will respond fully in Arabic.</em>`;
      const main = document.querySelector(".main-content");
      if (main) main.insertBefore(banner, main.firstChild);
    }
    banner.style.display = "flex";
  } else if (banner) {
    banner.style.display = "none";
  }
  document.querySelectorAll("input[type=text], textarea").forEach(el => {
    if (el.id === "rb-chat-input") return;
    el.style.direction = isAr ? "rtl" : "ltr";
    el.style.textAlign = isAr ? "right" : "left";
  });
  window._rbChatLang = lang;
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyLanguage(btn.dataset.lang);
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
    el.classList.remove("active"); el.classList.add("done");
  });
  if (message) {
    const el = document.createElement("div");
    el.className = "p-step done";
    el.style.cssText = "margin-top:6px;font-weight:600";
    el.innerHTML = `<span class="p-dot"></span><span>${message}</span>`;
    wrap.appendChild(el);
  }
}

export function hideProgress(containerId) {
  document.getElementById(containerId)?.classList.remove("show");
}

// ── Clipboard helper ───────────────────────────────────────────────────────
window.copyToClipboard = function(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.innerHTML;
    el.innerHTML = "Copied!";
    setTimeout(() => { el.innerHTML = orig; }, 1500);
  });
};

// ── Chat widget ────────────────────────────────────────────────────────────
(function initChat() {
  const MAX_HIST = 20;

  const WELCOME = "Hi! I'm ResearchBee 🐝 — KU Library's publishing assistant.\n\nChoose an option below, or type any question about publishing, Open Access, or research data.";

  const MENU_CARDS = [
    {
      emoji: "🏆", color: "#1a2744", route: "journals", prefill: {},
      title: "Find the best journal for my paper",
      desc:  "AI-matched journals with rankings, OA policy & cover letter",
    },
    {
      emoji: "🛡️", color: "#059669", route: "license", prefill: {},
      title: "Deposit my article to Khazna or other repositories",
      desc:  "Check self-archiving rights, embargo & allowed versions",
    },
    {
      emoji: "🗄️", color: "#d97706", route: "data", prefill: {},
      title: "Find the right repository for my dataset",
      desc:  "Match your data to domain-specific & institutional repos",
    },
    {
      emoji: "💬", color: "#4338CA", route: null, prefill: {},
      title: "Other publishing questions",
      desc:  "KU OA policy, APC funding, publisher agreements & more",
    },
  ];

  const TAB_META = {
    journals: { emoji: "📰", label: "Open Journal Submission tool", color: "#1a2744" },
    license:  { emoji: "🛡️", label: "Open License Checker",         color: "#059669" },
    data:     { emoji: "🗄️", label: "Open Data Repository tool",    color: "#d97706" },
  };

  let isOpen = false, isTyping = false, history = [];

  const panel    = document.getElementById("rb-chat-panel");
  const launcher = document.getElementById("rb-chat-launcher");
  const closeBtn = document.getElementById("rb-chat-close");
  const msgs     = document.getElementById("rb-chat-messages");
  const input    = document.getElementById("rb-chat-input");
  const sendBtn  = document.getElementById("rb-chat-send");
  const badge    = document.getElementById("rb-chat-badge");
  const tooltip  = document.getElementById("rb-chat-tooltip");

  if (!panel || !launcher) return;

  function getLang() {
    return window._rbChatLang
      || document.querySelector(".lang-btn.active")?.dataset.lang
      || "english";
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function addMessage(role, text) {
    msgs.querySelector(".rb-menu-wrap")?.remove();
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

  function addRouteCTA(route, prefill) {
    const meta = TAB_META[route];
    if (!meta) return;
    const wrap = document.createElement("div");
    wrap.className = "rb-msg assistant";
    const btn = document.createElement("button");
    btn.className = "rb-route-btn";
    btn.style.background = meta.color;
    btn.innerHTML = `${meta.emoji} ${meta.label} →`;
    btn.addEventListener("click", () => {
      closePanel();
      activateTabAndPrefill(route, prefill || {});
    });
    wrap.appendChild(btn);
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function activateTabAndPrefill(route, prefill) {
    // Activate tab
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.classList.remove("active"); p.style.display = "none";
    });
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${route}"]`);
    if (tabBtn) tabBtn.classList.add("active");
    const tabPanel = document.getElementById(`tab-${route}`);
    if (tabPanel) { tabPanel.classList.add("active"); tabPanel.style.display = "block"; }

    // Pre-fill fields
    const FIELD_MAP = {
      journals: { title: "j-title", abstract: "j-abstract", keywords: "j-keywords", discipline: "j-discipline", subject: "s-subject" },
      license:  { journal_name: "l-journal", issn: "l-issn", publisher: "l-publisher" },
      data:     { title: "r-title", discipline: "r-discipline", data_types: "r-datatypes" },
    };
    const map = FIELD_MAP[route] || {};
    Object.entries(prefill).forEach(([key, value]) => {
      const elId = map[key];
      if (!elId || !value) return;
      const el = document.getElementById(elId);
      if (el) el.value = value;
    });

    // Switch to correct mode for journals tab
    if (route === "journals") {
      switchMode(prefill.subject ? "subject" : "manuscript");
    }

    document.querySelector(".tabs-bar")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function showMenuCards() {
    // Remove any existing menu
    msgs.querySelector(".rb-menu-wrap")?.remove();

    const wrap = document.createElement("div");
    wrap.className = "rb-menu-wrap";

    MENU_CARDS.forEach(card => {
      const item = document.createElement("button");
      item.className = "rb-menu-card";
      item.innerHTML = `
        <span class="rb-menu-emoji">${card.emoji}</span>
        <span class="rb-menu-text">
          <span class="rb-menu-title">${card.title}</span>
          <span class="rb-menu-desc">${card.desc}</span>
        </span>
        <span class="rb-menu-arrow" style="color:${card.color}">→</span>`;

      item.addEventListener("click", () => {
        if (card.route) {
          // Direct tool routes — close panel and go to tab
          closePanel();
          activateTabAndPrefill(card.route, card.prefill);
        } else {
          // Free chat — remove menu, focus input
          wrap.remove();
          input.focus();
        }
      });
      wrap.appendChild(item);
    });

    // Clear button — restores menu
    const clearBtn = document.createElement("button");
    clearBtn.className = "rb-clear-btn";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
      // Clear messages and history, show fresh menu
      msgs.innerHTML = "";
      history = [];
      addMessage("assistant", WELCOME);
      showMenuCards();
    });
    wrap.appendChild(clearBtn);

    msgs.appendChild(wrap);
    scrollBottom();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    badge.classList.remove("visible");
    tooltip.classList.remove("show");
    input.focus();
    if (history.length === 0) {
      addMessage("assistant", WELCOME);
      showMenuCards();
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
  }

  const mobileBar = document.getElementById("rb-mobile-chat-bar");

  launcher.addEventListener("click", () => isOpen ? closePanel() : openPanel());
  mobileBar?.addEventListener("click", () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("click", (e) => {
    const clickedMobileBar = mobileBar && mobileBar.contains(e.target);
    if (isOpen && !panel.contains(e.target) && !launcher.contains(e.target) && !clickedMobileBar) {
      closePanel();
    }
  });

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

    // Create streaming bubble
    msgs.querySelector(".rb-menu-wrap")?.remove();
    const wrap   = document.createElement("div");
    wrap.className = "rb-msg assistant";
    const bubble = document.createElement("div");
    bubble.className = "rb-bubble";
    bubble.innerHTML = '<span class="rb-cursor">▌</span>';
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    scrollBottom();

    let fullText = "";

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, language: getLang() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   route   = null;
      let   prefill = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("

");
        buffer = lines.pop(); // keep incomplete chunk

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));

            if (evt.done) {
              // Final event — use clean reply from server
              route   = evt.route   || null;
              prefill = evt.prefill || {};
              if (evt.reply) {
                fullText = evt.reply;
              }
            } else if (evt.token) {
              fullText += evt.token;
            }

            // Update bubble with current text
            bubble.innerHTML = esc(fullText).replace(/
/g, "<br>")
              .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
              + (evt.done ? "" : '<span class="rb-cursor">▌</span>');
            scrollBottom();

          } catch (_) { /* malformed SSE chunk — skip */ }
        }
      }

      // Store clean reply in history
      const cleanReply = fullText.trim();
      history.push({ role: "assistant", content: cleanReply });
      if (history.length > MAX_HIST) history = history.slice(-MAX_HIST);

      // Show routing CTA
      if (route && TAB_META[route]) {
        addRouteCTA(route, prefill);
      }

    } catch (err) {
      bubble.innerHTML = "⚠️ Something went wrong. Please try again in a moment.";
      console.error("[ResearchBee chat]", err);
    }

    isTyping = false;
    sendBtn.disabled = !input.value.trim();
  }

  // Tooltip on first load
  setTimeout(() => {
    tooltip.classList.add("show");
    badge.classList.add("visible");
    setTimeout(() => tooltip.classList.remove("show"), 4000);
  }, 2500);

})();

// ── Init ───────────────────────────────────────────────────────────────────
journalTab();
subjectTab();
licenseTab();
repositoryTab();
