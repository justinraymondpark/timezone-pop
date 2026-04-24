function collectContextInPage() {
  try {
    const sel = window.getSelection && window.getSelection().toString();
    if (sel && sel.trim()) return { source: 'selection', text: sel.trim() };
    const el = document.activeElement;
    if (!el) return null;
    let text = '';
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') text = el.value || '';
    else if (el.isContentEditable) text = el.innerText || '';
    if (!text) return null;
    const re = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM|a\.m\.|p\.m\.)?\s*(UTC|GMT|ET|EST|EDT|CT|CST|CDT|MT|MST|MDT|PT|PST|PDT|AKST|AKDT|HST|BST|WET|CET|CEST|EET|EEST|MSK|IST|JST|KST|SGT|HKT|AEST|AEDT|AWST|ACST|ACDT|NZST|NZDT|IRISH)?\b/gi;
    let m, last = null;
    while ((m = re.exec(text)) !== null) {
      if (m[3] || m[4] || /:/.test(m[0])) last = m[0];
    }
    return last ? { source: 'field', text: last } : null;
  } catch (_) { return null; }
}

async function grabFromActiveTab() {
  try {
    if (!chrome.scripting || !chrome.tabs) return null;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return null;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectContextInPage,
    });
    return (results && results[0] && results[0].result) || null;
  } catch (_) { return null; }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
}

function makeRow({ label, zone, abbrOverride, color, instant, sourceZone, hour12, showAmPm, settings }) {
  const colorKey = TZB.colorKeyFor({ color }, zone);
  const abbr = TZB.abbrFor(instant, zone, settings);
  const srcAbbr = TZB.abbrFor(instant, sourceZone, settings);
  const srcTime = TZB.compactTime(instant, sourceZone, hour12, showAmPm);
  const rowTime = TZB.compactTime(instant, zone, hour12, showAmPm);
  const sameZone = zone === sourceZone;

  const li = document.createElement('li');
  li.className = `row color-${colorKey}`;

  const pill = document.createElement('span');
  pill.className = `pill color-${colorKey}`;
  pill.innerHTML = `${escapeHtml(label)}<span class="pill-abbr">${escapeHtml(abbr)}</span>`;

  const pair = document.createElement('span');
  pair.className = 'pair';
  let copyText;
  if (sameZone) {
    pair.innerHTML = `<span class="same">${rowTime} ${abbr}</span>`;
    copyText = `${rowTime} ${abbr}`;
  } else {
    pair.innerHTML = `${srcTime} ${srcAbbr}<span class="sep">/</span>${rowTime} ${abbr}`;
    copyText = `${srcTime} ${srcAbbr} / ${rowTime} ${abbr}`;
  }

  li.appendChild(pill);
  li.appendChild(pair);
  li.title = `Click to copy: ${copyText}`;
  li.addEventListener('click', () => copyRow(li, pair, copyText));
  return li;
}

async function copyRow(li, pair, text) {
  try {
    await navigator.clipboard.writeText(text);
    const original = pair.innerHTML;
    pair.innerHTML = `<span class="copied-label">Copied!</span>`;
    li.classList.add('copied');
    setTimeout(() => { pair.innerHTML = original; li.classList.remove('copied'); }, 900);
  } catch (e) {
    pair.textContent = 'Copy failed';
  }
}

function render(settings, parsed) {
  const sourceLine = document.getElementById('sourceLine');
  const results = document.getElementById('results');
  results.innerHTML = '';

  const now = new Date();
  let instant, sourceZone;

  if (!parsed) {
    instant = now;
    sourceZone = settings.defaultSourceZone;
    sourceLine.classList.remove('error');
    const abbr = TZB.abbrFor(instant, sourceZone, settings);
    sourceLine.textContent = `Current time in ${sourceZone} (${abbr}). Type a time to convert.`;
  } else {
    sourceZone = parsed.zoneIANA || settings.defaultSourceZone;
    if (parsed.zoneToken && !parsed.zoneIANA) {
      sourceLine.classList.add('error');
      sourceLine.textContent = `Unknown zone "${parsed.zoneToken}" — using ${sourceZone}.`;
    } else {
      sourceLine.classList.remove('error');
      const tokenDisp = parsed.zoneToken ? parsed.zoneToken.toUpperCase() : sourceZone;
      const hh = parsed.hour.toString().padStart(2, '0');
      const mm = parsed.minute.toString().padStart(2, '0');
      sourceLine.textContent = `Source: ${hh}:${mm} ${tokenDisp}`;
    }
    instant = TZB.wallClockToInstant(
      now.getFullYear(), now.getMonth() + 1, now.getDate(),
      parsed.hour, parsed.minute, sourceZone
    );
  }

  const showAmPm = parsed ? parsed.ampmExplicit : true;

  for (const t of settings.targets) {
    results.appendChild(makeRow({
      label: t.label, zone: t.zone, color: t.color,
      instant, sourceZone,
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
  if (!raw || !raw.trim()) { render(settings, null); return; }
  const parsed = TZB.parseInput(raw, settings.ambiguous);
  if (!parsed) {
    const sourceLine = document.getElementById('sourceLine');
    sourceLine.classList.add('error');
    sourceLine.textContent = `Couldn't parse "${raw}".`;
    document.getElementById('results').innerHTML = '';
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
  if (ctx && ctx.text) {
    input.value = ctx.text;
    input.select();
    renderFromInput(settings, ctx.text);
  }
}

document.addEventListener('DOMContentLoaded', main);
