# Guruprasad · Developer Portfolio

Personal portfolio of **Guruprasad**, a full stack developer (Java · Spring Boot · Python · React.js) based in Bengaluru.

**Live site:** [guruprasadgp.netlify.app](https://guruprasadgp.netlify.app)

<p>
  <img src="docs/preview-desktop.jpg" alt="Portfolio on desktop: profile sidebar and the Projects page" width="72%">
  <img src="docs/preview-mobile.jpg" alt="Portfolio on a phone: Coding page with live LeetCode and GFG stats" width="24%">
</p>

## Highlights

**Pages:** About · Experience · Education · Journey · Skills · Projects · Coding · Contact, in a sidebar-and-card layout. On phones the tabs move to a bottom bar.

**Motion that feels native (iOS / OxygenOS style)**
- One spring-physics setting (Framer Motion) drives tabs, cards, sheets and dialogs, so everything moves with the same weight.
- **Projects showcase:** each project appears in a tablet and phone mockup, with a numbered thumbnail strip (number pills on phones), arrow buttons, ← → keys and swipe to move between them. Below the mockup are the title, highlight numbers, Live / Code buttons and a case study that grows out of the mockup. Drag down to close it.
- A soft highlight glides behind the active tab, buttons sink to 96% when pressed, and Android phones get a small haptic tick.
- On phones: swipe left or right to change tabs, and contacts open in a draggable bottom sheet.
- Stats roll into place like an odometer.
- Jitter-style scroll effects: the About text lights up word by word as you scroll, and Experience roles pile up as stacked cards that shrink back as the next one slides over.

**Retro touches**
- A BIOS-style boot screen you can replay from the command palette (it never delays the first visit), and an "old TV" channel change between pages.
- Page titles that decode with a glitch effect, CRT scanlines and film grain, a split-flap board for exam scores, and LED meters for skills.

**Personal touches**
- Tech logos orbit the profile photo on two rings, and speed up when you hover over or tap them.
- An animated map draws the route from school in Udupi to college in Moodabidri to work in Bengaluru.
- A "two truths and a lie" game and a "say hello in Tulu" button on the About page.

**Useful features**
- **GP Assistant (AI chatbot):** a floating "Ask GP" button opens a chat that answers recruiters' questions from the portfolio's own content, cites the section each answer came from, and says "I don't know" instead of guessing. A **Match a job** tab scores a pasted job description against the profile (matched and missing skills, most relevant projects, and a pitch to paste into notes). See [GP Assistant](#gp-assistant-chatbot).
- **Live coding stats:** LeetCode, GeeksforGeeks and Code360 numbers load automatically, plus a **contributions carousel**: slides sit side by side and snap one at a time. Swipe, trackpad-scroll, use the ‹ › buttons or arrow keys, or tap the toggles for **All, LeetCode, GFG, GitHub, Code360, HackerRank, NeetCode, HackerEarth and InterviewBit**. Each platform slide covers the last 12 months (on phones the grid shows the most recent months that fit, while the stats still cover the full year) in that platform's colour, with month labels, day-by-day hover details, active days and longest and current streaks. **All** adds everything together and shows a side-by-side stats table for every platform (see [Live coding stats](#live-coding-stats)).
- **Case studies** for the main projects: the problem, an architecture diagram, what was hard, and where it stands.
- **Interactive system design:** in the FlightWise AI case study, tap any box (gateway, Eureka, each service, PostgreSQL, Docker) to see what it does and why it was chosen.
- **Command palette:** press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> to jump to any page, copy the email, download the resume, switch theme or replay the boot screen.
- **Recruiter quick view:** a one-screen summary of target roles, top skills, experience and contact buttons.
- **Light and dark themes:** the new theme spreads out in a circle from the toggle button and is remembered between visits.

**Accessibility:** every animation turns into a short fade when the visitor's device is set to reduce motion. Everything also works with the keyboard (Tab, Enter, Esc).

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 18, Vite 5, plain CSS (custom properties for theming) |
| Motion | Framer Motion (springs, shared layout), Lenis (smooth scrolling), View Transitions API |
| Data | Netlify Functions: live coding stats (cached on Netlify's CDN) and the chatbot |
| AI | Claude API (Anthropic), called only from the server |
| Hosting | Netlify, deployed automatically from `main` |

## Run it locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/guruprasadgp22/portfolio.git
cd portfolio
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the built site at http://localhost:4173 |

Live coding stats and the chatbot also work locally: Vite serves the same functions at `/api/stats` and `/api/chat` (see `vite.config.js`).

## Updating the content

All text, numbers and links live in **[`src/data.js`](src/data.js)**, so you rarely need to touch the components. Lines marked `TODO` still need real details.

| To change | Edit in `src/data.js` |
| --- | --- |
| Name, roles, email, phone, location, social links, recruiter quick-view details | `ME` |
| Bio, stats, terminal lines, languages, Tulu phrase, orbiting tech, "two truths and a lie", interest cards | `ABOUT` |
| Jobs and internships (stacked-card summary, tech and lifecycle flow, full details) | `EXPERIENCE` |
| Degrees and school results | `EDUCATION` |
| Certificates (add `url` to show a **Verify** link) | `CERTIFICATIONS` |
| Timeline and route map on the Journey page | `JOURNEY`, `JOURNEY_MAP` |
| Skill groups and their LED meter levels | `SKILLS` |
| Projects: repo and demo links, cover images (`img`, optional `phone` screenshot), highlight numbers (`stats`), case-study screenshot strip (`shots`), case studies, system-design notes | `PROJECTS` |
| Coding profiles (saved numbers and profile links) | `PLATFORMS` |
| "What I'm doing" cards | `DOING` |
| Navbar tabs | `NAV` |

**Files in `public/`:**
- `me.jpg`: profile photo
- `Guruprasad_P_updated.pdf`: resume. If you rename it, update the `Resume` link in `ME.socials`.
- `og.jpg`: the 1200×630 preview image shown when the link is shared (LinkedIn, WhatsApp, X).
- `projects/*.svg`: project cover art. Swap in real screenshots (PNG/JPG) and point the project's `img` at them.

**Colours and fonts** are CSS variables at the top of [`src/styles/global.css`](src/styles/global.css): `:root` holds the dark theme and `:root[data-theme="light"]` the light one.

## Live coding stats

[`netlify/functions/stats.mjs`](netlify/functions/stats.mjs) answers `GET /api/stats`. On the server it fetches:

- **LeetCode:** problems solved by difficulty, contest rating, max streak and the daily submission calendar (GraphQL)
- **GeeksforGeeks:** problems solved, coding score, institute rank, and submissions per day for this year and last
- **GitHub:** contributions per day, read from the public contribution graph (`github.com/users/<name>/contributions`, no token needed)
- **Code360:** problems solved by difficulty, and submissions per day (streak-freeze days aren't counted as activity)
- **HackerRank (both accounts, added together):** challenges solved, best star rating per skill, passed certificates and submissions per day
- **HackerEarth:** problems solved, submissions, points, best leaderboard rank and submissions per day
- **NeetCode:** solved by difficulty, streaks, percentile and activity per day (the same public call the NeetCode profile page makes)
- **InterviewBit:** problems solved, score, university rank, current streak and submissions per day (the profile must be set to public)

The response is cached on Netlify's CDN for 6 hours. If a source is down, that card falls back to the numbers saved in `PLATFORMS`, so the page never breaks. To track a different account, change `USERS` at the top of the function. If a calendar fails to load, that platform's map is simply left out.

## GP Assistant (chatbot)

The browser talks only to [`netlify/functions/chat.mjs`](netlify/functions/chat.mjs) at `POST /api/chat`. That function adds the knowledge sheet and calls the Claude API, so **the API key never reaches the browser**.

**What it knows.** [`src/chat/knowledge.js`](src/chat/knowledge.js) builds one knowledge sheet from everything in `src/data.js`, plus your own notes in [`src/chat/notes.js`](src/chat/notes.js) (plain Markdown: availability, interview notes, fun facts). It answers only from that sheet, so to teach it something, add it there. No other code changes are needed.

**Turning on the AI**
1. Create an API key at [console.anthropic.com](https://console.anthropic.com) and **set a monthly spend limit** there. That limit is the hard stop on cost.
2. In Netlify: *Site configuration → Environment variables*, add `ANTHROPIC_API_KEY`. Optionally add `CHAT_MODEL` (default `claude-sonnet-5-5`; `claude-haiku-5-5` is cheaper).
3. Redeploy. To try it locally, put the same `ANTHROPIC_API_KEY=...` line in a `.env` file (git-ignored) and run `npm run dev`.

**Without a key, or if the API is down,** the bot switches to offline mode: it answers common questions straight from `data.js` ([`src/chat/offline.js`](src/chat/offline.js)), and the job matcher falls back to keyword matching.

**Built-in limits:**
- Questions are capped at 600 characters and job descriptions at 6,000.
- Only the last 10 messages are sent as context.
- Answers are capped at 600 tokens.
- Each visitor gets 20 questions and 5 job matches per 10 minutes. This limit is kept in memory, so it is best-effort.
- Requests from other websites are refused.
- Visitor text is wrapped and treated as data, so it can't change the bot's rules.
- The system prompt is cached to cut cost.

## Project structure

```
├── netlify/functions/stats.mjs   Live coding stats (Netlify Function)
├── netlify/functions/chat.mjs    GP Assistant: Claude API proxy with limits (Netlify Function)
├── netlify.toml                  Build command, publish folder, functions folder
├── public/                       Photo, resume, project covers, favicon
├── src/
│   ├── data.js                   All site content
│   ├── App.jsx                   Layout, page switching, swipe gestures, channel-change transition
│   ├── main.jsx                  Entry point, theme class, haptic feedback
│   ├── socials.js                Social link helpers
│   ├── chat/                     knowledge.js (what the bot knows), notes.js (your extra notes), offline.js (fallback answers, job matcher)
│   ├── styles/global.css         Theme tokens, layout, breakpoints, animations
│   ├── hooks/                    spring.js, theme.js, useStats.js, useSmoothScroll.js, useInView.js, motion.js
│   └── components/
│       ├── Sidebar.jsx, Avatar.jsx, Navbar.jsx, Overlays.jsx, Boot.jsx, Chat.jsx   Shell, overlays and chatbot
│       ├── About, Experience, Education, Journey, Skills, Projects, Coding, Contact (.jsx)   Pages
│       └── ProjectDetail, Timeline, Glitch, SplitFlap, LedMeter, Odometer, Reveal, ScrollWords,
│           TechOrbit, TwoTruths, JourneyMap, Icons (.jsx)   Building blocks
└── vite.config.js                React plugin and local /api/stats
```

## Deployment

The site is hosted on Netlify and linked to this repository. Every push to `main` builds (`npm run build`), publishes `dist/` and deploys both functions. The only environment variable is the optional `ANTHROPIC_API_KEY` for the chatbot.

To host your own copy, create a site on Netlify from this repo. `netlify.toml` already has the right settings.

## Credits

- Layout inspired by the [vCard personal portfolio](https://github.com/codewithsadee/vcard-personal-portfolio) template by codewithsadee.
- Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Manrope](https://fonts.google.com/specimen/Manrope), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) and [VT323](https://fonts.google.com/specimen/VT323) from Google Fonts.

## Contact

**Guruprasad** · [guruprasad6200@gmail.com](mailto:guruprasad6200@gmail.com) · [LinkedIn](https://www.linkedin.com/in/guruprasadgp22/) · [GitHub](https://github.com/guruprasadgp22)
