// Timezone abbreviation / city / region name → IANA zone.
// Keys are matched after uppercasing and stripping spaces/periods,
// so "p.s.t.", "new york", and "Hong Kong" all resolve.
// Ambiguous ones (CST, IST) resolve via user's `ambiguous` setting.
const ZONE_MAP = {
  UTC: 'UTC', GMT: 'UTC', Z: 'UTC', ZULU: 'UTC',
  // North America
  ET: 'America/New_York', EST: 'America/New_York', EDT: 'America/New_York', EASTERN: 'America/New_York',
  NYC: 'America/New_York', NY: 'America/New_York', NEWYORK: 'America/New_York',
  BOSTON: 'America/New_York', MIAMI: 'America/New_York', ATLANTA: 'America/New_York',
  DC: 'America/New_York', WASHINGTON: 'America/New_York',
  TORONTO: 'America/Toronto', MONTREAL: 'America/Toronto',
  CT: 'America/Chicago', CDT: 'America/Chicago', CENTRAL: 'America/Chicago',
  CHICAGO: 'America/Chicago', DALLAS: 'America/Chicago', AUSTIN: 'America/Chicago',
  HOUSTON: 'America/Chicago', MINNEAPOLIS: 'America/Chicago', NASHVILLE: 'America/Chicago',
  MT: 'America/Denver', MST: 'America/Denver', MDT: 'America/Denver', MOUNTAIN: 'America/Denver',
  DENVER: 'America/Denver', SALTLAKE: 'America/Denver', SALTLAKECITY: 'America/Denver',
  PHOENIX: 'America/Phoenix', ARIZONA: 'America/Phoenix',
  PT: 'America/Los_Angeles', PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles', PACIFIC: 'America/Los_Angeles',
  LA: 'America/Los_Angeles', LOSANGELES: 'America/Los_Angeles',
  SF: 'America/Los_Angeles', SANFRANCISCO: 'America/Los_Angeles',
  SEATTLE: 'America/Los_Angeles', PORTLAND: 'America/Los_Angeles', SANDIEGO: 'America/Los_Angeles',
  VANCOUVER: 'America/Vancouver',
  AKT: 'America/Anchorage', AKST: 'America/Anchorage', AKDT: 'America/Anchorage',
  ALASKA: 'America/Anchorage', ANCHORAGE: 'America/Anchorage',
  HT: 'Pacific/Honolulu', HST: 'Pacific/Honolulu', HAWAII: 'Pacific/Honolulu', HONOLULU: 'Pacific/Honolulu',
  AST: 'America/Halifax', ADT: 'America/Halifax', ATLANTIC: 'America/Halifax', HALIFAX: 'America/Halifax',
  NST: 'America/St_Johns', NDT: 'America/St_Johns',
  // Latin America
  MEXICO: 'America/Mexico_City', MEXICOCITY: 'America/Mexico_City', CDMX: 'America/Mexico_City',
  BOGOTA: 'America/Bogota', COT: 'America/Bogota',
  LIMA: 'America/Lima', PET: 'America/Lima',
  SANTIAGO: 'America/Santiago', CLT: 'America/Santiago',
  BRT: 'America/Sao_Paulo', SAOPAULO: 'America/Sao_Paulo', BRAZIL: 'America/Sao_Paulo',
  ART: 'America/Argentina/Buenos_Aires', BUENOSAIRES: 'America/Argentina/Buenos_Aires', ARGENTINA: 'America/Argentina/Buenos_Aires',
  // Europe
  BST: 'Europe/London', WET: 'Europe/London', LONDON: 'Europe/London', UK: 'Europe/London',
  IRISH: 'Europe/Dublin', IRELAND: 'Europe/Dublin', DUBLIN: 'Europe/Dublin',
  LISBON: 'Europe/Lisbon', PORTUGAL: 'Europe/Lisbon',
  CET: 'Europe/Paris', CEST: 'Europe/Paris', PARIS: 'Europe/Paris', FRANCE: 'Europe/Paris',
  BERLIN: 'Europe/Berlin', MUNICH: 'Europe/Berlin', FRANKFURT: 'Europe/Berlin', GERMANY: 'Europe/Berlin',
  MADRID: 'Europe/Madrid', BARCELONA: 'Europe/Madrid', SPAIN: 'Europe/Madrid',
  ROME: 'Europe/Rome', MILAN: 'Europe/Rome', ITALY: 'Europe/Rome',
  AMSTERDAM: 'Europe/Amsterdam', BRUSSELS: 'Europe/Brussels',
  ZURICH: 'Europe/Zurich', GENEVA: 'Europe/Zurich',
  VIENNA: 'Europe/Vienna', PRAGUE: 'Europe/Prague', WARSAW: 'Europe/Warsaw',
  STOCKHOLM: 'Europe/Stockholm', OSLO: 'Europe/Oslo', COPENHAGEN: 'Europe/Copenhagen',
  EET: 'Europe/Helsinki', EEST: 'Europe/Helsinki', HELSINKI: 'Europe/Helsinki',
  ATHENS: 'Europe/Athens', BUCHAREST: 'Europe/Bucharest',
  KYIV: 'Europe/Kyiv', KIEV: 'Europe/Kyiv',
  ISTANBUL: 'Europe/Istanbul', TRT: 'Europe/Istanbul',
  MSK: 'Europe/Moscow', MOSCOW: 'Europe/Moscow',
  // Africa
  LAGOS: 'Africa/Lagos', WAT: 'Africa/Lagos',
  CAIRO: 'Africa/Cairo',
  JOHANNESBURG: 'Africa/Johannesburg', JOBURG: 'Africa/Johannesburg', CAPETOWN: 'Africa/Johannesburg', SAST: 'Africa/Johannesburg',
  NAIROBI: 'Africa/Nairobi', EAT: 'Africa/Nairobi',
  // Middle East / Asia
  ISRAEL: 'Asia/Jerusalem', TELAVIV: 'Asia/Jerusalem', JERUSALEM: 'Asia/Jerusalem',
  GST: 'Asia/Dubai', DUBAI: 'Asia/Dubai', UAE: 'Asia/Dubai', ABUDHABI: 'Asia/Dubai',
  PKT: 'Asia/Karachi', KARACHI: 'Asia/Karachi', PAKISTAN: 'Asia/Karachi',
  INDIA: 'Asia/Kolkata', DELHI: 'Asia/Kolkata', NEWDELHI: 'Asia/Kolkata',
  MUMBAI: 'Asia/Kolkata', BANGALORE: 'Asia/Kolkata', BENGALURU: 'Asia/Kolkata',
  HYDERABAD: 'Asia/Kolkata', CHENNAI: 'Asia/Kolkata', PUNE: 'Asia/Kolkata', KOLKATA: 'Asia/Kolkata',
  DHAKA: 'Asia/Dhaka', BANGLADESH: 'Asia/Dhaka',
  ICT: 'Asia/Bangkok', BANGKOK: 'Asia/Bangkok', THAILAND: 'Asia/Bangkok',
  WIB: 'Asia/Jakarta', JAKARTA: 'Asia/Jakarta',
  VIETNAM: 'Asia/Ho_Chi_Minh', HANOI: 'Asia/Ho_Chi_Minh', SAIGON: 'Asia/Ho_Chi_Minh', HOCHIMINH: 'Asia/Ho_Chi_Minh',
  MYT: 'Asia/Kuala_Lumpur', KUALALUMPUR: 'Asia/Kuala_Lumpur', KL: 'Asia/Kuala_Lumpur', MALAYSIA: 'Asia/Kuala_Lumpur',
  SGT: 'Asia/Singapore', SINGAPORE: 'Asia/Singapore', SG: 'Asia/Singapore',
  HKT: 'Asia/Hong_Kong', HONGKONG: 'Asia/Hong_Kong', HK: 'Asia/Hong_Kong',
  CHINA: 'Asia/Shanghai', BEIJING: 'Asia/Shanghai', SHANGHAI: 'Asia/Shanghai', SHENZHEN: 'Asia/Shanghai',
  TAIPEI: 'Asia/Taipei', TAIWAN: 'Asia/Taipei',
  PHT: 'Asia/Manila', MANILA: 'Asia/Manila', PHILIPPINES: 'Asia/Manila',
  JST: 'Asia/Tokyo', TOKYO: 'Asia/Tokyo', OSAKA: 'Asia/Tokyo', JAPAN: 'Asia/Tokyo',
  KST: 'Asia/Seoul', SEOUL: 'Asia/Seoul', KOREA: 'Asia/Seoul',
  // Oceania
  AEST: 'Australia/Sydney', AEDT: 'Australia/Sydney', SYDNEY: 'Australia/Sydney', CANBERRA: 'Australia/Sydney',
  MELBOURNE: 'Australia/Melbourne', BRISBANE: 'Australia/Brisbane',
  AWST: 'Australia/Perth', PERTH: 'Australia/Perth',
  ACST: 'Australia/Adelaide', ACDT: 'Australia/Adelaide', ADELAIDE: 'Australia/Adelaide', DARWIN: 'Australia/Darwin',
  NZST: 'Pacific/Auckland', NZDT: 'Pacific/Auckland', AUCKLAND: 'Pacific/Auckland',
  NZ: 'Pacific/Auckland', WELLINGTON: 'Pacific/Auckland', NEWZEALAND: 'Pacific/Auckland',
};

const AMBIGUOUS = {
  CST: { US: 'America/Chicago', CN: 'Asia/Shanghai' },
  IST: { IN: 'Asia/Kolkata', IE: 'Europe/Dublin', IL: 'Asia/Jerusalem' },
};

function resolveZone(token, ambiguousPrefs) {
  if (!token) return null;
  let key = token.trim().toUpperCase().replace(/\./g, '');
  key = key.replace(/^IN\s+/, '');
  // UTC offsets: "utc+2", "GMT-5:30", "+0530", "utc +7"
  const om = key.match(/^(?:UTC|GMT)?\s*([+-])\s*(\d{1,2})(?::?([0-5]\d))?$/);
  if (om) {
    const hh = parseInt(om[2], 10);
    if (hh <= 14) return `${om[1]}${String(hh).padStart(2, '0')}:${om[3] || '00'}`;
  }
  key = key.replace(/\s+/g, '').replace(/(?:STANDARD|DAYLIGHT|SUMMER)?TIME$/, '');
  if (AMBIGUOUS[key]) {
    const pref = (ambiguousPrefs && ambiguousPrefs[key]) || Object.keys(AMBIGUOUS[key])[0];
    return AMBIGUOUS[key][pref] || Object.values(AMBIGUOUS[key])[0];
  }
  if (ZONE_MAP[key]) return ZONE_MAP[key];
  // Raw IANA names typed directly, e.g. "America/New_York"
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: token.trim() });
    return token.trim();
  } catch (_) {}
  return null;
}

// One time atom: "5", "5:30", "5.30", "530", "1730", with optional am/pm/a/p.
// The lookahead keeps a bare "a"/"p" from eating the first letter of a zone.
const TIME_ATOM = String.raw`(\d{1,4})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|[ap])?(?![A-Za-z])`;
const RANGE_SEP = String.raw`(?:\s*[-–—~]\s*|\s+(?:to|until|till|thru|through)\s+)`;
const TIME_FIRST_RE = new RegExp(`^(?:at\\s+)?${TIME_ATOM}(?:${RANGE_SEP}\\s*${TIME_ATOM})?\\s*(.*?)$`, 'i');
const ZONE_FIRST_RE = new RegExp(`^(.*?)[\\s,]+(?:at\\s+)?${TIME_ATOM}(?:${RANGE_SEP}\\s*${TIME_ATOM})?$`, 'i');

function timeAtom(digits, minutes, meridiem) {
  let h, m;
  if (digits.length >= 3) {
    if (minutes != null) return null;     // "173:30" — nonsense
    h = parseInt(digits.slice(0, -2), 10); // military / compact: "1730", "530"
    m = parseInt(digits.slice(-2), 10);
  } else {
    h = parseInt(digits, 10);
    m = minutes != null ? parseInt(minutes, 10) : 0;
  }
  if (h > 23 || m > 59) return null;
  const mer = meridiem ? (meridiem[0].toLowerCase() === 'p' ? 'pm' : 'am') : null;
  return { h, m, mer };
}

function applyMeridiem(h, mer) {
  if (mer === 'pm' && h < 12) return h + 12;
  if (mer === 'am' && h === 12) return 0;
  return h;
}

// Resolve a range's hours when only one side (or neither) has am/pm.
// "3-5pm" → 3pm-5pm; "11-1pm" → 11am-1pm; "9am-5" → 9am-5pm; "9-5" → 9:00-17:00.
function resolveRangeHours(start, end) {
  const mins = (h, m) => h * 60 + m;
  let sh, eh;
  if (start.mer && end.mer) {
    sh = applyMeridiem(start.h, start.mer);
    eh = applyMeridiem(end.h, end.mer);
  } else if (!start.mer && end.mer) {
    eh = applyMeridiem(end.h, end.mer);
    if (start.h <= 12) {
      sh = applyMeridiem(start.h, end.mer);
      if (mins(sh, start.m) >= mins(eh, end.m)) {
        sh = applyMeridiem(start.h, end.mer === 'pm' ? 'am' : 'pm');
      }
    } else sh = start.h;
  } else if (start.mer && !end.mer) {
    sh = applyMeridiem(start.h, start.mer);
    if (end.h <= 12) {
      eh = applyMeridiem(end.h, start.mer);
      if (mins(eh, end.m) <= mins(sh, start.m)) {
        eh = applyMeridiem(end.h, start.mer === 'pm' ? 'am' : 'pm');
      }
    } else eh = end.h;
  } else {
    sh = start.h;
    eh = end.h;
    // "9-5" reads as 9:00-17:00, but "23-1" stays as a cross-midnight range.
    if (mins(eh, end.m) <= mins(sh, start.m) && eh < 12 && eh + 12 > sh) eh += 12;
  }
  return { sh, eh };
}

// Returns {hour, minute, endHour, endMinute, zoneToken, zoneIANA, ampmExplicit}
// or null if nothing recognized. endHour/endMinute are null unless a range was given.
function parseInput(text, ambiguousPrefs) {
  if (!text || !text.trim()) return null;
  let s = text.trim().replace(/[?!,;]+$/, '').trim();
  s = s.replace(/\b(?:12\s*)?noon\b/gi, '12:00pm').replace(/\b(?:12\s*)?midnight\b/gi, '12:00am');

  let zoneRaw = '';
  let m = s.match(TIME_FIRST_RE);
  let g; // [digits, minutes, meridiem] x2
  if (m) {
    g = m.slice(1, 7);
    zoneRaw = (m[7] || '').trim();
  } else {
    // Zone-first: "tokyo 5pm", "ET 9-11am"
    m = s.match(ZONE_FIRST_RE);
    if (!m) return null;
    zoneRaw = (m[1] || '').trim();
    g = m.slice(2, 8);
    if (!resolveZone(zoneRaw, ambiguousPrefs)) return null;
  }
  zoneRaw = zoneRaw.replace(/^in\s+/i, '').trim();

  const start = timeAtom(g[0], g[1], g[2]);
  if (!start) return null;
  const end = g[3] != null ? timeAtom(g[3], g[4], g[5]) : null;
  if (g[3] != null && !end) return null;

  let hour, endHour = null, endMinute = null;
  if (end) {
    const r = resolveRangeHours(start, end);
    hour = r.sh;
    endHour = r.eh;
    endMinute = end.m;
  } else {
    hour = applyMeridiem(start.h, start.mer);
  }

  const zoneIANA = zoneRaw ? resolveZone(zoneRaw, ambiguousPrefs) : null;
  return {
    hour, minute: start.m,
    endHour, endMinute,
    zoneToken: zoneRaw || null,
    zoneIANA,
    ampmExplicit: !!(start.mer || (end && end.mer)),
  };
}

// Compute the UTC instant for a wall-clock time in a given IANA zone.
function wallClockToInstant(year, month, day, hour, minute, tz) {
  const guessMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const guess = new Date(guessMs);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = {};
  for (const p of dtf.formatToParts(guess)) parts[p.type] = p.value;
  // Intl may format midnight as "24" in hour; normalize.
  let h = parseInt(parts.hour, 10); if (h === 24) h = 0;
  const asTZms = Date.UTC(+parts.year, +parts.month - 1, +parts.day, h, +parts.minute, +parts.second);
  const offset = asTZms - guessMs; // zone's offset from UTC in ms
  return new Date(guessMs - offset);
}

function formatInZone(instant, tz, { hour12 = true } = {}) {
  return instant.toLocaleString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12,
  });
}

// Compact form: drops ":00" when minutes are zero, lowercase am/pm.
// e.g. "3pm", "3:30pm", "15:00", "15:30".
// When showAmPm is false (input didn't specify am/pm), the suffix is omitted
// so "1 PST / 4 ET" stays neutral — the offset is the same either way.
function compactTime(instant, tz, hour12 = true, showAmPm = true) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12,
  }).formatToParts(instant);
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  const h = o.hour;
  const m = o.minute;
  const dp = (hour12 && showAmPm) ? (o.dayPeriod || '').toLowerCase() : '';
  if (hour12) return m === '00' ? `${h}${dp}` : `${h}:${m}${dp}`;
  return `${h}:${m}`;
}

// Range form: "3–5pm", "11:30am–1pm", "15:00–17:00".
// The start's am/pm is dropped when both ends share a day period.
function compactRange(startInstant, endInstant, tz, hour12 = true, showAmPm = true) {
  if (!endInstant) return compactTime(startInstant, tz, hour12, showAmPm);
  let startShow = showAmPm;
  if (hour12 && showAmPm) {
    const dp = (instant) => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: true }).formatToParts(instant);
      const p = parts.find(x => x.type === 'dayPeriod');
      return p ? p.value : '';
    };
    if (dp(startInstant) === dp(endInstant)) startShow = false;
  }
  return `${compactTime(startInstant, tz, hour12, startShow)}–${compactTime(endInstant, tz, hour12, showAmPm)}`;
}

// -1, 0, or +1: which calendar day the instant falls on in `zone`
// relative to the day it falls on in `baseZone`.
function dayDiff(instant, zone, baseZone) {
  const fmt = (tz) => new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(instant);
  const a = fmt(zone), b = fmt(baseZone);
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

function regionOfZone(tz) {
  if (!tz) return 'other';
  const prefix = tz.split('/')[0];
  switch (prefix) {
    case 'America': return 'america';
    case 'Europe':  return 'europe';
    case 'Africa':  return 'africa';
    case 'Asia':    return 'asia';
    case 'Australia': return 'australia';
    case 'Pacific': return 'pacific';
    case 'UTC':
    case 'Etc':     return 'utc';
    default:        return 'other';
  }
}

const REGION_COLOR = {
  america: 'blue', europe: 'purple', africa: 'orange',
  asia: 'red', australia: 'green', pacific: 'teal',
  utc: 'gray', other: 'slate',
};

const COLOR_KEYS = ['blue', 'purple', 'red', 'orange', 'green', 'teal', 'pink', 'gray', 'slate'];

function colorKeyFor(target, zone) {
  if (target && target.color && COLOR_KEYS.includes(target.color)) return target.color;
  return REGION_COLOR[regionOfZone(zone)] || 'slate';
}

function zoneAbbrForInstant(instant, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short', hour: 'numeric' });
  const parts = dtf.formatToParts(instant);
  const t = parts.find(p => p.type === 'timeZoneName');
  return t ? t.value : tz;
}

// Conversational abbreviations preferred in casual email.
// Used when a target has no explicit override.
const DEFAULT_ABBRS = {
  'America/New_York':    'ET',
  'America/Chicago':     'CT',
  'America/Denver':      'MT',
  'America/Los_Angeles': 'PST',
  'America/Anchorage':   'AKT',
  'Pacific/Honolulu':    'HST',
};

// Resolve the abbr to show for a given zone. Priority:
//   1. Matching target's `abbr` field (if non-empty)
//   2. DEFAULT_ABBRS lookup
//   3. Intl-computed live abbr (DST-aware)
function abbrFor(instant, zone, settings) {
  if (settings && settings.targets) {
    const t = settings.targets.find(x => x.zone === zone);
    if (t && t.abbr && t.abbr.trim()) return t.abbr.trim();
  }
  if (DEFAULT_ABBRS[zone]) return DEFAULT_ABBRS[zone];
  return zoneAbbrForInstant(instant, zone);
}

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
  ambiguous: { CST: 'US', IST: 'IN' },
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (res) => {
      const saved = (res && res.settings) || {};
      const targets = Array.isArray(saved.targets) ? saved.targets : DEFAULT_SETTINGS.targets;
      const s = {
        ...DEFAULT_SETTINGS,
        ...saved,
        targets: JSON.parse(JSON.stringify(targets)),
        ambiguous: { ...DEFAULT_SETTINGS.ambiguous, ...(saved.ambiguous || {}) },
      };
      const home = s.targets.find(t => t.isHome);
      s.defaultSourceZone = home ? home.zone : Intl.DateTimeFormat().resolvedOptions().timeZone;
      resolve(s);
    });
  });
}

// Exported via global for popup.js / options.js (globalThis also works under Node for tests)
globalThis.TZB = {
  ZONE_MAP, AMBIGUOUS,
  resolveZone, parseInput,
  wallClockToInstant, formatInZone, compactTime, compactRange, dayDiff, zoneAbbrForInstant,
  regionOfZone, DEFAULT_ABBRS, abbrFor,
  REGION_COLOR, COLOR_KEYS, colorKeyFor,
  DEFAULT_SETTINGS, loadSettings,
};
