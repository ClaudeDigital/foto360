import React from 'react';

// An illustrated "photo" of the same spot on frame k of n: a house going up course by
// course. Drawn in SVG so the landing page can play a timelapse without shipping images.
const COURSES = 11;

export default function BuildScene({ k, n, className = '', idPrefix = 'bs' }) {
  const p = n > 1 ? k / (n - 1) : 1;
  const courses = Math.round(Math.min(1, p / 0.72) * COURSES);
  const roof = Math.max(0, Math.min(1, (p - 0.72) / 0.18));
  const finished = p > 0.95;
  // Small shifts in light so consecutive frames feel like different days, not one image.
  const sunX = 70 + ((k * 53) % 260);
  const haze = 0.25 + ((k * 37) % 10) / 40;

  const baseY = 362, left = 104, right = 296, course = 17;
  const wallTop = baseY - courses * course;
  const sky = `${idPrefix}-sky`;

  return (
    <svg viewBox="0 0 400 500" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={finished ? '#c9d6dc' : '#b9c8cf'} />
          <stop offset="1" stopColor="#e6e3d8" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${sky})`} />
      <circle cx={sunX} cy="88" r="26" fill="#fff6e2" opacity={haze + 0.3} />
      {/* far hills */}
      <path d="M0 300 L60 262 L120 284 L196 240 L262 276 L330 236 L400 270 L400 330 L0 330 Z" fill="#8e9d97" />
      <path d="M0 318 L80 292 L170 312 L250 290 L330 308 L400 296 L400 340 L0 340 Z" fill="#76857f" />
      {/* ground */}
      <rect y="330" width="400" height="170" fill="#a59a84" />
      <path d="M0 420 Q120 404 220 418 T400 410 L400 500 L0 500 Z" fill="#978c76" />

      {/* crane: hook travels with the build */}
      {!finished && (
        <g stroke="#e0a43a" strokeWidth="5" fill="none" strokeLinecap="square">
          <path d="M352 372 L352 70" />
          <path d="M210 74 L392 74" />
          <path d="M352 70 L392 74 M352 70 L300 74" strokeWidth="2" />
          <path d={`M${222 + (k % 4) * 24} 74 L${222 + (k % 4) * 24} ${Math.max(110, wallTop - 30)}`} stroke="#4d5551" strokeWidth="1.5" />
        </g>
      )}

      {/* slab */}
      <rect x={left - 14} y={baseY} width={right - left + 28} height="12" fill="#b9b8b0" />
      <rect x={left - 14} y={baseY + 12} width={right - left + 28} height="4" fill="#8a8a82" />

      {/* brick courses */}
      {Array.from({ length: courses }).map((_, i) => {
        const y = baseY - (i + 1) * course;
        const offset = i % 2 ? 16 : 0;
        return (
          <g key={i}>
            <rect x={left} y={y} width={right - left} height={course} fill={i % 3 === 1 ? '#c97f5c' : '#c3765a'} />
            {Array.from({ length: 7 }).map((__, j) => left + offset + j * 32).filter(x => x > left && x < right).map(x => (
              <rect key={x} x={x} y={y} width="1.5" height={course} fill="#a85f45" />
            ))}
            <rect x={left} y={y + course - 1.5} width={right - left} height="1.5" fill="#a85f45" />
          </g>
        );
      })}

      {/* openings appear once the wall is tall enough */}
      {courses >= 4 && <rect x="184" y={baseY - Math.min(courses, 6) * course} width="34" height={Math.min(courses, 6) * course} fill="#3c3a36" />}
      {courses >= 8 && (
        <g fill={finished ? '#f3d9a2' : '#46504f'}>
          <rect x="124" y={baseY - 8 * course} width="40" height="44" />
          <rect x="238" y={baseY - 8 * course} width="40" height="44" />
        </g>
      )}

      {/* scaffold while building */}
      {courses > 1 && !finished && (
        <g stroke="#6e7671" strokeWidth="2">
          <path d={`M${left - 10} ${baseY} L${left - 10} ${wallTop - 6} M${right + 10} ${baseY} L${right + 10} ${wallTop - 6}`} />
          {Array.from({ length: Math.floor(courses / 3) + 1 }).map((_, i) => (
            <path key={i} d={`M${left - 16} ${baseY - i * 3 * course - 2} L${left - 4} ${baseY - i * 3 * course - 2} M${right + 4} ${baseY - i * 3 * course - 2} L${right + 16} ${baseY - i * 3 * course - 2}`} />
          ))}
        </g>
      )}

      {/* roof slides in over the last frames */}
      {roof > 0 && (
        <g opacity={Math.min(1, roof * 1.4)}>
          <path d={`M${left - 22} ${wallTop} L200 ${wallTop - 96 * roof} L${right + 22} ${wallTop} Z`} fill="#5a3f36" />
          <path d={`M${left - 22} ${wallTop} L${right + 22} ${wallTop}`} stroke="#3e2b25" strokeWidth="4" />
        </g>
      )}

      {/* the finished frame gets a tree and a path */}
      {finished && (
        <g>
          <path d="M184 378 L218 378 L250 500 L150 500 Z" fill="#c4bba6" />
          <rect x="58" y="300" width="7" height="72" fill="#5b4a3a" />
          <circle cx="61" cy="290" r="30" fill="#5f7a55" />
          <circle cx="44" cy="304" r="18" fill="#6c8a61" />
        </g>
      )}
      {/* materials pile while building */}
      {!finished && (
        <g fill="#c3765a" opacity={1 - p * 0.6}>
          <rect x="34" y="388" width="44" height="12" /><rect x="40" y="376" width="44" height="12" /><rect x="46" y="364" width="30" height="12" />
        </g>
      )}
    </svg>
  );
}
