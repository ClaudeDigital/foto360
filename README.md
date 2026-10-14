# foto360

Dokumentim ditor me foto për lokacione/projekte + gjenerim automatik i videove timelapse.

## Stack
- Backend: Node.js 20 + Express + better-sqlite3 + JWT + multer + ffmpeg
- Frontend: React 18 + Vite + Tailwind CSS (mobile-first, dark mode)
- Deploy: PM2 + Nginx + Cloudflare Tunnel

## Aplikacion në telefon (PWA)
foto360 instalohet si aplikacion në iPhone dhe Android pa App Store:
- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** butoni *Instalo* në aplikacion, ose menyja ⋮ → *Install app*

Kërkon HTTPS (Cloudflare Tunnel e ofron). Ikonat/logoja janë në `frontend-src/public/`.

## Struktura
- `server.js` — API + gjenerim timelapse me ffmpeg
- `frontend-src/` — burimi i frontend-it (React)
- `uploads/thumbs/` — miniatura të gjeneruara automatikisht (ffmpeg) për galeri më të shpejtë në mobile
- `frontend/` — build i frontend-it (gjenerohet, nuk përfshihet në git)
