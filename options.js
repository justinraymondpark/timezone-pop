const DEFAULT_SETTINGS = {
  targets: [
    { label: 'New York',    zone: 'America/New_York' },
    { label: 'Chicago',     zone: 'America/Chicago' },
    { label: 'Denver',      zone: 'America/Denver' },
    { label: 'Los Angeles', zone: 'America/Los_Angeles' },
    { label: 'Anchorage',   zone: 'America/Anchorage' },
    { label: 'Honolulu',    zone: 'Pacific/Honolulu' },
    { label: 'London',      zone: 'Europe/London' },
    { label: 'Dublin',      zone: 'Europe/Dublin' },
    { label: 'Tokyo',       zone: 'Asia/Tokyo' },
  ],
  hour12: true,
  defaultSourceZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  ambiguous: { CST: 'US', IST: 'IN' },
};

// Get the full IANA zone list if the browser supplies it; otherwise fall back.
function supportedZones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try { return Intl.supportedValuesOf('timeZone'); } catch (_) {}
  }
  return [
    'UTC',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
    'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
    'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
    'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Helsinki',
    'Europe/Moscow', 'Europe/Athens',
    'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Lagos',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Hong_Kong',
    'Asia/Singapore', 'Asia/Seoul', 'Asia/Tokyo', 'Asia/Jerusalem',
    'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland', 'Pacific/Fiji',
  ];
}

let current;

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (res) => {
      const s = res && res.settings ? { ...DEFAULT_SETTINGS, ...res.settings } : DEFAULT_SETTINGS;
      resolve(JSON.parse(JSON.stringify(s)));
    });
  });
}

const COLOR_OPTIONS = [
  { key: '',       name: 'Auto' },
  { key: 'blue',   name: 'Blue' },
  { key: 'purple', name: 'Purple' },
  { key: 'red',    name: 'Red' },
  { key: 'orange', name: 'Orange' },
  { key: 'green',  name: 'Green' },
  { key: 'teal',   name: 'Teal' },
  { key: 'pink',   name: 'Pink' },
  { key: 'gray',   name: 'Gray' },
  { key: 'slate',  name: 'Slate' },
];

function effectiveColor(t) {
  return TZB.colorKeyFor({ color: t.color }, t.zone);
}

function effectiveAbbr(t) {
  return (t.abbr && t.abbr.trim()) || TZB.DEFAULT_ABBRS[t.zone] || TZB.zoneAbbrForInstant(new Date(), t.zone);
}

function updatePillPreview(pill, t) {
  const colorKey = effectiveColor(t);
  pill.className = `pill color-${colorKey}`;
  pill.innerHTML = `${escapeHtml(t.label || t.zone)}<span class="pill-abbr">${escapeHtml(effectiveAbbr(t))}</span>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
}

function renderTargets() {
  const ul = document.getElementById('targets');
  ul.innerHTML = '';
  current.targets.forEach((t, i) => {
    const li = document.createElement('li');

    // Row 1: pill preview + label input + actions
    const main = document.createElement('div');
    main.className = 'target-main';

    const pill = document.createElement('span');
    updatePillPreview(pill, t);

    const label = document.createElement('input');
    label.type = 'text';
    label.className = 'label-input';
    label.value = t.label;
    label.addEventListener('input', () => {
      current.targets[i].label = label.value;
      updatePillPreview(pill, current.targets[i]);
    });

    const actions = document.createElement('div');
    actions.className = 'actions';
    const home = document.createElement('button');
    home.className = t.isHome ? 'home active' : 'home';
    home.textContent = t.isHome ? '★' : '☆';
    home.title = t.isHome ? 'Home zone (source for unqualified times)' : 'Set as home zone';
    home.onclick = () => {
      const wasHome = !!current.targets[i].isHome;
      current.targets.forEach((x) => { x.isHome = false; });
      current.targets[i].isHome = !wasHome;
      renderTargets();
    };
    const up = document.createElement('button'); up.textContent = '↑'; up.title = 'Move up';
    up.onclick = () => { if (i > 0) { [current.targets[i-1], current.targets[i]] = [current.targets[i], current.targets[i-1]]; renderTargets(); } };
    const down = document.createElement('button'); down.textContent = '↓'; down.title = 'Move down';
    down.onclick = () => { if (i < current.targets.length - 1) { [current.targets[i+1], current.targets[i]] = [current.targets[i], current.targets[i+1]]; renderTargets(); } };
    const rm = document.createElement('button'); rm.textContent = '×'; rm.title = 'Remove'; rm.className = 'rm';
    rm.onclick = () => { current.targets.splice(i, 1); renderTargets(); };
    actions.append(home, up, down, rm);

    main.append(pill, label, actions);

    // Row 2: code input, color select, zone readout
    const meta = document.createElement('div');
    meta.className = 'target-meta';

    const codeLbl = document.createElement('label');
    codeLbl.className = 'mini';
    codeLbl.textContent = 'Code';
    const code = document.createElement('input');
    code.type = 'text';
    code.className = 'code-input';
    code.value = t.abbr || '';
    code.placeholder = TZB.DEFAULT_ABBRS[t.zone] || 'auto';
    code.title = 'Override abbreviation (e.g. ET, CT, PST). Leave blank for default.';
    code.addEventListener('input', () => {
      current.targets[i].abbr = code.value;
      updatePillPreview(pill, current.targets[i]);
    });
    codeLbl.appendChild(code);

    const colorLbl = document.createElement('label');
    colorLbl.className = 'mini';
    colorLbl.textContent = 'Color';
    const colorSel = document.createElement('select');
    colorSel.className = 'color-select';
    for (const opt of COLOR_OPTIONS) {
      const o = document.createElement('option');
      o.value = opt.key;
      o.textContent = opt.name;
      colorSel.appendChild(o);
    }
    colorSel.value = t.color || '';
    colorSel.addEventListener('change', () => {
      current.targets[i].color = colorSel.value || undefined;
      updatePillPreview(pill, current.targets[i]);
    });
    colorLbl.appendChild(colorSel);

    const zone = document.createElement('span');
    zone.className = 'zone';
    zone.textContent = t.zone;

    meta.append(codeLbl, colorLbl, zone);

    li.append(main, meta);
    ul.appendChild(li);
  });
}

function populateZoneSelects() {
  const zones = supportedZones();
  const sel = document.getElementById('newZone');
  sel.innerHTML = '';
  for (const z of zones) {
    const opt = document.createElement('option');
    opt.value = z; opt.textContent = z;
    sel.appendChild(opt);
  }
}

function bind() {
  document.getElementById('addBtn').addEventListener('click', () => {
    const label = document.getElementById('newLabel').value.trim();
    const zone = document.getElementById('newZone').value;
    if (!label || !zone) return;
    current.targets.push({ label, zone });
    document.getElementById('newLabel').value = '';
    renderTargets();
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    current.hour12 = document.getElementById('hour12').checked;
    current.ambiguous = {
      CST: document.getElementById('amb-CST').value,
      IST: document.getElementById('amb-IST').value,
    };
    chrome.storage.sync.set({ settings: current }, () => {
      const s = document.getElementById('status');
      s.textContent = 'Saved.';
      setTimeout(() => { s.textContent = ''; }, 1500);
    });
  });
}

async function main() {
  current = await loadSettings();
  populateZoneSelects();
  renderTargets();
  document.getElementById('hour12').checked = !!current.hour12;
  document.getElementById('amb-CST').value = current.ambiguous.CST || 'US';
  document.getElementById('amb-IST').value = current.ambiguous.IST || 'IN';
  bind();
}

document.addEventListener('DOMContentLoaded', main);
