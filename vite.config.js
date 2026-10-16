import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Serves the Netlify stats function at /api/stats during `npm run dev` and `npm run preview`,
// so live coding stats work locally too. On Netlify the real function answers this path.
function localStatsApi() {
  const handle = async (req, res, next) => {
    if (!req.url?.startsWith("/api/stats")) return next();
    try {
      const { default: stats } = await import("./netlify/functions/stats.mjs");
      const out = await stats();
      res.setHeader("Content-Type", "application/json");
      res.end(await out.text());
    } catch (e) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: String(e) }));
    }
  };
  return {
    name: "local-stats-api",
    // Block bodies on purpose: Vite treats a function returned from these hooks as a post-hook.
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig({
  plugins: [react(), localStatsApi()],
});
