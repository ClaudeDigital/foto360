import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo, { LogoMark } from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import InstallApp from '../components/InstallApp.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: 'camera', title: 'Foto në çast', text: 'Hap kamerën direkt në telefon — data dhe ora ngjiten automatikisht.' },
  { icon: 'ghost', title: 'Udhëzues kadri', text: 'Fotoja e fundit shfaqet transparente mbi kamerë që çdo foto të dalë në të njëjtin kënd.' },
  { icon: 'pin', title: 'Lokacione të ndara', text: 'Çdo projekt e ka hapësirën e vet — fotot kurrë nuk përzihen.' },
  { icon: 'film', title: 'Video Timelapse', text: 'Zgjedh periudhën dhe merr videon e gatshme për ta shkarkuar e ndarë.' }
];

const STEPS = [
  ['Krijo lokacion', 'P.sh. “Shtëpia — Prishtinë” ose “Kopshti”.'],
  ['Bëj foto çdo ditë', 'Një prekje — foto ruhet me datë e orë.'],
  ['Gjenero video', 'Shiko muaj progres në pak sekonda.']
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* soft brand glow behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-brand-gradient opacity-25 blur-3xl dark:opacity-30" />
      </div>

      <header className="relative safe-top">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-5 pb-16">
        <section className="pt-8 pb-10 text-center animate-pop-in">
          <LogoMark size={88} className="mx-auto rounded-[26px] shadow-glow" />
          <h1 className="mt-6 text-[34px] sm:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Dokumento çdo ditë.<br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">Shiko progresin në video.</span>
          </h1>
          <p className="mt-4 text-[17px] text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Një foto në ditë nga i njëjti vend — foto360 i kthen automatikisht në video timelapse me datë e orë.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            {user ? (
              <Link to="/dashboard" className="btn-primary h-14 text-base">Hap lokacionet e mia <Icon name="chevron" size={18} /></Link>
            ) : (
              <>
                <Link to="/regjistrohu" className="btn-primary h-14 text-base">Fillo tani — falas</Link>
                <Link to="/kycu" className="btn-secondary h-14 text-base">Kam llogari — Kyçu</Link>
              </>
            )}
          </div>
        </section>

        <section className="mb-10">
          <InstallApp />
        </section>

        <section className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card p-4 animate-pop-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-11 w-11 rounded-2xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
                <Icon name={f.icon} />
              </div>
              <h3 className="font-bold mt-3 leading-tight">{f.title}</h3>
              <p className="text-[13px] leading-snug text-slate-600 dark:text-slate-400 mt-1">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold mb-4">Si funksionon</h2>
          <ol className="card divide-y divide-slate-100 dark:divide-slate-800">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex items-center gap-4 p-4">
                <span className="h-10 w-10 shrink-0 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold mb-4">Çmimet</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative rounded-3xl p-[2px] bg-brand-gradient shadow-glow">
              <div className="rounded-[22px] bg-white dark:bg-slate-900 p-5 h-full">
                <span className="chip bg-brand-gradient text-white absolute -top-3 right-5">MË E ZGJEDHUR</span>
                <h3 className="font-bold text-lg">Full Access</h3>
                <p className="text-4xl font-extrabold mt-1">€10 <span className="text-sm font-medium text-slate-500">një herë</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Lokacione dhe projekte të pakufizuara.</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-lg">Limited Access</h3>
              <p className="text-4xl font-extrabold mt-1">€1 <span className="text-sm font-medium text-slate-500">/ 1 lokacion</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Ideale për të provuar me një projekt të vetëm.</p>
            </div>
          </div>
        </section>

        <footer className="mt-14 text-center text-xs text-slate-400 safe-bottom">
          © {new Date().getFullYear()} foto360
        </footer>
      </main>
    </div>
  );
}
