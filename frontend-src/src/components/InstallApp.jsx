import React, { useState } from 'react';
import { useInstall } from '../pwa.js';
import Sheet from './Sheet.jsx';
import Icon from './Icon.jsx';
import { LogoMark } from './Logo.jsx';

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="h-7 w-7 shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-sm font-bold flex items-center justify-center">{n}</span>
      <span className="pt-0.5 text-sm text-slate-700 dark:text-slate-300">{children}</span>
    </li>
  );
}

export function InstallInstructions({ os }) {
  if (os === 'ios') {
    return (
      <ol className="flex flex-col gap-3">
        <Step n={1}>Hap <b>foto360</b> në <b>Safari</b>.</Step>
        <Step n={2}>Shtyp butonin <b>Share</b> <Icon name="share" size={16} className="inline -mt-1 text-brand-600" /> poshtë ekranit.</Step>
        <Step n={3}>Zgjedh <b>“Add to Home Screen”</b> <Icon name="addbox" size={16} className="inline -mt-1 text-brand-600" /> (Shto në ekranin kryesor).</Step>
        <Step n={4}>Shtyp <b>Add</b> — ikona e foto360 shfaqet si aplikacion.</Step>
      </ol>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      <Step n={1}>Hap <b>foto360</b> në <b>Chrome</b>.</Step>
      <Step n={2}>Shtyp menynë <b>⋮</b> lart djathtas.</Step>
      <Step n={3}>Zgjedh <b>“Install app”</b> ose <b>“Add to Home screen”</b>.</Step>
      <Step n={4}>Konfirmo — aplikacioni shfaqet në telefon si çdo app tjetër.</Step>
    </ol>
  );
}

// A button that installs directly where the browser allows it (Android/Chrome),
// otherwise opens a sheet with platform-specific steps (iPhone/Safari).
export default function InstallApp({ variant = 'card' }) {
  const { installed, os, canPrompt, promptInstall } = useInstall();
  const [open, setOpen] = useState(false);
  if (installed) return null;

  const onClick = async () => {
    if (canPrompt) {
      const ok = await promptInstall();
      if (ok) return;
    }
    setOpen(true);
  };

  return (
    <>
      {variant === 'card' ? (
        <button onClick={onClick} className="w-full text-left card p-4 flex items-center gap-4 active:scale-[0.99] transition">
          <LogoMark size={48} className="shrink-0 rounded-2xl shadow-glow" />
          <div className="flex-1 min-w-0">
            <p className="font-bold">Shkarko aplikacionin</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">iPhone & Android — hapet si app, pa App Store.</p>
          </div>
          <span className="h-9 px-4 rounded-full bg-brand-gradient text-white text-sm font-semibold flex items-center gap-1.5 shrink-0">
            <Icon name="download" size={16} /> Instalo
          </span>
        </button>
      ) : (
        <button onClick={onClick} className="btn-secondary w-full">
          <Icon name="phone" size={20} /> Shkarko si App (iPhone & Android)
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col items-center text-center mb-5">
          <LogoMark size={72} className="rounded-[22px] shadow-glow" />
          <h3 className="text-xl font-bold mt-3">Instalo foto360</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hapet në ekran të plotë, direkt nga ikona në telefon.</p>
        </div>
        <InstallTabs initial={os === 'ios' ? 'ios' : 'android'} />
        <button onClick={() => setOpen(false)} className="btn-primary w-full mt-6">E kuptova</button>
      </Sheet>
    </>
  );
}

function InstallTabs({ initial }) {
  const [tab, setTab] = useState(initial);
  return (
    <div>
      <div className="segmented mb-4" role="tablist">
        <button role="tab" aria-selected={tab === 'ios'} onClick={() => setTab('ios')}>iPhone</button>
        <button role="tab" aria-selected={tab === 'android'} onClick={() => setTab('android')}>Android</button>
      </div>
      <InstallInstructions os={tab} />
    </div>
  );
}
