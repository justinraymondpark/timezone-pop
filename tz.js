// Timezone abbreviation → IANA zone.
// Ambiguous ones (CST, IST) resolve via user's `ambiguous` setting.
const ZONE_MAP = {
  UTC: 'UTC', GMT: 'UTC', Z: 'UTC',
  ET: 'America/New_York', EST: 'America/New_York', EDT: 'America/New_York', EASTERN: 'America/New_York',
  CT: 'America/Chicago', CDT: 'America/Chicago', CENTRAL: 'America/Chicago',
  MT: 'America/Denver', MST: 'America/Denver', MDT: 'America/Denver', MOUNTAIN: 'America/Denver',
  PT: 'America/Los_Angeles', PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles', PACIFIC: 'America/Los_Angeles',
  AKT: 'America/Anchorage', AKST: 'America/Anchorage', AKDT: 'America/Anchorage',
  HT: 'Pacific/Honolulu', HST: 'Pacific/Honolulu',
  BST: 'Europe/London', WET: 'Europe/London', LONDON: 'Europe/London', UK: 'Europe/London',
  IRISH: 'Europe/Dublin', IRELAND: 'Europe/Dublin', DUBLIN: 'Europe/Dublin',
  CET: 'Europe/Paris', CEST: 'Europe/Paris', PARIS: 'Europe/Paris', BERLIN: 'Europe/Berlin',
  EET: 'Europe/Helsinki', EEST: 'Europe/Helsinki',
  MSK: 'Europe/Moscow', MOSCOW: 'Europe/Moscow',
  JST: 'Asia/Tokyo', TOKYO: 'Asia/Tokyo', KST: 'Asia/Seoul', SEOUL: 'Asia/Seoul',
  SGT: 'Asia/Singapore', SINGAPORE: 'Asia/Singapore', HKT: 'Asia/Hong_Kong', HONGKONG: 'Asia/Hong_Kong',
  AEST: 'Australia/Sydney', AEDT: 'Australia/Sydney', SYDNEY: 'Australia/Sydney',
  AWST: 'Australia/Perth', ACST: 'Australia/Adelaide', ACDT: 'Australia/Adelaide',
  NZST: 'Pacific/Auckland', NZDT: 'Pacific/Auckland', AUCKLAND: 'Pacific/Auckland',
};

const AMBIGUOUS = {
  CST: { US: 'America/Chicago', CN: 'Asia/Shanghai' },
  IST: { IN: 'Asia/Kolkata', IE: 'Europe/Dublin', IL: 'Asia/Jerusalem' },
};

function resolveZone(token, ambiguousPrefs) {
  if (!token) return null;
  const key = token.toUpperCase().replace(/\s+/g, '');
  if (AMBIGUOUS[key]) {
    const pref = (ambiguousPrefs && ambiguousPrefs[key]) || Object.keys(AMBIGUOUS[key])[0];
    return AMBIGUOUS[key][pref] || Object.values(AMBIGUOUS[key])[0];
  }
  return ZONE_MAP[key] || null;
}

// Returns {hour, minute, zoneToken, zoneIANA, raw} or null if nothing recognized.
function parseInput(text, ambiguousPrefs) {
  if (!text || !text.trim()) return null;
  const s = text.trim();
  // Pattern: optional "at", digits, optional :MM, optional am/pm, optional zone remainder
  const re = /^\s*(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(.*?)\s*$/i;
  const m = s.match(re);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3] ? m[3].toLowerCase().replace(/\./g, '') : null;
  const zoneRaw = m[4] || '';

  if (isNaN(hour) || hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  if (!ampm && hour > 23) return null;

  const zoneIANA = zoneRaw ? resolveZone(zoneRaw, ambiguousPrefs) : null;
  return {
    hour, minute,
    zoneToken: zoneRaw || null,
    zoneIANA,
    ampmExplicit: !!ampm,
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
function compactTime(instant, tz, hour12 = true) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12,
  }).formatToParts(instant);
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  const h = o.hour;
  const m = o.minute;
  const dp = (o.dayPeriod || '').toLowerCase();
  if (hour12) return m === '00' ? `${h}${dp}` : `${h}:${m}${dp}`;
  return `${h}:${m}`;
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

// Exported via global for popup.js / options.js
window.TZB = {
  ZONE_MAP, AMBIGUOUS,
  resolveZone, parseInput,
  wallClockToInstant, formatInZone, compactTime, zoneAbbrForInstant,
  regionOfZone, DEFAULT_ABBRS, abbrFor,
  REGION_COLOR, COLOR_KEYS, colorKeyFor,
};
