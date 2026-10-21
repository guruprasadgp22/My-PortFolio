import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Serves the Netlify functions at /api/stats and /api/chat during `npm run dev` and `npm run preview`,
// so live coding stats and the chatbot work locally too. On Netlify the real functions answer these paths.
// For the chatbot, put ANTHROPIC_API_KEY=... in a .env file (it's git-ignored); without it the bot runs offline.
const FUNCTIONS = { "/api/stats": "./netlify/functions/stats.mjs", "/api/chat": "./netlify/functions/chat.mjs" };

function localFunctions() {
  const handle = async (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (!FUNCTIONS[path]) return next();
    try {
      // Node caches imported modules, so add the file's modified time to the URL: an edited function
      // is picked up straight away instead of needing a dev-server restart.
      const file = resolve(FUNCTIONS[path]);
      const { default: fn } = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
      });
      const out = await fn(request, { ip: req.socket.remoteAddress });
      res.statusCode = out.status;
      out.headers.forEach((v, k) => res.setHeader(k, v));
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

export default defineConfig(({ mode }) => {
  // expose the chatbot's server-side settings from .env to the local functions (never to the browser bundle)
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of ["ANTHROPIC_API_KEY", "CHAT_MODEL", "ANTHROPIC_BASE_URL"]) if (env[k] && !process.env[k]) process.env[k] = env[k];
  // build date, shown as "Last updated" in the footer (each Netlify deploy is a fresh build)
  return { plugins: [react(), localFunctions()], define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) } };
});
