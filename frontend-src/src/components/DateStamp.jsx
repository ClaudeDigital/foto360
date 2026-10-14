import React from 'react';

// Seven-segment "date imprint", like the orange LED date old film cameras burned into
// the corner of every photo. Unlit segments stay faintly visible, as on the real thing.
const W = 12, H = 22, T = 2.6;
const hx0 = 1.6, hx1 = W - 1.6;
const hSeg = (yc) => [[hx0 + T / 2, yc], [hx0 + T, yc - T / 2], [hx1 - T, yc - T / 2], [hx1 - T / 2, yc], [hx1 - T, yc + T / 2], [hx0 + T, yc + T / 2]];
const vSeg = (xc, y0, y1) => [[xc, y0 + T / 2], [xc + T / 2, y0 + T], [xc + T / 2, y1 - T], [xc, y1 - T / 2], [xc - T / 2, y1 - T], [xc - T / 2, y0 + T]];
const SEG = {
  a: hSeg(1.6), g: hSeg(H / 2), d: hSeg(H - 1.6),
  f: vSeg(1.6, 1.6, H / 2), b: vSeg(W - 1.6, 1.6, H / 2),
  e: vSeg(1.6, H / 2, H - 1.6), c: vSeg(W - 1.6, H / 2, H - 1.6)
};
const DIGITS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
const pts = (p) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

function layout(text) {
  let x = 0;
  const glyphs = [];
  for (const ch of String(text)) {
    if (ch in DIGITS) { glyphs.push({ ch, x }); x += W + 3; }
    else if (ch === "'") { glyphs.push({ ch, x }); x += 5; }
    else if (ch === ':' || ch === '.') { glyphs.push({ ch, x }); x += 5; }
    else x += 7; // space
  }
  return { glyphs, width: Math.max(x - 3, 1) };
}

export default function DateStamp({ value, height = 18, ghost = true, className = '', label }) {
  const { glyphs, width } = layout(value);
  return (
    <svg
      viewBox={`-2 -1 ${width + 6} ${H + 2}`}
      height={height}
      width={(height * (width + 6)) / (H + 2)}
      className={`overflow-visible ${className}`}
      role="img"
      aria-label={label || String(value)}
    >
      <g transform="skewX(-7)">
        {glyphs.map(({ ch, x }, i) => {
          if (ch === "'") return <polygon key={i} className="led" fill="currentColor" points={pts([[x + 1.4, 1], [x + 3.4, 1], [x + 2.2, 6.5], [x + 0.9, 6.5]])} />;
          if (ch === ':') return (
            <g key={i} className="led" fill="currentColor">
              <rect x={x + 0.8} y={6} width={2.6} height={2.6} /><rect x={x + 0.8} y={14} width={2.6} height={2.6} />
            </g>
          );
          if (ch === '.') return <rect key={i} className="led" fill="currentColor" x={x + 0.8} y={H - 3} width={2.6} height={2.6} />;
          const on = DIGITS[ch];
          return (
            <g key={i} transform={`translate(${x} 0)`}>
              {ghost && <g className="led-off" fill="currentColor">{Object.keys(SEG).filter(s => !on.includes(s)).map(s => <polygon key={s} points={pts(SEG[s])} />)}</g>}
              <g className="led" fill="currentColor">{[...on].map(s => <polygon key={s} points={pts(SEG[s])} />)}</g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// "14 10 '26" — the classic imprint format (day month 'year).
export function stampText(d) {
  if (!d) return '';
  const z = (n) => String(n).padStart(2, '0');
  return `${z(d.getDate())} ${z(d.getMonth() + 1)} '${String(d.getFullYear()).slice(2)}`;
}
