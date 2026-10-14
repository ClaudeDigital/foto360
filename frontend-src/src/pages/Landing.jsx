import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import InstallApp from '../components/InstallApp.jsx';
import BuildScene from '../components/BuildScene.jsx';
import DateStamp, { stampText } from '../components/DateStamp.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDay } from '../utils.js';

const FRAMES = 12;
const DAYS_BETWEEN = 10;

function frameDate(k) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (FRAMES - 1 - k) * DAYS_BETWEEN);
  return d;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// The hero: a playable timelapse of an illustrated building site. It plays once on load,
// then hands control to the visitor, who can scrub through the contact strip.
function TimelapsePlayer() {
  const [k, setK] = useState(() => (prefersReducedMotion() ? FRAMES - 1 : 0));
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setK(v => {
        if (v >= FRAMES - 1) { setPlaying(false); return v; }
        return v + 1;
      });
    }, 420);
    return () => clearInterval(timer.current);
  }, [playing]);

  const play = () => { if (k >= FRAMES - 1) setK(0); setPlaying(true); };
  const pick = (i) => { setPlaying(false); setK(i); };
  const date = frameDate(k);

  return (
    <figure className="w-full">
      <div className="print rotate-[-1.2deg] md:rotate-[-1.6deg]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-slate-300">
          <BuildScene k={k} n={FRAMES} className="h-full w-full" idPrefix="hero" />
          <div className="absolute right-3 bottom-3">
            <DateStamp value={stampText(date)} height={22} label={`Data e fotos: ${fmtDay(date)}`} />
          </div>
          <button
            onClick={playing ? () => setPlaying(false) : play}
            className="absolute left-3 bottom-3 h-9 pl-2.5 pr-3 rounded-lg bg-slate-950/55 text-white text-xs font-semibold backdrop-blur flex items-center gap-1.5 active:scale-95"
          >
            {playing
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> Ndal</>
              : <><Icon name="play" size={14} /> Luaj</>}
          </button>
        </div>
      </div>

      {/* contact strip: one cell per frame, tap or drag to scrub */}
      <div className="mt-6 md:mt-7">
        <input
          type="range" min="0" max={FRAMES - 1} value={k}
          onChange={e => pick(Number(e.target.value))}
          aria-label="Lëviz nëpër foto"
          className="sr-only peer"
          id="scrub"
        />
        <div className="grid gap-1 rounded-lg p-1 bg-slate-950 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-stamp-500"
          style={{ gridTemplateColumns: `repeat(${FRAMES}, minmax(0, 1fr))` }}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); scrubAt(e, pick); }}
          onPointerMove={e => e.buttons && scrubAt(e, pick)}
        >
          {Array.from({ length: FRAMES }).map((_, i) => (
            <div key={i} className={`relative aspect-[4/5] overflow-hidden rounded-[2px] transition ${i === k ? 'ring-2 ring-stamp-500 ring-offset-1 ring-offset-slate-950' : i > k ? 'opacity-35' : 'opacity-80'}`}>
              <BuildScene k={i} n={FRAMES} className="h-full w-full" idPrefix={`strip${i}`} />
            </div>
          ))}
        </div>
        <figcaption className="mt-2.5 flex items-baseline justify-between gap-3 text-[13px] text-slate-500 dark:text-slate-400">
          <span>Shembull: shtëpi në ndërtim, {FRAMES} foto në {(FRAMES - 1) * DAYS_BETWEEN} ditë</span>
          <span className="tnum font-semibold text-slate-700 dark:text-slate-300 shrink-0">{k + 1}/{FRAMES}</span>
        </figcaption>
      </div>
    </figure>
  );
}

function scrubAt(e, pick) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - r.left, 0), r.width - 1);
  pick(Math.floor((x / r.width) * FRAMES));
}

// Two consecutive frames stacked: the camera's frame guide in one picture.
function GhostDemo() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-900">
      <BuildScene k={6} n={FRAMES} className="absolute inset-0 h-full w-full" idPrefix="g1" />
      <BuildScene k={5} n={FRAMES} className="absolute inset-0 h-full w-full opacity-40 mix-blend-luminosity translate-x-[3%] -translate-y-[1.5%]" idPrefix="g2" />
      {/* rule-of-thirds guide, as drawn by the in-app camera */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/25" />)}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-[12px] font-semibold text-white">
        <span className="rounded-md bg-slate-950/55 backdrop-blur px-2 py-1">Fotoja e djeshme, 40%</span>
        <span className="h-12 w-12 rounded-full border-[3px] border-white flex items-center justify-center">
          <span className="h-9 w-9 rounded-full bg-stamp-500" />
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  ['Shto vendin', 'Jepi një emër: “Shtëpia në Arbëri”, “Kopshti”, “Lokali Qendër”. Secili ka fotot e veta.'],
  ['Fotografo çdo ditë', 'Kamera e hap foton e djeshme si hije, që ta kapësh të njëjtin kënd. Data dhe ora ruhen vetë.'],
  ['Gjenero videon', 'Zgjedh periudhën dhe merr një MP4 me datën mbi çdo kuadër, gati për ta shkarkuar a ndarë.']
];

const EXTRAS = [
  ['bell', 'Rikujtim në 11:59', 'Nëse ende s’ke bërë foton e ditës, telefoni të kujton.'],
  ['phone', 'Si aplikacion', 'Instalohet në iPhone dhe Android direkt nga shfletuesi, pa App Store.'],
  ['shield', 'Fotot janë të tuat', 'Çdo lokacion është privat. Videot i ndan vetëm kur do ti.']
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen overflow-x-hidden grain">
      <header className="safe-top">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            {!user && <Link to="/kycu" className="h-10 px-3 rounded-lg text-sm font-semibold flex items-center hover:bg-slate-300/50 dark:hover:bg-slate-800">Kyçu</Link>}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="max-w-6xl mx-auto px-5 pt-6 pb-16 md:pt-14 md:pb-24 grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-16 items-center">
          <div>
            <h1 className="font-display font-extrabold text-[56px] leading-[0.92] sm:text-[76px] lg:text-[96px] text-slate-900 dark:text-slate-50">
              I njëjti vend.<br />Çdo ditë.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-[34ch]">
              Bëj një foto në ditë nga i njëjti kënd. foto360 i ruan me datë e orë dhe në fund i bashkon në një video timelapse.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary h-14 px-7 text-base">Hap lokacionet e mia</Link>
              ) : (
                <>
                  <Link to="/regjistrohu" className="btn-primary h-14 px-7 text-base">Krijo llogari</Link>
                  <Link to="/kycu" className="btn-secondary h-14 px-6 text-base">Kam llogari</Link>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Regjistrimi është falas. Plani fillon nga €1.</p>
          </div>
          <div className="max-w-[420px] w-full mx-auto md:mx-0 md:justify-self-end">
            <TimelapsePlayer />
          </div>
        </section>

        {/* how it works: a real sequence, so it is numbered */}
        <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-300/70 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl">Si funksionon</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[auto_1fr] gap-x-4 md:block">
                  <span className="font-display font-black text-6xl leading-none text-slate-300 dark:text-slate-700 md:text-7xl">{i + 1}</span>
                  <div className="md:mt-4">
                    <h3 className="text-lg font-bold">{t}</h3>
                    <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed max-w-[38ch]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* frame guide spotlight */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="max-w-[360px] w-full mx-auto md:order-2">
            <GhostDemo />
          </div>
          <div className="md:order-1">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl leading-[0.95]">Pa kënde që lëvizin</h2>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-[42ch]">
              Timelapse duket mirë vetëm kur kamera rri në vend. Kur hap kamerën, fotoja e djeshme shfaqet e tejdukshme sipër. Rreshtoje dhe shtyp butonin.
            </p>
            <ul className="mt-8 grid gap-5">
              {EXTRAS.map(([icon, t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-slate-300/60 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200"><Icon name={icon} size={20} /></span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-snug mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* pricing */}
        <section className="bg-slate-900 text-slate-100 dark:bg-slate-900 dark:border-y dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl">Paguan një herë</h2>
            <p className="mt-3 text-slate-400 max-w-[46ch]">Pa abonim mujor. Pagesa bëhet me para në dorë ose me kartë dhe aktivizohet pasi konfirmohet.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-3xl">
              <div className="rounded-2xl bg-slate-50 text-slate-900 p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-bold">Full Access</h3>
                  <span className="text-xs font-semibold text-stamp-700">Më i zgjedhuri</span>
                </div>
                <p className="mt-3 font-display font-black text-6xl leading-none">€10</p>
                <p className="mt-4 text-slate-600">Lokacione pa kufi. Për ndërtime, renovime e projekte që zgjasin.</p>
              </div>
              <div className="rounded-2xl border border-slate-700 p-6">
                <h3 className="text-lg font-bold">Limited Access</h3>
                <p className="mt-3 font-display font-black text-6xl leading-none">€1</p>
                <p className="mt-4 text-slate-400">Një lokacion. Mjafton për një kopsht, një dhomë, një projekt.</p>
              </div>
            </div>
            <Link to={user ? '/planet' : '/regjistrohu'} className="mt-8 btn h-14 px-7 text-base bg-stamp-500 text-slate-950 hover:bg-stamp-400">
              {user ? 'Shiko planet' : 'Krijo llogari'}
            </Link>
          </div>
        </section>

        <section className="max-w-xl mx-auto px-5 pt-14">
          <InstallApp />
        </section>

        <footer className="max-w-6xl mx-auto px-5 pt-14 pb-10 safe-bottom flex items-center justify-between text-sm text-slate-500">
          <Logo size={24} />
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}
