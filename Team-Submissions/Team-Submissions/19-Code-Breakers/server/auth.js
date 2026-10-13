import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

const deriveKey = promisify(scrypt);
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email });
const cookieName = 'localroute_session';
function readToken(req) {
  const value = (req.headers.cookie || '')
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function createAuth(config) {
  const path =
    config.AUTH_DB_PATH === ':memory:'
      ? ':memory:'
      : resolve(config.AUTH_DB_PATH || './data/localroute.sqlite');
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
  `);
  const router = Router();
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production' || config.SESSION_COOKIE_SECURE === 'true',
    path: '/',
  };
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
  });
  function newSession(req, res, user) {
    const oldToken = readToken(req);
    if (oldToken) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(oldToken));
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(
      hashToken(token),
      user.id,
      Date.now() + sessionLifetime,
    );
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionLifetime });
    return publicUser(user);
  }
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/me', (req, res) => {
    const token = readToken(req);
    const user = token
      ? db
          .prepare(
            'SELECT users.id, users.name, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?',
          )
          .get(hashToken(token), Date.now())
      : null;
    res.json({ user: user ? publicUser(user) : null });
  });
  router.post('/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body || {};
    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      name.trim().length > 60 ||
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 10 ||
      password.length > 128
    ) {
      return res
        .status(400)
        .json({
          error:
            'Use a name of 2–60 characters, a valid email, and a password of 10–128 characters.',
        });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const salt = randomBytes(16).toString('hex');
    const passwordHash = (await deriveKey(password, salt, 64)).toString('hex');
    const user = { id: randomUUID(), name: name.trim(), email: normalizedEmail };
    try {
      // Parameterized statements keep user-supplied values out of the SQL grammar.
      db.prepare(
        'INSERT INTO users (id,name,email,password_hash,salt,created_at) VALUES (?,?,?,?,?,?)',
      ).run(user.id, user.name, user.email, passwordHash, salt, Date.now());
    } catch (error) {
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail))
        return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
      throw error;
    }
    res.status(201).json({ user: newSession(req, res, user) });
  });
  router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      typeof password !== 'string' ||
      password.length > 128 ||
      !password.length
    )
      return res.status(400).json({ error: 'Enter your email and password.' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    // Perform the same expensive hash for unknown accounts to reduce timing differences.
    const candidate = await deriveKey(
      password,
      user?.salt || '00000000000000000000000000000000',
      64,
    );
    const expected = user ? Buffer.from(user.password_hash, 'hex') : Buffer.alloc(64);
    if (!user || !timingSafeEqual(candidate, expected))
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    res.json({ user: newSession(req, res, user) });
  });
  router.post('/logout', (req, res) => {
    const token = readToken(req);
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  return { router, close: () => db.close() };
}
