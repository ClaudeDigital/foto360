import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';

const FEATURES = [
  {
    icon: '📷',
    title: 'Foto në çast',
    text: 'Hap kamerën direkt në telefon dhe bëj foto — ora, data dhe muaji ngjiten automatikisht.'
  },
  {
    icon: '⬆️',
    title: 'Ngarko nga galeria',
    text: 'Ke foto të vjetra? Ngarkoji dhe (opsionalisht) shkruaj datën për t’i renditur saktë.'
  },
  {
    icon: '📍',
    title: 'Lokacione të ndara',
    text: 'Çdo projekt/vend e ka hapësirën e vet — fotot kurrë nuk përzihen mes lokacioneve.'
  },
  {
    icon: '🎬',
    title: 'Video Timelapse',
    text: 'Zgjedh periudhën (një muaj, një vit, çfarëdo) dhe krijo automatikisht video timelapse.'
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <span className="text-2xl">📸</span> foto360
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-lg mx-auto px-5 pb-16">
        <section className="pt-6 pb-10 text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Dokumento çdo ditë.<br />
            <span className="text-brand-600 dark:text-brand-400">Shiko progresin në video.</span>
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Bëj një foto çdo ditë në një lokacion dhe krijo automatikisht një video timelapse me datën dhe orën e vendosur në foto.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link to="/regjistrohu" className="h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center active:scale-[0.98] transition">
              Fillo tani — falas për t’u regjistruar
            </Link>
            <Link to="/kycu" className="h-12 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center active:scale-[0.98] transition">
              Kam llogari — Kyçu
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex gap-3 items-start">
              <div className="text-2xl">{f.icon}</div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="font-bold text-lg mb-3">Çmimet</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl border-2 border-brand-500 bg-white dark:bg-slate-900 p-5 relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">MË E ZGJEDHUR</span>
              <h3 className="font-bold text-lg">Full Access</h3>
              <p className="text-3xl font-extrabold mt-1">€10 <span className="text-sm font-medium text-slate-500">një herë</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Lokacione dhe projekte të pakufizuara.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="font-bold text-lg">Limited Access</h3>
              <p className="text-3xl font-extrabold mt-1">€1 <span className="text-sm font-medium text-slate-500">/ 1 lokacion</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Ideale për të provuar me një projekt të vetëm.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
