function collectContextInPage() {
  try {
    const out = { source: null, text: null, fillTarget: false };
    const el = document.activeElement;
    let prefillText = '';
    const tag = el && el.tagName;
    if (el && (tag === 'INPUT' || tag === 'TEXTAREA')) {
      window.__tzbTarget = el;
      window.__tzbKind = 'field';
      window.__tzbSelStart = el.selectionStart;
      window.__tzbSelEnd = el.selectionEnd;
      out.fillTarget = true;
      prefillText = el.value || '';
    } else if (el && el.isContentEditable) {
      window.__tzbTarget = el;
      window.__tzbKind = 'ce';
      const s = window.getSelection();
      if (s && s.rangeCount) window.__tzbRange = s.getRangeAt(0).cloneRange();
      else window.__tzbRange = null;
      out.fillTarget = true;
      prefillText = el.innerText || '';
    }
    const sel = window.getSelection && window.getSelection().toString();
    if (sel && sel.trim()) { out.source = 'selection'; out.text = sel.trim(); return out; }
    if (!prefillText) return out;
    const re = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?:\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?)?\s*(UTC|GMT|ET|EST|EDT|CT|CST|CDT|MT|MST|MDT|PT|PST|PDT|AKST|AKDT|HST|BST|WET|CET|CEST|EET|EEST|MSK|IST|JST|KST|SGT|HKT|GST|AEST|AEDT|AWST|ACST|ACDT|NZST|NZDT|IRISH)?\b/gi;
    let m, last = null;
    while ((m = re.exec(prefillText)) !== null) {
      if (m[3] || m[6] || m[7] || /:/.test(m[0])) last = m[0];
    }
    if (last) { out.source = 'field'; out.text = last; }
    return out;
  } catch (_) { return { source: null, text: null, fillTarget: false }; }
}

function fillInPage(text) {
  try {
    const el = window.__tzbTarget;
    if (!el || !el.isConnected) return false;
    el.focus();
    if (window.__tzbKind === 'field') {
      const start = window.__tzbSelStart != null ? window.__tzbSelStart : el.value.length;
      const end = window.__tzbSelEnd != null ? window.__tzbSelEnd : el.value.length;
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const newVal = before + text + after;
      const proto = el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, newVal);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      const caret = start + text.length;
      try { el.setSelectionRange(caret, caret); } catch (_) {}
      window.__tzbSelStart = caret;
      window.__tzbSelEnd = caret;
      return true;
    }
    if (window.__tzbKind === 'ce') {
      const sel = window.getSelection();
      if (window.__tzbRange) { sel.removeAllRanges(); sel.addRange(window.__tzbRange); }
      let ok = false;
      try { ok = document.execCommand('insertText', false, text); } catch (_) {}
      if (!ok) {
        const r = (sel && sel.rangeCount) ? sel.getRangeAt(0) : null;
        if (!r) return false;
        r.deleteContents();
        const node = document.createTextNode(text);
        r.insertNode(node);
        r.setStartAfter(node); r.setEndAfter(node);
        sel.removeAllRanges(); sel.addRange(r);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
      if (sel.rangeCount) window.__tzbRange = sel.getRangeAt(0).cloneRange();
      return true;
    }
    return false;
  } catch (_) { return false; }
}

let activeTabId = null;
let fillAvailable = false;

async function grabFromActiveTab() {
  try {
    if (!chrome.scripting || !chrome.tabs) return null;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return null;
    activeTabId = tab.id;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectContextInPage,
    });
    return (results && results[0] && results[0].result) || null;
  } catch (_) { return null; }
}

async function fillFromPopup(text) {
  try {
    if (!chrome.scripting || activeTabId == null) return false;
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      func: fillInPage,
      args: [text],
    });
    return !!(results && results[0] && results[0].result);
  } catch (_) { return false; }
}

const COPY_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.5"/><path d="M3 10.5V3.5A1.5 1.5 0 0 1 4.5 2H11"/></svg>`;
const FILL_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h6"/><path d="M5.5 5.5 8 8l-2.5 2.5"/><path d="M11 3v10M9.5 3h3M9.5 13h3"/></svg>`;

function buildPill(className, labelText, abbrText) {
  const pill = document.createElement('span');
  pill.className = className;
  pill.appendChild(document.createTextNode(labelText));
  const abbrSpan = document.createElement('span');
  abbrSpan.className = 'pill-abbr';
  abbrSpan.textContent = abbrText;
  pill.appendChild(abbrSpan);
  return pill;
}

function makeRow({ label, zone, abbrOverride, color, instant, endInstant, sourceZone, hour12, showAmPm, settings }) {
  const colorKey = TZB.colorKeyFor({ color }, zone);
  const abbr = TZB.abbrFor(instant, zone, settings);
  const srcAbbr = TZB.abbrFor(instant, sourceZone, settings);
  const srcTime = TZB.compactRange(instant, endInstant, sourceZone, hour12, showAmPm);
  const rowTime = TZB.compactRange(instant, endInstant, zone, hour12, showAmPm);
  const sameZone = zone === sourceZone;
  const dd = sameZone ? 0 : TZB.dayDiff(instant, zone, sourceZone);
  const ddText = dd === 0 ? '' : (dd > 0 ? '+1d' : '-1d');

  const li = document.createElement('li');
  li.className = `row color-${colorKey}`;

  const pill = buildPill(`pill color-${colorKey}`, label, abbr);

  const pair = document.createElement('span');
  pair.className = 'pair';
  let copyText;
  if (sameZone) {
    const same = document.createElement('span');
    same.className = 'same';
    same.textContent = `${rowTime} ${abbr}`;
    pair.appendChild(same);
    copyText = `${rowTime} ${abbr}`;
  } else {
    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '/';
    pair.append(
      document.createTextNode(`${srcTime} ${srcAbbr}`),
      sep,
      document.createTextNode(`${rowTime} ${abbr}`)
    );
    copyText = `${srcTime} ${srcAbbr} / ${rowTime} ${abbr}`;
    if (ddText) {
      const ddSpan = document.createElement('span');
      ddSpan.className = 'daydiff';
      ddSpan.textContent = ddText;
      pair.appendChild(ddSpan);
      copyText += ` (${ddText === '+1d' ? 'next day' : 'previous day'})`;
    }
  }

  const actions = document.createElement('span');
  actions.className = 'row-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'icon-btn';
  copyBtn.title = `Copy: ${copyText}`;
  copyBtn.setAttribute('aria-label', 'Copy');
  copyBtn.innerHTML = COPY_ICON;
  copyBtn.addEventListener('click', (e) => { e.stopPropagation(); copyRow(li, pair, copyText); });

  const fillBtn = document.createElement('button');
  fillBtn.type = 'button';
  fillBtn.className = 'icon-btn';
  fillBtn.innerHTML = FILL_ICON;
  if (fillAvailable) {
    fillBtn.title = `Insert into focused field: ${copyText}`;
    fillBtn.setAttribute('aria-label', 'Insert into focused field');
    fillBtn.addEventListener('click', (e) => { e.stopPropagation(); fillRow(li, pair, copyText); });
  } else {
    fillBtn.title = 'No text field detected on the page — click into one before opening this popup';
    fillBtn.setAttribute('aria-label', 'Insert (no field detected)');
    fillBtn.disabled = true;
  }

  actions.append(copyBtn, fillBtn);

  li.appendChild(pill);
  li.appendChild(pair);
  li.appendChild(actions);
  return li;
}

function flashRow(li, pair, stateClass, labelClass, labelText, ms = 900) {
  const saved = [...pair.childNodes].map(n => n.cloneNode(true));
  pair.textContent = '';
  const label = document.createElement('span');
  label.className = labelClass;
  label.textContent = labelText;
  pair.appendChild(label);
  li.classList.add(stateClass);
  setTimeout(() => {
    pair.textContent = '';
    saved.forEach(n => pair.appendChild(n));
    li.classList.remove(stateClass);
  }, ms);
}

async function copyRow(li, pair, text) {
  try {
    await navigator.clipboard.writeText(text);
    flashRow(li, pair, 'copied', 'copied-label', 'Copied!');
  } catch (e) {
    pair.textContent = 'Copy failed';
  }
}

async function fillRow(li, pair, text) {
  const ok = await fillFromPopup(text);
  if (ok) flashRow(li, pair, 'filled', 'filled-label', 'Inserted!');
  else flashRow(li, pair, 'copied', 'copied-label', 'Insert failed');
}

function render(settings, parsed) {
  const sourceLine = document.getElementById('sourceLine');
  const results = document.getElementById('results');
  results.replaceChildren();

  const now = new Date();
  let instant, endInstant = null, sourceZone;

  if (!parsed) {
    instant = now;
    sourceZone = settings.defaultSourceZone;
    sourceLine.classList.remove('error');
    const abbr = TZB.abbrFor(instant, sourceZone, settings);
    sourceLine.textContent = `Current time in ${sourceZone} (${abbr}). Type a time to convert.`;
  } else {
    sourceZone = parsed.zoneIANA || settings.defaultSourceZone;
    const pad = (n) => n.toString().padStart(2, '0');
    let srcDesc = `${pad(parsed.hour)}:${pad(parsed.minute)}`;
    if (parsed.endHour != null) srcDesc += `–${pad(parsed.endHour)}:${pad(parsed.endMinute)}`;
    if (parsed.zoneToken && !parsed.zoneIANA) {
      sourceLine.classList.add('error');
      sourceLine.textContent = `Unknown zone "${parsed.zoneToken}" — using ${sourceZone}.`;
    } else {
      sourceLine.classList.remove('error');
      const tokenDisp = parsed.zoneToken ? parsed.zoneToken.toUpperCase() : sourceZone;
      sourceLine.textContent = `Source: ${srcDesc} ${tokenDisp}`;
    }
    instant = TZB.wallClockToInstant(
      now.getFullYear(), now.getMonth() + 1, now.getDate(),
      parsed.hour, parsed.minute, sourceZone
    );
    if (parsed.endHour != null) {
      endInstant = TZB.wallClockToInstant(
        now.getFullYear(), now.getMonth() + 1, now.getDate(),
        parsed.endHour, parsed.endMinute, sourceZone
      );
      // "10pm-2am" — the end lands on the next day
      if (endInstant <= instant) endInstant = new Date(endInstant.getTime() + 86400000);
    }
  }

  const showAmPm = parsed ? parsed.ampmExplicit : true;

  for (const t of settings.targets) {
    results.appendChild(makeRow({
      label: t.label, zone: t.zone, color: t.color,
      instant, endInstant, sourceZone,
      hour12: settings.hour12,
      showAmPm,
      settings,
    }));
  }

  if (settings.targets.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No target zones. Add some in Settings.';
    results.appendChild(empty);
  }
}

function renderFromInput(settings, raw) {
  if (!raw || !raw.trim() || /^\s*now\s*$/i.test(raw)) { render(settings, null); return; }
  const parsed = TZB.parseInput(raw, settings.ambiguous);
  if (!parsed) {
    const sourceLine = document.getElementById('sourceLine');
    sourceLine.classList.add('error');
    sourceLine.textContent = `Couldn't parse "${raw}".`;
    document.getElementById('results').replaceChildren();
    return;
  }
  render(settings, parsed);
}

async function main() {
  const settings = await TZB.loadSettings();
  const input = document.getElementById('input');
  render(settings, null);
  input.addEventListener('input', () => renderFromInput(settings, input.value));
  document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL('options.html'));
  });
  const ctx = await grabFromActiveTab();
  fillAvailable = !!(ctx && ctx.fillTarget);
  if (ctx && ctx.text) {
    input.value = ctx.text;
    input.select();
    renderFromInput(settings, ctx.text);
  } else {
    render(settings, null);
  }
}

document.addEventListener('DOMContentLoaded', main);
