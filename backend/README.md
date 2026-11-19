# Portfolio backend

The API behind [guruprasadgp.netlify.app](https://guruprasadgp.netlify.app): Spring Boot microservices behind one
API gateway, registered with Eureka, storing everything in MongoDB Atlas. The React site (in the repo root) calls
`/api/...` on its own address; Netlify forwards those requests to this backend.

```
Browser ── Netlify (site + /api proxy) ── Caddy (HTTPS) ── api-gateway ──┬── auth-service      admin sign-in, sessions
                                                                          ├── content-service   page sections, /api/content
                                                                          ├── learning-service  courses, YouTube lessons
                                                                          ├── coding-service    live stats from 11 platforms
                                                                          ├── contest-service   contests added by hand
                                                                          ├── media-service     uploaded images
                                                                          └── chat-service      "Ask GP" chatbot
                                              discovery-server (Eureka): every service registers, the gateway finds them by name
                                              MongoDB Atlas: one database, each service owns its collections
```

| Service | Owns (MongoDB collections) | Public API | Admin API |
|---|---|---|---|
| api-gateway | — | the only entry point | session check, CSRF, rate limits |
| auth-service | `admins`, `sessions` | `POST /api/admin/login`, `/logout` | `GET /api/admin/me`, `POST /api/admin/password` |
| content-service | `sections`, `meta` | `GET /api/content` | `GET /api/admin/data`, `PUT/DELETE /api/admin/sections/{KEY}` |
| learning-service | `learning` | `GET /api/playlists` | `POST /api/admin/learning`, `/import`, `PUT/DELETE /api/admin/learning/{id}` |
| coding-service | `coding`, `live` | `GET /api/stats` | `PUT/DELETE /api/admin/coding/{platform}` |
| contest-service | `contests` | — | `POST /api/admin/contests`, `PUT/DELETE /api/admin/contests/{id}` |
| media-service | `images` | `GET /api/img/{id}` | `GET/POST /api/admin/images`, `DELETE /api/admin/images/{id}` |
| chat-service | — | `POST /api/chat` | — |

Each service is layered the same way: `controller` → `service` → `repository` → `entity`, with input checks in
`validation`. `common/` holds what every service shares (internal-request check, admin check, JSON errors,
service-to-service client).

## Security

Defence in depth: each layer assumes the one in front of it could fail.

**Gateway (the only public part)**
- **Allow-list:** every method + path the site uses is listed in `AccessRules`. Anything else is answered `404`
  before it reaches a service, including `/api/internal/**`, actuator endpoints, encoded slashes and `..` tricks.
- **Header stripping:** removes `X-Admin-User`, `X-Internal-Token` and `X-Client-Ip` from every request and sets
  them itself, so a visitor can't pretend to be the admin or another service.
- **Rate limits per visitor:** 10 sign-in attempts per 15 min (and 60 from everyone together), 30 chatbot questions
  per 10 min, 240 public requests and 300 admin requests a minute.
- **Request size:** every body must declare its length, within the route's limit (4 KB for sign-in, 512 KB for a
  section, 6 MB for an image).
- **CSRF:** writes need the site's own `Origin`, a `same-origin` `Sec-Fetch-Site`, and for admin writes the
  `X-GP-Admin` header, which another site can't send. The cookie is also `SameSite=Strict`.
- **Response headers:** HSTS, `nosniff`, `X-Frame-Options: DENY`, a locked-down CSP and no-referrer on every
  response; the admin API is never cached.

**Admin sign-in (auth-service)**
- **Passwords:** scrypt hashes (N = 16384), never stored as text.
- **No user probing:** a wrong username and a wrong password get the same answer and take the same time.
- **Lockout:** 5 wrong passwords lock sign-in for 15 minutes.
- **Sessions live on the server.** The cookie is an HS256-signed JWT (`HttpOnly; Secure; SameSite=Strict`,
  `Path=/api/admin`, 12 hours) pointing to a session record. Signing out or changing the password deletes the record,
  so a copied cookie stops working at once.
- **Two-step check:** the gateway checks the JWT (signature, expiry, issuer, audience), then asks auth-service whether
  the session still exists. Tampered tokens, `alg: none` and tokens signed with another secret are all refused.

**Services**
- **Internal token:** each service only answers requests carrying it (the gateway and the other services add it).
  Anything else gets a `404`, even on the private network.
- **Admin check:** admin endpoints also require the `X-Admin-User` the gateway set.
- **Input checks:** only known fields are stored; numbers, dates and links are checked.
- **Section content:** must be plain JSON. These are refused: `$` operators, `__proto__` / `constructor`,
  `javascript:` / `vbscript:` / `data:text/html` links (even with hidden characters), more than 8 levels of nesting,
  over 300 KB.
- **Images:** recognised by their bytes, WebP or JPEG only; SVG and HTML are refused. Served with
  `Content-Security-Policy: sandbox` and `nosniff`.
- **Errors:** come back as `{"error": "..."}`, with no stack traces, versions or server names.

**Containers**
- **Least privilege:** each container runs as a non-root user with a read-only filesystem, no Linux capabilities and
  `no-new-privileges`.
- **Exposure:** only Caddy publishes ports (80/443, automatic HTTPS). Everything else stays on the private network.

## Run locally

Needs Java 21+ and Maven, and a MongoDB (Atlas, or a local one).

```bash
cd backend
mvn -B package                      # builds every service and runs the tests
export MONGODB_URI=... MONGODB_DB=portfolio
export SESSION_SECRET=$(openssl rand -base64 48) INTERNAL_TOKEN=$(openssl rand -base64 48)
export ALLOWED_ORIGINS='^http://localhost:5173$'
java -jar discovery-server/target/app-exec.jar &
for s in auth content learning coding contest media chat; do java -jar $s-service/target/app-exec.jar & done
java -jar api-gateway/target/app-exec.jar &
cd .. && BACKEND_URL=http://localhost:8080 npm run dev   # the site, using this backend
```

The admin user is created with the same script as before: `npm run admin:user`. Its password hashes work in both the
old Node API and this backend.

## Deploy (one server, Docker Compose)

Any VPS with 2 GB of memory (Hetzner, DigitalOcean, AWS Lightsail, Oracle Cloud's free tier…):

1. **Point the domain:** add an A record for the API domain (e.g. `api.yourdomain.com`) pointing at the server.
2. **Allow the server in Atlas:** MongoDB Atlas → Network Access → add the server's IP.
3. **Configure and start:** on the server, run
   `git clone …; cd backend; cp .env.example .env`, fill in `.env` (make each secret with
   `openssl rand -base64 48`), then `docker compose up -d --build`.
4. **Check it:** `curl https://api.yourdomain.com/api/content` should answer.
5. **Switch the site over:** in the repo, delete `netlify/functions/`, uncomment the `/api/*` redirect at the bottom
   of `netlify.toml` with your API domain, and push.

After editing `src/data.js` or `src/chat/notes.js`, run `npm run backend:knowledge` so the chatbot knows the changes.

## Render (free plan): every service in one process

Render's free plan gives one 512 MB machine, too small for nine JVMs. The `all-in-one` module runs the same services in
one process instead (gateway on Render's port; the services on `127.0.0.1` only; no Eureka, each service at a fixed
local port; chat only with `ANTHROPIC_API_KEY`). It uses about 300 MB. `render.yaml` at the repo root sets it up:

1. Push the repo to GitHub.
2. MongoDB Atlas → Network Access → add `0.0.0.0/0` (Render's free plan has no fixed address). The database password
   is what protects it, so use a long random one.
3. Render → New → Blueprint → pick the repo. Fill in `MONGODB_URI` and `YOUTUBE_API_KEY` when asked; the two secrets
   are generated by Render.
4. When it shows Live: `curl https://portfolio-api.onrender.com/api/content`.
5. Try the site against it: `BACKEND_URL=https://portfolio-api.onrender.com npm run dev`.

Free services sleep after 15 minutes without traffic and take a minute or two to wake. Free hours (750 a month) are
shared by every free service in the Render workspace.

Run the all-in-one build locally: `java -jar all-in-one/target/app-exec.jar` (same environment variables as above,
gateway on `$PORT`, default 8080).
