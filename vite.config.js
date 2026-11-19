import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// With BACKEND_URL set, /api is sent to the Java backend (backend/, Spring Boot gateway) instead.
// Otherwise serves the Netlify functions during `npm run dev` and `npm run preview`, so live stats, the chatbot, the
// database content and the admin page (#admin) work locally too. On Netlify the real functions answer these paths.
// Settings come from the git-ignored .env: ANTHROPIC_API_KEY for the chatbot, MONGODB_URI + ADMIN_SECRET for the database,
// YOUTUBE_API_KEY for the Learning page's lesson lists.
const FUNCTIONS = {
  "/api/stats": "./netlify/functions/stats.mjs",
  "/api/chat": "./netlify/functions/chat.mjs",
  "/api/content": "./netlify/functions/content.mjs",
  "/api/playlists": "./netlify/functions/playlists.mjs",
  "/api/admin": "./netlify/functions/admin.mjs", // and everything under /api/admin/
  "/api/img": "./netlify/functions/img.mjs", // uploaded images: /api/img/<id>
};
const fileFor = (path) =>
  FUNCTIONS[path] || (path?.startsWith("/api/admin/") ? FUNCTIONS["/api/admin"] : path?.startsWith("/api/img/") ? FUNCTIONS["/api/img"] : null);

function localFunctions() {
  const handle = async (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (!fileFor(path)) return next();
    try {
      // Node caches imported modules, so add the file's modified time to the URL: an edited function
      // is picked up straight away instead of needing a dev-server restart.
      const file = resolve(fileFor(path));
      const { default: fn } = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
      const chunks = [];
      for await (const c of req) chunks.push(c);
      // keep the real host and port, so the admin API's same-site check matches the page's origin
      const request = new Request(`http://${req.headers.host || "localhost"}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
      });
      const out = await fn(request, { ip: req.socket.remoteAddress });
      res.statusCode = out.status;
      out.headers.forEach((v, k) => k !== "set-cookie" && res.setHeader(k, v));
      const cookies = out.headers.getSetCookie?.() || [];
      if (cookies.length) res.setHeader("set-cookie", cookies); // the admin login cookie
      if (!out.body) return res.end();
      // stream the body through, so chat answers appear word by word like they do on Netlify
      for await (const chunk of out.body) res.write(chunk);
      res.end();
    } catch (e) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: String(e) }));
    }
  };
  return {
    name: "local-functions",
    // Block bodies on purpose: Vite treats a function returned from these hooks as a post-hook.
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

/*
  Security headers for the site (Netlify reads dist/_headers). The Content-Security-Policy only lets the page run its
  own scripts (plus the one inline theme script, allowed by its hash, recomputed on every build), load fonts from
  Google Fonts, badge images from LeetCode / Code360, the Google Maps embed on Contact, and call this site's own /api.
  An injected <script> or a link to a script elsewhere simply doesn't run. `vite preview` sends the same headers.
*/
function securityHeaders() {
  const csp = (html) => {
    const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
    return [
      "default-src 'self'",
      `script-src 'self' ${hashes.join(" ")}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://assets.leetcode.com https://leetcode.com https://files.codingninjas.in https://i.ytimg.com",
      "connect-src 'self' https://job-board-6ev5.onrender.com",
      "frame-src https://maps.google.com https://www.google.com",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
  };
  const headers = (html) => ({
    "Content-Security-Policy": csp(html),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  });
  return {
    name: "security-headers",
    closeBundle() {
      const html = readFileSync(resolve("dist/index.html"), "utf8");
      const lines = Object.entries(headers(html)).map(([k, v]) => `  ${k}: ${v}`);
      writeFileSync(resolve("dist/_headers"), `/*\n${lines.join("\n")}\n`);
    },
    configurePreviewServer(server) {
      const h = headers(readFileSync(resolve("dist/index.html"), "utf8"));
      server.middlewares.use((req, res, next) => {
        for (const [k, v] of Object.entries(h)) if (k !== "Strict-Transport-Security") res.setHeader(k, v.replace("; upgrade-insecure-requests", ""));
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // expose the server-side settings from .env to the local functions (never to the browser bundle)
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of ["ANTHROPIC_API_KEY", "CHAT_MODEL", "ANTHROPIC_BASE_URL", "MONGODB_URI", "MONGODB_DB", "ADMIN_SECRET", "YOUTUBE_API_KEY"]) if (env[k] && !process.env[k]) process.env[k] = env[k];
  // build date, shown as "Last updated" in the footer (each Netlify deploy is a fresh build)
  const define = { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) };
  // BACKEND_URL=http://localhost:8080 npm run dev  → /api goes to the Spring Boot gateway (backend/) instead
  // (or a hosted one: BACKEND_URL=https://portfolio-api.onrender.com npm run dev)
  const backend = process.env.BACKEND_URL || env.BACKEND_URL;
  if (backend) {
    // a hosted backend (e.g. https://portfolio-api.onrender.com) routes by host name, so send it its own
    const remote = !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(backend);
    const proxy = { "/api": { target: backend, changeOrigin: remote, secure: true, xfwd: !remote } };
    return { plugins: [react(), securityHeaders()], define, server: { proxy }, preview: { proxy } };
  }
  return { plugins: [react(), localFunctions(), securityHeaders()], define };
});
