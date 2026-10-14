const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Database = require('better-sqlite3');
const { execFile } = require('child_process');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'foto360-dev-secret-change-me';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://foto360.gezimm.com';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_PHOTOS = path.join(__dirname, 'uploads', 'photos');
const UPLOAD_VIDEOS = path.join(__dirname, 'uploads', 'videos');
const UPLOAD_THUMBS = path.join(__dirname, 'uploads', 'thumbs');
[DATA_DIR, UPLOAD_PHOTOS, UPLOAD_VIDEOS, UPLOAD_THUMBS].forEach(d => fs.mkdirSync(d, { recursive: true }));

const db = new Database(path.join(DATA_DIR, 'foto360.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  access_tier TEXT NOT NULL DEFAULT 'none',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  telegram_message_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload',
  captured_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
CREATE TABLE IF NOT EXISTS timelapses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  date_from TEXT,
  date_to TEXT,
  video_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  photo_count INTEGER DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
`);

const timelapseCols = db.prepare("PRAGMA table_info(timelapses)").all().map(c => c.name);
if (!timelapseCols.includes('progress')) {
  db.exec("ALTER TABLE timelapses ADD COLUMN progress INTEGER NOT NULL DEFAULT 0");
}

if (db.prepare('SELECT COUNT(*) c FROM admin_users').get().c === 0) {
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)')
    .run('admin', bcrypt.hashSync('admin123', 10));
}

app.disable('x-powered-by');
app.use(cors());
app.use(compression());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ---------- Thumbnails ----------
// Gallery grids on phones only need ~480px images; serving the original 3–8 MB camera
// JPEGs made the photo grid slow on mobile data. Thumbnails are generated lazily with
// ffmpeg on first request (so existing photos get them too) and cached on disk.
const SAFE_FILENAME = /^[\w.-]+$/;
const thumbJobs = new Map();
function ensureThumb(filename) {
  const dst = path.join(UPLOAD_THUMBS, filename);
  if (fs.existsSync(dst)) return Promise.resolve(dst);
  if (!thumbJobs.has(filename)) {
    const src = path.join(UPLOAD_PHOTOS, filename);
    const tmp = path.join(UPLOAD_THUMBS, `tmp-${crypto.randomBytes(4).toString('hex')}-${filename}`);
    const job = run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', "scale='min(480,iw)':-2", '-frames:v', '1', '-q:v', '5', '-f', 'image2', tmp])
      .then(() => { fs.renameSync(tmp, dst); return dst; })
      .catch((e) => { fs.rm(tmp, { force: true }, () => {}); throw e; })
      .finally(() => thumbJobs.delete(filename));
    thumbJobs.set(filename, job);
  }
  return thumbJobs.get(filename);
}
function removePhotoFiles(filename) {
  fs.unlink(path.join(UPLOAD_PHOTOS, filename), () => {});
  fs.unlink(path.join(UPLOAD_THUMBS, filename), () => {});
}

app.get('/uploads/thumbs/:file', async (req, res) => {
  const { file } = req.params;
  if (!SAFE_FILENAME.test(file) || !fs.existsSync(path.join(UPLOAD_PHOTOS, file))) return res.sendStatus(404);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  try {
    res.sendFile(await ensureThumb(file));
  } catch (e) {
    // Fall back to the original if ffmpeg can't decode it (e.g. HEIC on older ffmpeg).
    res.sendFile(path.join(UPLOAD_PHOTOS, file));
  }
});
// Photo/video filenames are unique (timestamp + random), so they can be cached forever.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '365d', immutable: true }));

// ---------- Auth helpers ----------
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Kërkohet kyçje' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'user') throw new Error('bad role');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Sesion i pavlefshëm' });
  }
}
function adminAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Kërkohet kyçje' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('bad role');
    req.adminId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Sesion i pavlefshëm' });
  }
}

function getUser(id) {
  return db.prepare('SELECT id, name, email, access_tier, created_at FROM users WHERE id=?').get(id);
}

function ownsLocation(locationId, userId) {
  return db.prepare('SELECT * FROM locations WHERE id=? AND user_id=?').get(locationId, userId);
}

// ---------- Telegram (BigBot) ----------
async function tg(method, body) {
  if (!TELEGRAM_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error('telegram error', e.message);
    return null;
  }
}

async function notifyNewOrder(order, user) {
  const planLabel = order.plan === 'full' ? 'Full Access (€10)' : 'Limited Access (€1)';
  const text = `🆕 *foto360* — Regjistrim i ri\n\n👤 ${user.name}\n✉️ ${user.email}\n📦 Plani: ${planLabel}\n💳 Metoda: ${order.payment_method === 'cash' ? 'Cash' : 'Kartë'}\n💰 Shuma: €${order.amount}\n\nID Porosia: #${order.id}`;
  const resp = await tg('sendMessage', {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Konfirmo', callback_data: `approve:${order.id}` },
        { text: '❌ Refuzo', callback_data: `reject:${order.id}` }
      ]]
    }
  });
  if (resp && resp.result) {
    db.prepare('UPDATE orders SET telegram_message_id=? WHERE id=?').run(String(resp.result.message_id), order.id);
  }
}

function applyOrderDecision(orderId, approve) {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  if (!order || order.status !== 'pending') return null;
  const status = approve ? 'confirmed' : 'rejected';
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, orderId);
  if (approve) {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(order.user_id);
    // full always wins over limited; never downgrade
    if (order.plan === 'full' || user.access_tier !== 'full') {
      db.prepare('UPDATE users SET access_tier=? WHERE id=?').run(order.plan, order.user_id);
    }
  }
  return order;
}

// ---------- Auth routes ----------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Plotëso emrin, email dhe fjalëkalim (min 6 karaktere)' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(400).json({ error: 'Ky email ekziston tashmë' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email.toLowerCase(), hash);
  const token = signToken({ id: info.lastInsertRowid, role: 'user' });
  res.json({ token, user: getUser(info.lastInsertRowid) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }
  const token = signToken({ id: user.id, role: 'user' });
  res.json({ token, user: getUser(user.id) });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: getUser(req.userId) });
});

// ---------- Password change / reset ----------
// Two ways to reset a forgotten password, both ending in the same 6-digit code form:
//  - the user asks for a code by email (sent through Resend), valid 30 minutes;
//  - the admin generates a code in /admin and passes it on (phone, chat), valid 24 hours.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'foto360 <foto360@cmimet.gezimm.com>';
const RESET_MAX_ATTEMPTS = 5;

db.exec(`
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  source TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

const hashCode = (code) => crypto.createHash('sha256').update(`${JWT_SECRET}:${code}`).digest('hex');
const sqlTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

function createResetCode(userId, source, ttlMinutes) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  // A new code replaces any earlier unused one.
  db.prepare("UPDATE password_resets SET used_at=datetime('now') WHERE user_id=? AND used_at IS NULL").run(userId);
  db.prepare('INSERT INTO password_resets (user_id, code_hash, source, expires_at) VALUES (?, ?, ?, ?)')
    .run(userId, hashCode(code), source, sqlTime(new Date(Date.now() + ttlMinutes * 60000)));
  return code;
}

async function sendResetEmail(user, code) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY mungon');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [user.email],
      subject: `Kodi yt foto360: ${code}`,
      text: `Përshëndetje ${user.name},\n\nKodi për të ndryshuar fjalëkalimin në foto360 është: ${code}\n\nKodi vlen 30 minuta. Hape ${PUBLIC_URL}/harrova dhe shkruaje aty.\n\nNëse nuk e ke kërkuar ti, injoroje këtë email.`
    })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

app.post('/api/auth/forgot', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const generic = { ok: true, message: 'Nëse ky email ka llogari, kodi u dërgua.' };
  const user = email && db.prepare('SELECT id, name, email FROM users WHERE email=?').get(email);
  if (!user) return res.json(generic);
  const recent = db.prepare("SELECT COUNT(*) c FROM password_resets WHERE user_id=? AND source='email' AND created_at >= datetime('now','-1 hour')").get(user.id).c;
  if (recent >= 3) return res.status(429).json({ error: 'Ke kërkuar shumë kode. Provo pas një ore.' });
  const code = createResetCode(user.id, 'email', 30);
  try {
    await sendResetEmail(user, code);
  } catch (e) {
    console.error('reset email failed', e.message);
    return res.status(502).json({ error: 'Emaili nuk u dërgua. Provo më vonë ose kontakto administratorin.' });
  }
  res.json(generic);
});

app.post('/api/auth/reset', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').replace(/\D/g, '');
  const password = String(req.body?.password || '');
  if (password.length < 6) return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere' });
  const invalid = () => res.status(400).json({ error: 'Kodi është i gabuar ose ka skaduar' });
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (!user) return invalid();
  const reset = db.prepare("SELECT * FROM password_resets WHERE user_id=? AND used_at IS NULL AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1").get(user.id);
  if (!reset || reset.attempts >= RESET_MAX_ATTEMPTS) return invalid();
  if (reset.code_hash !== hashCode(code)) {
    db.prepare('UPDATE password_resets SET attempts=attempts+1 WHERE id=?').run(reset.id);
    return invalid();
  }
  db.prepare("UPDATE password_resets SET used_at=datetime('now') WHERE id=?").run(reset.id);
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), user.id);
  const token = signToken({ id: user.id, role: 'user' });
  res.json({ token, user: getUser(user.id) });
});

app.post('/api/auth/change-password', auth, (req, res) => {
  const { current, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!user || !bcrypt.compareSync(current || '', user.password_hash)) return res.status(400).json({ error: 'Fjalëkalimi aktual është i gabuar' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), user.id);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/reset-code', adminAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Nuk u gjet' });
  res.json({ code: createResetCode(user.id, 'admin', 24 * 60), hours: 24, email: user.email });
});

app.post('/api/admin/change-password', adminAuth, (req, res) => {
  const { current, password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admin_users WHERE id=?').get(req.adminId);
  if (!admin || !bcrypt.compareSync(current || '', admin.password_hash)) return res.status(400).json({ error: 'Fjalëkalimi aktual është i gabuar' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere' });
  db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), admin.id);
  res.json({ ok: true });
});

// ---------- Orders / Payment ----------
const PLAN_PRICES = { full: 10, limited: 1 };

app.post('/api/orders', auth, (req, res) => {
  const { plan, payment_method } = req.body;
  if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plan i pavlefshëm' });
  if (!['cash', 'card'].includes(payment_method)) return res.status(400).json({ error: 'Metodë pagese e pavlefshme' });
  const user = getUser(req.userId);
  const amount = PLAN_PRICES[plan];
  const info = db.prepare(
    'INSERT INTO orders (user_id, plan, amount, payment_method) VALUES (?, ?, ?, ?)'
  ).run(req.userId, plan, amount, payment_method);
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(info.lastInsertRowid);
  notifyNewOrder(order, user);
  res.json({ order });
});

app.get('/api/orders/mine', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(req.userId);
  res.json({ orders });
});

// ---------- Telegram webhook router ----------
// The BigBot token is shared across all gezimm.com projects (turn, gesim, foto360, ...),
// but Telegram allows only ONE webhook URL per bot. This endpoint is registered as that
// single URL and forwards each update to the right project based on its callback_data
// shape, so every project keeps handling its own approvals unmodified.
const ROUTER_SECRET = process.env.TELEGRAM_SECRET_TOKEN || '';
const OTHER_PROJECT_WEBHOOKS = [
  { pattern: /^(confirm_order|reject_order)_\d+$/, url: 'https://turn.gezimm.com/api/telegram/webhook' },
  { pattern: /^(confirm|cancel)_\d+$/, url: 'https://gesim.gezimm.com/api/telegram/webhook' },
  { pattern: /^pay_(ok|no)_\d+$/, url: 'https://gjuha.gezimm.com/api/telegram/webhook' }
];

async function handleFoto360Callback(update) {
  const cq = update.callback_query;
  const [action, idStr] = (cq.data || '').split(':');
  const orderId = parseInt(idStr, 10);
  const order = applyOrderDecision(orderId, action === 'approve');
  if (order) {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(order.user_id);
    const label = action === 'approve' ? '✅ Konfirmuar' : '❌ Refuzuar';
    const planLabel = order.plan === 'full' ? 'Full Access (€10)' : 'Limited Access (€1)';
    await tg('editMessageText', {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      text: `${label}\n\n👤 ${user.name}\n✉️ ${user.email}\n📦 Plani: ${planLabel}\n\nID Porosia: #${order.id}`,
      parse_mode: 'Markdown'
    });
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: label });
  } else {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Kjo porosi është përpunuar tashmë' });
  }
}

app.post('/api/telegram/router', async (req, res) => {
  if (ROUTER_SECRET) {
    const got = req.headers['x-telegram-bot-api-secret-token'];
    if (got !== ROUTER_SECRET) return res.sendStatus(401);
  }
  res.sendStatus(200);
  const update = req.body;
  const data = update?.callback_query?.data || '';
  const target = OTHER_PROJECT_WEBHOOKS.find(t => t.pattern.test(data));
  try {
    if (target) {
      await fetch(target.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    } else if (/^(approve|reject):\d+$/.test(data) && update.callback_query) {
      await handleFoto360Callback(update);
    }
  } catch (e) {
    console.error('telegram router error', e.message);
  }
});

// Kept for direct testing / backward compatibility — real traffic arrives via /router above.
app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  const update = req.body;
  if (update.callback_query && /^(approve|reject):\d+$/.test(update.callback_query.data || '')) {
    await handleFoto360Callback(update);
  }
});

// ---------- Locations ----------
function locationLimitReached(user) {
  if (user.access_tier === 'full') return false;
  const count = db.prepare('SELECT COUNT(*) c FROM locations WHERE user_id=?').get(user.id).c;
  if (user.access_tier === 'limited') return count >= 1;
  return true; // 'none' tier => always blocked
}

app.get('/api/locations', auth, (req, res) => {
  const locations = db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM photos p WHERE p.location_id=l.id) as photo_count,
      (SELECT MAX(datetime(COALESCE(p.captured_at, p.created_at))) FROM photos p WHERE p.location_id=l.id) as last_photo_at,
      (SELECT p.filename FROM photos p WHERE p.location_id=l.id
        ORDER BY datetime(COALESCE(p.captured_at, p.created_at)) DESC, p.id DESC LIMIT 1) as latest_photo
    FROM locations l WHERE l.user_id=? ORDER BY l.id DESC
  `).all(req.userId);
  res.json({ locations });
});

app.post('/api/locations', auth, (req, res) => {
  const user = getUser(req.userId);
  if (locationLimitReached(user)) {
    return res.status(403).json({
      error: user.access_tier === 'none'
        ? 'Zgjedh një plan për të krijuar lokacione'
        : 'Plani "Limited" lejon vetëm 1 lokacion. Kalo në Full Access për lokacione të pakufizuara.'
    });
  }
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Emri i lokacionit është i domosdoshëm' });
  const info = db.prepare('INSERT INTO locations (user_id, name, description) VALUES (?, ?, ?)')
    .run(req.userId, name, description || null);
  res.json({ location: db.prepare('SELECT * FROM locations WHERE id=?').get(info.lastInsertRowid) });
});

app.get('/api/locations/:id', auth, (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  res.json({ location: loc });
});

app.delete('/api/locations/:id', auth, (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  const photos = db.prepare('SELECT filename FROM photos WHERE location_id=?').all(loc.id);
  photos.forEach(p => removePhotoFiles(p.filename));
  db.prepare('DELETE FROM photos WHERE location_id=?').run(loc.id);
  db.prepare('DELETE FROM timelapses WHERE location_id=?').run(loc.id);
  db.prepare('DELETE FROM locations WHERE id=?').run(loc.id);
  res.json({ ok: true });
});

// ---------- Photos ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_PHOTOS),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

app.post('/api/locations/:id/photos', auth, upload.single('photo'), (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  if (!req.file) return res.status(400).json({ error: 'Foto mungon ose formati nuk është imazh' });
  const source = req.body.source === 'capture' ? 'capture' : 'upload';
  let capturedAt = null;
  if (source === 'capture') {
    capturedAt = new Date().toISOString();
  } else if (req.body.captured_at) {
    capturedAt = new Date(req.body.captured_at).toISOString();
  }
  const info = db.prepare(
    'INSERT INTO photos (location_id, user_id, filename, source, captured_at) VALUES (?, ?, ?, ?, ?)'
  ).run(loc.id, req.userId, req.file.filename, source, capturedAt);
  if (!loc.cover_photo) {
    db.prepare('UPDATE locations SET cover_photo=? WHERE id=?').run(req.file.filename, loc.id);
  }
  res.json({ photo: db.prepare('SELECT * FROM photos WHERE id=?').get(info.lastInsertRowid) });
});

app.get('/api/locations/:id/photos', auth, (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  const { date_from, date_to } = req.query;
  let sql = 'SELECT * FROM photos WHERE location_id=?';
  const params = [loc.id];
  if (date_from) { sql += ' AND date(COALESCE(captured_at, created_at)) >= date(?)'; params.push(date_from); }
  if (date_to) { sql += ' AND date(COALESCE(captured_at, created_at)) <= date(?)'; params.push(date_to); }
  sql += ' ORDER BY COALESCE(captured_at, created_at) ASC, id ASC';
  res.json({ photos: db.prepare(sql).all(...params) });
});

app.delete('/api/photos/:id', auth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id=?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Nuk u gjet' });
  const loc = ownsLocation(photo.location_id, req.userId);
  if (!loc) return res.status(403).json({ error: 'Ndaluar' });
  removePhotoFiles(photo.filename);
  db.prepare('DELETE FROM photos WHERE id=?').run(photo.id);
  if (loc.cover_photo === photo.filename) {
    // Don't leave the dashboard card pointing at a deleted file.
    const next = db.prepare('SELECT filename FROM photos WHERE location_id=? ORDER BY COALESCE(captured_at, created_at) DESC, id DESC LIMIT 1').get(loc.id);
    db.prepare('UPDATE locations SET cover_photo=? WHERE id=?').run(next ? next.filename : null, loc.id);
  }
  res.json({ ok: true });
});

// ---------- Daily photo reminder (Web Push) ----------
// Every day at REMINDER_TIME (Kosovo time) each user with push turned on gets one
// notification listing the locations that have no photo uploaded yet today.
const webpush = require('web-push');
const REMINDER_TZ = 'Europe/Belgrade';
const REMINDER_TIME = process.env.REMINDER_TIME || '11:59';

db.exec(`
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT);
`);

// VAPID keys are generated once and kept in data/ so subscriptions survive restarts.
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
let vapid;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
} else if (fs.existsSync(VAPID_FILE)) {
  vapid = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
} else {
  vapid = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid), { mode: 0o600 });
}
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@gezimm.com', vapid.publicKey, vapid.privateKey);

// Wall-clock parts of `date` in Kosovo time.
function tzParts(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: REMINDER_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
// Start of today's Kosovo day as an SQLite UTC datetime string (matches photos.created_at).
function kosovoDayStartUtc(now = new Date()) {
  const p = tzParts(now);
  const offsetMs = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(now.getTime() / 1000) * 1000;
  const start = new Date(Date.UTC(p.y, p.m - 1, p.d) - offsetMs);
  return start.toISOString().slice(0, 19).replace('T', ' ');
}

async function sendPush(sub, payload) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 6 * 3600 });
    return true;
  } catch (e) {
    // 404/410: the browser dropped this subscription (app uninstalled, permission revoked).
    if (e.statusCode === 404 || e.statusCode === 410) {
      db.prepare('DELETE FROM push_subscriptions WHERE id=?').run(sub.id);
    } else {
      console.error('push error', e.statusCode || '', e.body || e.message);
    }
    return false;
  }
}

function reminderFor(userId) {
  const since = kosovoDayStartUtc();
  const missing = db.prepare(`
    SELECT l.id, l.name FROM locations l
    WHERE l.user_id=? AND NOT EXISTS (SELECT 1 FROM photos p WHERE p.location_id=l.id AND p.created_at >= ?)
    ORDER BY l.name`).all(userId, since);
  if (!missing.length) return null;
  const names = missing.map(l => l.name);
  const list = names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ');
  return {
    title: 'Koha për foton e sotme 📸',
    body: `Ende s'ke bërë foto sot te: ${list}`,
    url: missing.length === 1 ? `/lokacioni/${missing[0].id}?kamera=1` : '/dashboard',
    tag: 'foto360-daily'
  };
}

async function sendDailyReminders() {
  const users = db.prepare('SELECT DISTINCT user_id FROM push_subscriptions').all();
  let sent = 0;
  for (const { user_id } of users) {
    const payload = reminderFor(user_id);
    if (!payload) continue;
    const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id=?').all(user_id);
    for (const s of subs) if (await sendPush(s, payload)) sent++;
  }
  console.log(`daily reminder: ${sent} notification(s) sent to ${users.length} user(s)`);
}

// Checked every 30s; app_state remembers the last day sent so a restart never sends twice.
// Only fires within an hour of REMINDER_TIME, so a server that was down at noon stays quiet.
const [remH, remM] = REMINDER_TIME.split(':').map(Number);
setInterval(() => {
  const p = tzParts(new Date());
  const today = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
  const mins = p.h * 60 + p.mi - (remH * 60 + remM);
  if (mins < 0 || mins >= 60) return;
  const last = db.prepare("SELECT value FROM app_state WHERE key='last_reminder_day'").get();
  if (last && last.value === today) return;
  db.prepare("INSERT INTO app_state (key, value) VALUES ('last_reminder_day', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(today);
  sendDailyReminders().catch(e => console.error('daily reminder failed', e));
}, 30 * 1000);

app.get('/api/push/key', (req, res) => res.json({ publicKey: vapid.publicKey, time: REMINDER_TIME }));

app.post('/api/push/subscribe', auth, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !/^https:\/\//.test(endpoint) || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Abonim i pavlefshëm' });
  }
  db.prepare(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth`)
    .run(req.userId, endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

app.post('/api/push/unsubscribe', auth, (req, res) => {
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?').run(req.body?.endpoint || '', req.userId);
  res.json({ ok: true });
});

app.post('/api/push/test', auth, async (req, res) => {
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id=?').all(req.userId);
  if (!subs.length) return res.status(400).json({ error: 'Njoftimet nuk janë aktivizuar në këtë pajisje' });
  const payload = reminderFor(req.userId) || {
    title: 'foto360', body: `Njoftimet punojnë. Rikujtimi vjen çdo ditë në ${REMINDER_TIME}.`, url: '/dashboard', tag: 'foto360-test'
  };
  let sent = 0;
  for (const s of subs) if (await sendPush(s, payload)) sent++;
  res.json({ sent });
});

// ---------- Timelapse (ffmpeg) ----------
const MONTHS_SQ = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
function formatOverlay(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd} ${MONTHS_SQ[d.getMonth()]} ${d.getFullYear()}, ${hh}\\:${mi}`;
}
function escapeDrawtext(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
}
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function buildTimelapse(timelapseId, locationId, photos) {
  const tmpDir = path.join(UPLOAD_VIDEOS, `tmp-${timelapseId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const setProgress = (p) => db.prepare('UPDATE timelapses SET progress=? WHERE id=?').run(p, timelapseId);
  try {
    // Per-photo overlay+resize runs with a few ffmpeg processes in parallel (each
    // frame is independent) instead of one-by-one — matters once someone generates
    // a month/year timelapse with hundreds of photos instead of just a handful.
    // Frames contribute the first 90% of progress, the final concat/encode pass the rest.
    let completed = 0;
    await mapWithConcurrency(photos, 4, async (photo, idx) => {
      const src = path.join(UPLOAD_PHOTOS, photo.filename);
      const dst = path.join(tmpDir, `frame-${String(idx + 1).padStart(5, '0')}.jpg`);
      let vf = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black';
      if (photo.captured_at) {
        const label = escapeDrawtext(formatOverlay(photo.captured_at));
        vf += `,drawtext=text='${label}':x=w-tw-24:y=h-th-24:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10`;
      }
      await run('ffmpeg', ['-y', '-i', src, '-vf', vf, dst]);
      completed += 1;
      setProgress(Math.round((completed / photos.length) * 90));
    });
    const outFile = `timelapse-${timelapseId}.mp4`;
    const outPath = path.join(UPLOAD_VIDEOS, outFile);
    await run('ffmpeg', [
      '-y', '-framerate', '1.25', '-i', path.join(tmpDir, 'frame-%05d.jpg'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'fps=25', outPath
    ]);
    db.prepare('UPDATE timelapses SET status=?, video_path=?, photo_count=?, progress=100 WHERE id=?')
      .run('done', outFile, photos.length, timelapseId);
  } catch (e) {
    console.error('timelapse error', e.message);
    db.prepare('UPDATE timelapses SET status=? WHERE id=?').run('failed', timelapseId);
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
}

app.post('/api/locations/:id/timelapse', auth, (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  const { date_from, date_to } = req.body;
  if (!date_from || !date_to) return res.status(400).json({ error: 'Zgjedh datat nga-deri' });
  const photos = db.prepare(`
    SELECT * FROM photos WHERE location_id=?
    AND date(COALESCE(captured_at, created_at)) >= date(?)
    AND date(COALESCE(captured_at, created_at)) <= date(?)
    ORDER BY COALESCE(captured_at, created_at) ASC, id ASC
  `).all(loc.id, date_from, date_to);
  if (photos.length < 2) return res.status(400).json({ error: 'Duhen të paktën 2 foto në këtë periudhë' });
  const info = db.prepare(
    'INSERT INTO timelapses (location_id, date_from, date_to, status) VALUES (?, ?, ?, ?)'
  ).run(loc.id, date_from, date_to, 'processing');
  buildTimelapse(info.lastInsertRowid, loc.id, photos);
  res.json({ timelapse: db.prepare('SELECT * FROM timelapses WHERE id=?').get(info.lastInsertRowid) });
});

app.get('/api/locations/:id/timelapses', auth, (req, res) => {
  const loc = ownsLocation(req.params.id, req.userId);
  if (!loc) return res.status(404).json({ error: 'Nuk u gjet' });
  res.json({ timelapses: db.prepare('SELECT * FROM timelapses WHERE location_id=? ORDER BY id DESC').all(loc.id) });
});

app.get('/api/timelapses/:id', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM timelapses WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Nuk u gjet' });
  const loc = ownsLocation(t.location_id, req.userId);
  if (!loc) return res.status(403).json({ error: 'Ndaluar' });
  res.json({ timelapse: t });
});

// ---------- Admin ----------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admin_users WHERE username=?').get(username);
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).json({ error: 'Kredencialet e gabuara' });
  }
  const token = signToken({ id: admin.id, role: 'admin' });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

app.get('/api/admin/me', adminAuth, (req, res) => {
  const admin = db.prepare('SELECT id, username FROM admin_users WHERE id=?').get(req.adminId);
  res.json({ admin });
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const fullUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE access_tier='full'").get().c;
  const limitedUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE access_tier='limited'").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) c FROM orders WHERE status='pending'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM orders WHERE status='confirmed'").get().s;
  const locations = db.prepare('SELECT COUNT(*) c FROM locations').get().c;
  const photos = db.prepare('SELECT COUNT(*) c FROM photos').get().c;
  res.json({ users, fullUsers, limitedUsers, pendingOrders, revenue, locations, photos });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, (SELECT COUNT(*) FROM locations l WHERE l.user_id=u.id) as location_count
    FROM users u ORDER BY u.id DESC
  `).all();
  res.json({ users });
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
  const status = req.query.status;
  let sql = `
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o JOIN users u ON u.id=o.user_id
  `;
  const params = [];
  if (status) { sql += ' WHERE o.status=?'; params.push(status); }
  sql += ' ORDER BY o.id DESC';
  res.json({ orders: db.prepare(sql).all(...params) });
});

app.put('/api/admin/orders/:id', adminAuth, (req, res) => {
  const { decision } = req.body; // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'Vendim i pavlefshëm' });
  const order = applyOrderDecision(req.params.id, decision === 'approve');
  if (!order) return res.status(400).json({ error: 'Porosia nuk mund të përpunohet (mund të jetë përpunuar tashmë)' });
  res.json({ order: db.prepare('SELECT * FROM orders WHERE id=?').get(order.id) });
});

// ---------- Static frontend ----------
const FRONTEND_DIR = path.join(__dirname, 'frontend');
if (fs.existsSync(FRONTEND_DIR)) {
  express.static.mime.define({ 'application/manifest+json': ['webmanifest'] });
  app.use(express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      const rel = path.relative(FRONTEND_DIR, filePath);
      if (rel.startsWith('assets' + path.sep)) {
        // Vite fingerprints these, so they never change under the same name.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/^(sw\.js|index\.html|manifest\.webmanifest)$/.test(rel)) {
        // Must revalidate so new deploys (and new service workers) reach installed apps.
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`foto360 running on :${PORT}`));
