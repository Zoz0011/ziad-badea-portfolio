'use strict';

// This browser preview follows the source's Reading, InsulinRegimen, DoseLog
// and ClinicianPlanItem records. It contains no treatment or dose algorithm.
const STORAGE_KEY = 'ziad_mom_care_portfolio_demo_v1';
const allowedViews = new Set(['home', 'schedule', 'more', 'readings', 'insulin', 'plan']);
const content = document.querySelector('#content');
const dialog = document.querySelector('#form-dialog');
const form = document.querySelector('#entry-form');
const fields = document.querySelector('#dialog-fields');
let storageAvailable = true;
let state = loadState();
let view = allowedViews.has(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let toastTimer;

function emptyState() {
  return { readings: [], regimens: [], doses: [], plans: [], dark: false, largeText: false };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return emptyState();
    const list = key => Array.isArray(raw[key]) ? raw[key].filter(item => item && typeof item === 'object').slice(0, 200) : [];
    return {
      readings: list('readings').filter(item => Number.isFinite(item.value) && Number.isFinite(Date.parse(item.when))),
      regimens: list('regimens').filter(item => typeof item.name === 'string' && typeof item.id === 'string'),
      doses: list('doses').filter(item => typeof item.insulinName === 'string' && Number.isFinite(Date.parse(item.actualTakenAt))),
      plans: list('plans').filter(item => typeof item.text === 'string' && ['glucoseTiming', 'hypoglycemia'].includes(item.kind)),
      dark: raw.dark === true,
      largeText: raw.largeText === true,
    };
  } catch (_) {
    storageAvailable = false;
    return emptyState();
  }
}

function saveState(message = 'تم حفظ السجل التجريبي محليًا.') {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch (_) {
    storageAvailable = false;
    message = 'تعذر الحفظ في المتصفح. السجل موجود مؤقتًا حتى إغلاق الصفحة أو تحديثها.';
  }
  render();
  toast(message);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function id() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function formatDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'وقت غير محدد';
}
function localTimeInput() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function safeDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('اختاري تاريخًا ووقتًا صحيحين.');
  return date.toISOString();
}
function title(name, subtitle, action = '') {
  return `<div class="page-title"><div><h1>${name}</h1><p>${subtitle}</p></div>${action}</div>`;
}
function empty(label, description, icon = '♡') {
  return `<div class="empty"><span class="tile-icon" aria-hidden="true">${icon}</span><strong>${label}</strong><p>${description}</p></div>`;
}
function deleteButton(type, entryId) {
  return `<button class="delete-button" data-action="delete" data-type="${type}" data-id="${esc(entryId)}" aria-label="حذف السجل التجريبي" title="حذف السجل">×</button>`;
}
function quickCard(target, icon, name, description) {
  return `<button class="quick-card" data-view="${target}"><span class="tile-icon" aria-hidden="true">${icon}</span><b>${name}</b><p>${description}</p></button>`;
}
function readingList(items) {
  return items.map(item => `<article class="record"><div><strong class="record-number"><span dir="ltr">${esc(item.value)} <small>mg/dL</small></span></strong><p>${esc(item.context)} · ${esc(formatDate(item.when))}</p></div>${deleteButton('readings', item.id)}</article>`).join('');
}
function doseList() {
  return state.doses.map(item => `<article class="record"><div><strong>${esc(item.insulinName)} — ${esc(item.actualDose)} وحدة</strong><p>${esc(formatDate(item.actualTakenAt))} · حدث مُبلّغ عنه</p></div>${deleteButton('doses', item.id)}</article>`).join('');
}
function regimenList(withLogButton = true) {
  return state.regimens.map(item => `<article class="record"><div><strong>${esc(item.name)}</strong><p>النص الموصوف: ${esc(item.prescribedDose)} وحدة<br>الوقت المكتوب: ${esc(item.prescribedTime)}</p></div><div class="record-buttons">${withLogButton ? `<button class="button secondary small-button" data-action="add-dose" data-id="${esc(item.id)}">توثيق حدث</button>` : ''}${deleteButton('regimens', item.id)}</div></article>`).join('');
}

function homePage() {
  const latest = state.readings[0];
  return `<section class="welcome"><div class="welcome-message"><p class="eyebrow">MOM CARE · مساحة التجربة</p><h1>أهلًا يا ماما ♡</h1><p>سجلك اليومي في مكان واحد. جرّبي إضافة قياس أو توثيق حدث أو حفظ نص الخطة، باستخدام أمثلة فقط.</p><button class="button" data-action="add-reading">＋ تسجيل قياس تجريبي</button></div><div class="card latest-card"><div class="card-label"><span class="tile-icon" aria-hidden="true">♡</span>آخر قياس مسجّل</div><div class="latest-value" dir="ltr">${latest ? esc(latest.value) : '—'}<small>mg/dL</small></div><p class="muted">${latest ? `${esc(latest.context)} · ${esc(formatDate(latest.when))}` : 'ابدئي بأول قياس تجريبي'}</p></div></section>
    <div class="section-heading"><h2>حاجة بسيطة، كل يوم</h2><span class="badge">بيانات التجربة</span></div>
    <section class="quick-grid">${quickCard('readings', '♡', 'سجل السكر', `${state.readings.length} قياس محفوظ محليًا`)}${quickCard('insulin', '✦', 'الأنسولين والخطة', `${state.doses.length} حدث مُبلّغ عنه`)}${quickCard('plan', '▤', 'خطة الطبيب', `${state.plans.length} نص مرجعي محفوظ`)}</section>
    <p class="subtle-notice">هذه مساحة عرض لواجهة المشروع. تُدخل القيم والنصوص يدويًا، ولا تُحسب جرعات أو تُفسّر القراءات. بيانات المعاينة محفوظة في هذا المتصفح فقط.</p>
    <div class="section-heading"><h2>آخر السجلات</h2><a href="#readings" data-view="readings">عرض الكل ←</a></div><section class="record-list">${state.readings.length ? readingList(state.readings.slice(0, 3)) : `<div class="card">${empty('سجلك لسه في البداية', 'أضيفي قياسًا تجريبيًا من الزر بالأعلى لرؤية طريقة عرض السجلات.')}</div>`}</section>`;
}

function readingsPage() {
  return `<button class="back-link" data-view="home">→ الرئيسية</button>${title('سجل السكر', 'قياسات تدخلينها يدويًا، مع الوقت والسياق.', '<button class="button primary" data-action="add-reading">＋ إضافة قياس</button>')}
    <div class="record-list">${state.readings.length ? readingList(state.readings) : `<section class="card">${empty('لا توجد قياسات محفوظة', 'أضيفي رقمًا تجريبيًا لقياس السكر، واختاري الوقت والسياق.', '♡')}</section>`}</div><p class="subtle-notice">السجل يعرض الأرقام كما كُتبت، ولا يقدم تفسيرًا أو توصية علاجية.</p>`;
}

function insulinPage() {
  return `<button class="back-link" data-view="more">→ المزيد</button>${title('الأنسولين والخطة', 'مرجع مكتوب وتوثيق بعد حدوث الجرعة؛ بدون تحديد جرعة.')}
    <div class="section-stack"><section class="card"><div class="section-heading" style="margin-top:0"><h2>مراجع خطة الطبيب</h2><button class="button secondary small-button" data-action="add-regimen">＋ إضافة بند</button></div><p>انسخي نصًا تجريبيًا لبند راجعه الطبيب. لا يتحول الإدخال إلى قرار علاجي أو منبّه.</p><div class="record-list">${state.regimens.length ? regimenList() : empty('لا توجد بنود محفوظة', 'أضيفي مرجعًا تجريبيًا أولًا، ثم جرّبي توثيق حدث مُبلّغ عنه.', '▤')}</div></section><section class="card"><h2>سجل الجرعات المُبلّغ عنها</h2><p>حدث يدخله المستخدم بعد وقوعه؛ لا يمثل تحققًا سريريًا.</p><div class="record-list">${state.doses.length ? doseList() : empty('لا توجد أحداث موثقة', 'ستظهر هنا الأحداث التي تُسجلينها من بند الخطة.', '✦')}</div></section></div>`;
}

function planPage() {
  const group = (name, kind) => {
    const items = state.plans.filter(item => item.kind === kind);
    return `<section class="card"><div class="section-heading" style="margin-top:0"><h2>${name}</h2><button class="button secondary small-button" data-action="add-plan" data-kind="${kind}">＋ إضافة نص</button></div><div class="record-list">${items.length ? items.map(item => `<article class="record"><p>${esc(item.text)}</p>${deleteButton('plans', item.id)}</article>`).join('') : empty('الخطة تبدأ فارغة', 'احفظي نصًا تجريبيًا مرجعيًا، بدون تعليمات ينشئها التطبيق.', '▤')}</div></section>`;
  };
  return `<button class="back-link" data-view="more">→ المزيد</button>${title('قائمة خطة الطبيب', 'نصوص تحفظينها كما كُتبت؛ التطبيق لا يفسرها أو يغيرها.')}<div class="split-grid">${group('متى يتم القياس', 'glucoseTiming')}${group('خطة هبوط السكر', 'hypoglycemia')}</div><p class="subtle-notice">كل البنود فارغة افتراضيًا. النصوص المدخلة أمثلة للعرض فقط، ولا تُنشئ تذكيرات أو توصيات.</p>`;
}

function schedulePage() {
  return `${title('جدولي', 'استعراض مراجع الخطة المكتوبة في تجربة المتصفح.')}<section class="card"><h2>مراجع الأنسولين المحفوظة</h2><p>الأوقات هنا نصوص مرجعية كما أدخلتها. هذه المعاينة لا ترسل تنبيهات ولا تحدد أن علاجًا مستحق الآن.</p><div class="record-list">${state.regimens.length ? regimenList(false) : empty('لا توجد مراجع اليوم', 'ابدئي بإضافة بند تجريبي من صفحة الأنسولين والخطة.', '▤')}</div><button class="button secondary wide" data-view="insulin" style="margin-top:20px">فتح الأنسولين والخطة ←</button></section><p class="subtle-notice">جدولة الإشعارات المحلية ميزة خاصة بتطبيق الهاتف، وغير مفعلة في تجربة الويب.</p>`;
}

function morePage() {
  return `${title('المزيد', 'أدوات مرتبة، عشان تفضل الرئيسية بسيطة.')}<section class="more-grid">${quickCard('readings', '♡', 'السكر والأعراض', 'سجل قياسات السكر متاح في هذه المعاينة')}${quickCard('insulin', '✦', 'الأنسولين والخطة', 'مرجع مكتوب وسجل أحداث مُبلّغ عنها')}${quickCard('plan', '▤', 'خطة الطبيب', 'نصوص مرجعية تدخلينها يدويًا')}${quickCard('schedule', '◷', 'جدولي', 'عرض الأوقات المكتوبة في مراجع الخطة')}</section><section class="limitations"><h2>عن تجربة المتصفح</h2><p>هذه معاينة HTML تفاعلية مستوحاة من الشاشات والسجلات الأصلية لمشروع Flutter. الإشعارات، قراءة الروشتة، حسابات المرافقين، المزامنة السحابية والاتصال بالطوارئ غير مفعّلة هنا. السجلات التجريبية محفوظة محليًا في هذا المتصفح ويمكن مسحها.</p></section><div class="reset-row"><button data-action="reset">مسح بيانات هذه التجربة</button></div>`;
}

function render() {
  document.body.classList.toggle('dark', state.dark);
  document.body.classList.toggle('large-text', state.largeText);
  const pages = { home: homePage, readings: readingsPage, insulin: insulinPage, plan: planPage, schedule: schedulePage, more: morePage };
  content.innerHTML = (!storageAvailable ? '<p class="subtle-notice" role="alert">الحفظ في المتصفح غير متاح. البيانات مؤقتة في هذه الصفحة فقط.</p>' : '') + pages[view]();
  const activeTab = ['readings', 'insulin', 'plan'].includes(view) ? 'more' : view;
  document.querySelectorAll('.bottom-nav button').forEach(button => {
    if (button.dataset.view === activeTab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const themeButton = document.querySelector('#theme-toggle');
  themeButton.textContent = state.dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', state.dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الليلي');
  document.querySelector('#text-toggle').setAttribute('aria-pressed', String(state.largeText));
}

function navigate(target) {
  if (!allowedViews.has(target)) return;
  view = target;
  history.replaceState(null, '', `#${view}`);
  render();
  content.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4200);
}

function showForm(name, html, onSave, buttonText = 'حفظ السجل') {
  document.querySelector('#dialog-title').textContent = name;
  fields.innerHTML = html;
  document.querySelector('#form-error').textContent = '';
  document.querySelector('#save-button').textContent = buttonText;
  form.onsubmit = event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      onSave(new FormData(form));
      dialog.close();
    } catch (error) {
      document.querySelector('#form-error').textContent = error.message || 'راجعي البيانات ثم حاولي مرة أخرى.';
    }
  };
  dialog.showModal();
}

function addReading() {
  showForm('إضافة قياس تجريبي', `<label class="field">قياس السكر (mg/dL)<input name="value" type="number" inputmode="numeric" min="20" max="600" step="1" required placeholder="رقم تجريبي"></label><label class="field">وقت القياس<input name="when" type="datetime-local" value="${localTimeInput()}" required></label><label class="field">سياق القياس<select name="context"><option>غير محدد</option><option>صائم</option><option>قبل الأكل</option><option>بعد الأكل</option><option>قبل النوم</option></select></label><p class="muted">يُحفظ الرقم كما تدخلينه، بدون تفسير أو تقييم.</p>`, data => {
    const value = Number(data.get('value'));
    if (!Number.isInteger(value) || value < 20 || value > 600) throw new Error('أدخلي رقمًا صحيحًا داخل نطاق النموذج.');
    state.readings.unshift({ id: id(), value, when: safeDate(data.get('when')), context: String(data.get('context')) });
    state.readings.sort((a, b) => Date.parse(b.when) - Date.parse(a.when));
    state.readings = state.readings.slice(0, 200);
    saveState();
  });
}

function addRegimen() {
  showForm('إضافة مرجع تجريبي', '<label class="field">اسم الأنسولين كما كُتب<input name="name" maxlength="80" required></label><label class="field">نص الجرعة المكتوب (وحدة)<input name="dose" maxlength="80" required placeholder="نص مرجعي؛ لا يتم حسابه"></label><label class="field">الوقت المكتوب في الخطة<input name="time" maxlength="120" required></label><label class="checkbox"><input name="reviewed" type="checkbox" required><span>هذا مثال لبند راجعه الطبيب؛ لا أطلب من التطبيق تحديد جرعة.</span></label>', data => {
    const name = String(data.get('name')).trim();
    const prescribedDose = String(data.get('dose')).trim();
    const prescribedTime = String(data.get('time')).trim();
    if (!name || !prescribedDose || !prescribedTime) throw new Error('أكملي الاسم والنص والوقت المكتوب.');
    state.regimens.unshift({ id: id(), name, prescribedDose, prescribedTime, clinicianVerified: true });
    state.regimens = state.regimens.slice(0, 200);
    saveState('تم حفظ المرجع التجريبي كما كُتب.');
  });
}

function addDose(entryId) {
  const regimen = state.regimens.find(item => item.id === entryId);
  if (!regimen) return;
  showForm('توثيق حدث مُبلّغ عنه', `<p class="subtle-notice">البند المرجعي: ${esc(regimen.name)}. هذا نموذج لتوثيق حدث وقع بالفعل، ولا يحدد جرعة.</p><label class="field">نص الجرعة المُبلّغ عنها (وحدة)<input name="dose" maxlength="80" required></label><label class="field">الوقت المُبلّغ عنه<input name="when" type="datetime-local" value="${localTimeInput()}" required></label><label class="checkbox"><input name="reported" type="checkbox" required><span>أسجل حدثًا تجريبيًا مُبلّغًا عنه بعد حدوثه.</span></label>`, data => {
    const actualDose = String(data.get('dose')).trim();
    if (!actualDose) throw new Error('أدخلي النص المُبلّغ عنه.');
    state.doses.unshift({ id: id(), regimenId: regimen.id, insulinName: regimen.name, actualDose, actualTakenAt: safeDate(data.get('when')), loggedAt: new Date().toISOString() });
    state.doses.sort((a, b) => Date.parse(b.actualTakenAt) - Date.parse(a.actualTakenAt));
    state.doses = state.doses.slice(0, 200);
    saveState('تم توثيق الحدث التجريبي؛ ليس تحققًا سريريًا.');
  }, 'توثيق الحدث');
}

function addPlan(kind) {
  if (!['glucoseTiming', 'hypoglycemia'].includes(kind)) return;
  showForm('إضافة نص مرجعي', '<label class="field">النص كما كُتب في الخطة<textarea name="text" maxlength="1600" required placeholder="اكتبي نصًا تجريبيًا فقط"></textarea></label><label class="checkbox"><input name="reviewed" type="checkbox" required><span>هذا مثال لنص راجعه مختص، والتطبيق لا يفسره أو يغيّره.</span></label>', data => {
    const text = String(data.get('text')).trim();
    if (!text) throw new Error('أدخلي النص المرجعي.');
    state.plans.unshift({ id: id(), kind, text, clinicianVerified: true });
    state.plans = state.plans.slice(0, 200);
    saveState('تم حفظ النص التجريبي كما كُتب.');
  });
}

function removeEntry(type, entryId) {
  if (!['readings', 'regimens', 'doses', 'plans'].includes(type)) return;
  showForm('حذف السجل التجريبي؟', '<p>سيُحذف هذا السجل من بيانات التجربة في هذا المتصفح. لن يمكن استرجاعه من المعاينة.</p>', () => {
    state[type] = state[type].filter(item => item.id !== entryId);
    saveState('تم حذف السجل التجريبي.');
  }, 'حذف السجل');
}

document.addEventListener('click', event => {
  const element = event.target.closest('[data-view], [data-action]');
  if (!element) return;
  event.preventDefault();
  if (element.dataset.view) return navigate(element.dataset.view);
  const action = element.dataset.action;
  if (action === 'add-reading') addReading();
  if (action === 'add-regimen') addRegimen();
  if (action === 'add-dose') addDose(element.dataset.id);
  if (action === 'add-plan') addPlan(element.dataset.kind);
  if (action === 'delete') removeEntry(element.dataset.type, element.dataset.id);
  if (action === 'reset') showForm('مسح بيانات التجربة؟', '<p>سيتم مسح القياسات ومراجع الأنسولين والأحداث والنصوص المحفوظة لهذه المعاينة فقط.</p>', () => {
    state = emptyState();
    saveState('تم مسح بيانات التجربة.');
  }, 'مسح بيانات التجربة');
});

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#theme-toggle').addEventListener('click', () => { state.dark = !state.dark; saveState(state.dark ? 'تم تفعيل الوضع الليلي.' : 'تم تفعيل الوضع الفاتح.'); });
document.querySelector('#text-toggle').addEventListener('click', () => { state.largeText = !state.largeText; saveState(state.largeText ? 'تم تكبير الخط.' : 'تمت استعادة حجم الخط.'); });
window.addEventListener('hashchange', () => { const target = location.hash.slice(1); if (allowedViews.has(target)) navigate(target); });
render();
