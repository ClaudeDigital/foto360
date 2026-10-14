export function photoDate(p) {
  return new Date(p.captured_at || p.created_at);
}

// SQLite `datetime('now')` returns "YYYY-MM-DD HH:MM:SS" in UTC without a zone marker.
export function parseDbDate(s) {
  if (!s) return null;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z');
}

export function isToday(d) {
  if (!d) return false;
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function relativeDay(d) {
  if (!d) return '';
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86400000);
  if (days <= 0) return 'Sot';
  if (days === 1) return 'Dje';
  if (days < 7) return `${days} ditë më parë`;
  return d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' });
}

export function toInputDate(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function formatRange(from, to) {
  const f = (s) => new Date(s + 'T00:00:00').toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${f(from)} – ${f(to)}`;
}
