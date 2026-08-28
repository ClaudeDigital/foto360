# foto360

Dokumentim ditor me foto për lokacione/projekte + gjenerim automatik i videove timelapse.

## Stack
- Backend: Node.js 20 + Express + better-sqlite3 + JWT + multer + ffmpeg
- Frontend: React 18 + Vite + Tailwind CSS (mobile-first, dark mode)
- Deploy: PM2 + Nginx + Cloudflare Tunnel

## Struktura
- `server.js` — API + gjenerim timelapse me ffmpeg
- `frontend-src/` — burimi i frontend-it (React)
- `frontend/` — build i frontend-it (gjenerohet, nuk përfshihet në git)
