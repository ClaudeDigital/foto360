export function photoDate(p) {
  return new Date(p.captured_at || p.created_at);
}

// SQLite `datetime('now')` returns "YYYY-MM-DD HH:MM:SS" in UTC without a zone marker.
export function parseDbDate(s) {
  if (!s) return null;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z');
}

// Albanian names are spelled out here: many phones ship without the `sq` locale, and
// toLocaleDateString('sq-AL') then silently falls back to English.
export const MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
export const MONTHS_SHORT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gus', 'sht', 'tet', 'nën', 'dhj'];
export const WEEKDAYS = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];

const z = (n) => String(n).padStart(2, '0');
export const fmtDay = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtShort = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
export const fmtWeekday = (d) => `${WEEKDAYS[d.getDay()]}, ${fmtDay(d)}`;
export const fmtTime = (d) => `${z(d.getHours())}:${z(d.getMinutes())}`;
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function isToday(d) {
  if (!d) return false;
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function daysAgo(d) {
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(new Date()) - start(d)) / 86400000);
}

export function relativeDay(d) {
  if (!d) return '';
  const days = daysAgo(d);
  if (days <= 0) return 'Sot';
  if (days === 1) return 'Dje';
  if (days < 7) return `${days} ditë më parë`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function toInputDate(d) {
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function formatRange(from, to) {
  const f = (s) => fmtShort(new Date(s + 'T00:00:00'));
  return `${f(from)} – ${f(to)}`;
}
