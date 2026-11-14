import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/*
  Login for the one admin user.
  - Passwords are stored as scrypt hashes ("scrypt$N$salt$hash"), never as text.
  - A successful login sets an HttpOnly, Secure, SameSite=Strict cookie holding a signed token
    (HMAC-SHA256 with ADMIN_SECRET) that expires after 12 hours. Changing the password (re-running
    `npm run admin:user`) bumps the user's version, which signs out every existing session.
*/
const scrypt = promisify(_scrypt);
const N = 16384, KEYLEN = 64;
export const COOKIE = "gp_admin";
export const SESSION_HOURS = 12;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N });
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [kind, n, salt, hash] = String(stored || "").split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64");
  const got = await scrypt(password, Buffer.from(salt, "base64"), want.length, { N: Number(n) });
  return timingSafeEqual(got, want);
}

// A hash to check against when the username is wrong, so both cases take the same time.
export const DUMMY_HASH = "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(KEYLEN).toString("base64");

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SECRET must be set to at least 32 characters");
  return s;
}
const b64 = (s) => Buffer.from(s).toString("base64url");
const mac = (data) => createHmac("sha256", secret()).update(data).digest("base64url");

export function signToken(user, version) {
  const body = b64(JSON.stringify({ u: user, v: version, exp: Date.now() + SESSION_HOURS * 3600e3 }));
  return `${body}.${mac(body)}`;
}

export function readToken(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(mac(body)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export function getCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export const sessionCookie = (token) =>
  `${COOKIE}=${encodeURIComponent(token)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
export const clearCookie = () => `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
