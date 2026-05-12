// app.js - tab router, model selector, progress indicator
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

// ── Language selector + UI translation ───────────────────────────────────
const TRANSLATIONS = {
  // Tab 1 - Journal submission
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
  // Tab 1 - Subject browse
  "lbl-subject":        { en: "Subject / discipline",     ar: "الموضوع / التخصص" },
  "btn-subject-submit": { en: "Search journals",          ar: "ابحث عن مجلات" },
  // Tab 2 - License checking
  "lbl-l-journal":      { en: "Journal name",             ar: "اسم المجلة" },
  "lbl-l-issn":         { en: "ISSN (optional)",          ar: "الرقم الدولي ISSN (اختياري)" },
  "lbl-l-publisher":    { en: "Publisher (optional)",     ar: "الناشر (اختياري)" },
  "lbl-l-version":      { en: "Manuscript version of interest", ar: "نسخة المخطوطة المطلوبة" },
  "lbl-l-funder":       { en: "Funder (affects rights retention)", ar: "الجهة الممولة (تؤثر على حقوق الاحتفاظ)" },
  "lbl-l-repo":         { en: "Intended deposit location", ar: "موقع الإيداع المقصود" },
  "lbl-l-licence":      { en: "Intended licence",         ar: "الرخصة المقصودة" },
  "lbl-l-notes":        { en: "Additional context (optional)", ar: "سياق إضافي (اختياري)" },
  "btn-license-submit": { en: "Check Green OA policy",    ar: "تحقق من سياسة الوصول المفتوح الأخضر" },
  // Tab 3 - Data repository
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

  // Translate labels
  Object.entries(TRANSLATIONS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (isAr ? t.ar : t.en) + (el.innerHTML.includes('class="req"') ? ' <span class="req">*</span>' : '');
  });

  // Translate placeholders
  Object.entries(PLACEHOLDERS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = isAr ? t.ar : t.en;
  });

  // Show/hide Arabic instruction banner
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

  // RTL direction on inputs only (not full page)
  document.querySelectorAll("input[type=text], textarea").forEach(el => {
    el.style.direction = isAr ? "rtl" : "ltr";
    el.style.textAlign = isAr ? "right" : "left";
  });
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
subjectTab();
licenseTab();
repositoryTab();
