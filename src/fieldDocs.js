/*
  Plain-English names and help for every field in the admin page's Pages editor.
  Keys are paths: "EXPERIENCE[].role" is the role of any job in the Experience list. [label, what it's for].
  TUPLES name the parts of small fixed lists, e.g. a stat is [number, what it counts].
*/
export const DOCS = {
  // the lists themselves (each section's top level)
  DOING: ["Service cards", "The \"What I'm doing\" cards on About. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  EXPERIENCE: ["Jobs", "Newest first. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  EDUCATION: ["Qualifications", "Newest first. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  CERTIFICATIONS: ["Certificates", "Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  JOURNEY: ["Timeline stops", "Oldest first; the last one should be \"Now\". Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  JOURNEY_MAP: ["Places on the map", "In the order you lived there; the route is drawn through them. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  SKILLS: ["Skill groups", "Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  PROJECTS: ["Projects", "The first ones are the showcase; tick \"Training project\" for smaller ones. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  PLATFORMS: ["Platforms", "Tiles on the Coding page. Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],
  FESTIVALS: ["Festivals", "Each shows a greeting pill at the bottom of the screen between its dates (visitors can close it). Click one to open it. ↑ ↓ set the order on the site, ⧉ copies it, ✕ removes it."],

  // ---------- Profile & contact ----------
  "ME.first": ["First name", "In capitals. Shown in the sidebar, the intro animation and the page title."],
  "ME.last": ["Last name", "In capitals. Joined to the first name in the sidebar (Guruprasad)."],
  "ME.initials": ["Initials", "Two letters, used in the intro animation and when the photo can't load."],
  "ME.roles": ["Job titles", "One per line. The first one is shown under your name in the sidebar."],
  "ME.headline": ["Headline", "Short tech summary. Not shown on the site at the moment."],
  "ME.lede": ["Intro sentence", "One sentence about you, used by the hero intro."],
  "ME.email": ["Email", "Shown in the sidebar and Contact page, and used by every \"Email me\" button."],
  "ME.phone": ["Phone", "Shown in the sidebar with a tap-to-call link. Leave empty to hide it."],
  "ME.website": ["Website", "Your site's address, shown in the sidebar contacts."],
  "ME.location": ["Location", "City and state. Shown in the sidebar, quick view and Contact page."],
  "ME.timeZone": ["Time zone", "Used for the \"It's 4:30 pm in Bengaluru\" clock on Contact. Keep Asia/Kolkata."],
  "ME.replyTime": ["Reply time", "Shown on the Contact page next to your local time."],
  "ME.lookingFor": ["Roles you're looking for", "One per line. Shown in the recruiter quick view."],
  "ME.availability": ["Availability", "One line, e.g. \"Available to join immediately\". Shown in the quick view."],
  "ME.hiring": ["Hiring facts", "One per line: the small pills under your photo (availability, location, role)."],
  "ME.topSkills": ["Top skills", "One per line. The skill chips in the recruiter quick view."],
  "ME.socials": ["Social links", "The buttons at the bottom of the sidebar (GitHub, LinkedIn, Resume…)."],
  "ME.socials[].label": ["Name", "Shown on the button. GitHub, LinkedIn, Instagram and Resume get their own icons."],
  "ME.socials[].url": ["Link", "Full address starting with https:// (or /file.pdf for a file on this site)."],
  "ME.resumes": ["Resume files", "Which resume the Resume buttons open."],
  "ME.resumes.default": ["Main resume", "Path or link to the resume most visitors get."],
  "ME.resumes.backend": ["Backend resume", "Optional. Given to visitors who came from a backend job link (?role=backend)."],

  // ---------- About ----------
  "ABOUT.photo": ["Profile photo", "Your photo in the sidebar and the tech orbit. Upload a square picture."],
  "ABOUT.bio": ["Bio, first paragraph", "The opening paragraph of the About page."],
  "ABOUT.bio2": ["Bio, second paragraph", "The paragraph after it: experience and what roles you want."],
  "ABOUT.facts": ["Number facts", "The big counters on About (companies, projects, problems solved…)."],
  "ABOUT.facts[].value": ["Number", "The number shown."],
  "ABOUT.facts[].suffix": ["After the number", "Optional, e.g. + or yr."],
  "ABOUT.facts[].label": ["Caption", "Words under the number, e.g. \"problems solved\"."],
  "ABOUT.facts[].live": ["Count automatically", "solved, projects or companies: the number is counted from the site's own data. Leave empty to show the number you typed."],
  "ABOUT.terminal": ["Terminal lines", "The typing terminal on About: each line is a command and what it prints."],
  "ABOUT.languages": ["Languages you speak", "The language bars on About."],
  "ABOUT.languages[].n": ["Language", "e.g. Kannada, English, Tulu."],
  "ABOUT.languages[].label": ["Level in words", "e.g. Native or bilingual, Professional working."],
  "ABOUT.languages[].lvl": ["Level 1–5", "How full the bar is: 5 is native."],
  "ABOUT.orbit": ["Tech orbit", "The rotating rings of tech around your photo: one group per ring (inner first)."],
  "ABOUT.orbit[][].n": ["Tech", "Name shown on the chip."],
  "ABOUT.orbit[][].c": ["Colour", "Dot colour as a hex code, e.g. #f89820 (the tech's brand colour)."],
  "ABOUT.tulu": ["Tulu phrase", "The \"Say hi in Tulu\" card on About."],
  "ABOUT.tulu.phrase": ["Phrase", "Written in English letters."],
  "ABOUT.tulu.say": ["How to say it", "Pronunciation guide, stressed part in capitals."],
  "ABOUT.tulu.means": ["Meaning", "What it means in English."],
  "ABOUT.truths": ["Two truths and a lie", "The game on About. Exactly one statement should be the lie."],
  "ABOUT.truths[].s": ["Statement", "What visitors see and guess on."],
  "ABOUT.truths[].why": ["Answer", "Shown after they guess: why it's true or false."],
  "ABOUT.truths[].lie": ["This one is the lie", "Tick for the false statement only."],
  "ABOUT.interests": ["Interests", "The flip cards at the bottom of About."],
  "ABOUT.interests[].icon": ["Emoji", "One emoji on the front of the card."],
  "ABOUT.interests[].title": ["Title", "Front of the card."],
  "ABOUT.interests[].tag": ["What it shows", "One word on the front, e.g. teamwork."],
  "ABOUT.interests[].back": ["Back of the card", "A sentence or two, shown when the card flips."],

  // ---------- What I'm doing ----------
  "DOING[].icon": ["Icon", "One of: server, code, brain, git, layers, globe, zap, book, briefcase."],
  "DOING[].t": ["Title", "e.g. Backend & APIs."],
  "DOING[].d": ["Description", "One or two lines about what you do in this area."],

  // ---------- Experience ----------
  "EXPERIENCE[].when": ["Dates", "e.g. Jun 2025 – Jun 2026."],
  "EXPERIENCE[].role": ["Job title", "Shown as the heading of the job."],
  "EXPERIENCE[].org": ["Company · place", "Company first, then · and the city. The part before · is counted as one company."],
  "EXPERIENCE[].sum": ["Summary", "One or two sentences about the job, shown under the title."],
  "EXPERIENCE[].tech": ["Tech and tools", "One per line, shown as chips."],
  "EXPERIENCE[].flow": ["Workflow steps", "Optional. One per line, shown as a little step diagram (e.g. Create → Provision → Audit)."],
  "EXPERIENCE[].pts": ["What you did", "One achievement per line, shown as bullet points. Start with a verb."],

  // ---------- Education ----------
  "EDUCATION[].yr": ["Dates", "e.g. Dec 2020 – May 2024."],
  "EDUCATION[].t": ["Qualification", "Degree or class, e.g. Bachelor of Engineering - Computer Science."],
  "EDUCATION[].p": ["School / college", "Name and town."],
  "EDUCATION[].score": ["Score", "e.g. 7.26 CGPA or 86.4%. Leave empty to hide it."],

  // ---------- Certifications ----------
  "CERTIFICATIONS[].t": ["Certificate", "Full name of the course or exam."],
  "CERTIFICATIONS[].by": ["Issued by", "e.g. Udemy, HackerRank, NPTEL."],
  "CERTIFICATIONS[].when": ["When", "Month and year."],
  "CERTIFICATIONS[].url": ["Certificate link", "Where people can check it. Leave empty if there isn't one."],

  // ---------- Journey ----------
  "JOURNEY[].yr": ["Year", "e.g. 2018, Dec 2020 or \"Now\" for the last card."],
  "JOURNEY[].icon": ["Emoji", "One emoji on the timeline dot."],
  "JOURNEY[].ch": ["Chapter heading", "Optional. Starts a new chapter above this stop, e.g. \"College\"."],
  "JOURNEY[].t": ["Title", "What happened, in a few words."],
  "JOURNEY[].d": ["Story", "A couple of sentences about this stop."],
  "JOURNEY[].tags": ["Tags", "One per line, small chips under the story."],
  "JOURNEY[].big": ["Milestone", "Tick to highlight this stop with a Milestone badge."],
  "JOURNEY_MAP[].n": ["Place", "Town name shown on the map."],
  "JOURNEY_MAP[].d": ["What you did there", "e.g. SSLC · school name."],
  "JOURNEY_MAP[].yrs": ["Years", "e.g. 2017 – 2018."],
  "JOURNEY_MAP[].lat": ["Latitude", "From Google Maps: right-click the place → the first number (e.g. 13.4205)."],
  "JOURNEY_MAP[].lon": ["Longitude", "The second number from Google Maps (e.g. 74.9924)."],
  "JOURNEY_MAP[].lbl": ["Label position", "Where the name sits next to the pin, so labels don't overlap."],

  // ---------- Skills ----------
  "SKILLS[].h": ["Group name", "e.g. Languages, Backend, Databases."],
  "SKILLS[].s": ["Skills", "One per line, in the order they should appear."],
  "SKILLS[].at": ["Where each skill was used", "Shown under each skill so it can be backed up in an interview."],

  // ---------- Projects ----------
  "PROJECTS[].t": ["Project name", "Also used for its link, e.g. #projects/job-board."],
  "PROJECTS[].cat": ["Category", "e.g. Full-stack, AI / ML. Shown above the title."],
  "PROJECTS[].d": ["Description", "What it does and how, in two to four sentences."],
  "PROJECTS[].img": ["Main screenshot", "Shown on the tablet mockup and the project's card. Upload a wide desktop screenshot."],
  "PROJECTS[].phone": ["Phone screenshot", "Optional. Shown on the phone mockup; the main screenshot is used if empty."],
  "PROJECTS[].stats": ["Highlight numbers", "Big numbers on the project, e.g. 6 job sources."],
  "PROJECTS[].stack": ["Tech stack", "One per line, shown as chips."],
  "PROJECTS[].hue": ["Card colour", "For training projects: a colour wheel angle 0–360 (0 red, 120 green, 220 blue)."],
  "PROJECTS[].url": ["Code link", "GitHub repository."],
  "PROJECTS[].demo": ["Live demo link", "Opens from the Live button. Leave empty if there's no demo."],
  "PROJECTS[].wake": ["Wake-up link", "For free hosts that sleep: the site pings this when Projects opens, so the demo is awake by the time someone clicks."],
  "PROJECTS[].apiDocs": ["API docs link", "Swagger / OpenAPI page, if the project has one."],
  "PROJECTS[].writeup": ["Write-up link", "A blog post or case study page about the project."],
  "PROJECTS[].video": ["Demo video link", "YouTube or Loom link. Leave empty to hide the button."],
  "PROJECTS[].demoLogins": ["Demo logins", "Test accounts shown next to the Live button, so reviewers can try it."],
  "PROJECTS[].ci": ["Build status link", "GitHub Actions workflow page, shown as a CI badge."],
  "PROJECTS[].badges": ["Badges", "One per line: short proof points like \"13 unit tests\" or \"Docker\"."],
  "PROJECTS[].read": ["Code to read first", "Files you'd point a reviewer to, each with what it shows."],
  "PROJECTS[].read[].f": ["File name", "e.g. RelevanceScorer.java."],
  "PROJECTS[].read[].what": ["What it shows", "One line on why it's worth reading."],
  "PROJECTS[].read[].url": ["Link to the file", "GitHub link to the file."],
  "PROJECTS[].caseStudy": ["Case study", "The detailed view that opens from the project."],
  "PROJECTS[].caseStudy.when": ["When", "Month and year you built it."],
  "PROJECTS[].caseStudy.problem": ["The problem", "What was hard or annoying before this project existed."],
  "PROJECTS[].caseStudy.architecture": ["Architecture", "The layers of the system diagram, top to bottom. Each box has a name, a tech line and a description."],
  "PROJECTS[].caseStudy.challenges": ["Challenges", "One per line: hard problems you solved."],
  "PROJECTS[].caseStudy.outcome": ["Outcome", "Where it is now: live, users, results."],
  "PROJECTS[].shots": ["Screenshots", "Gallery in the project's detail view."],
  "PROJECTS[].shots[].src": ["Screenshot", "Upload an image."],
  "PROJECTS[].shots[].cap": ["Caption", "One line on what the screenshot shows."],
  "PROJECTS[].training": ["Training project", "Tick for smaller internship or course projects: they're listed below the main showcase."],
  "PROJECTS[].from": ["Built during", "For training projects, e.g. DLithe internship."],

  // ---------- Coding platforms ----------
  "PLATFORMS[].n": ["Platform name", "LeetCode, GeeksforGeeks, Code360, HackerRank, HackerEarth, InterviewBit, NeetCode, Codeforces, CodeChef and AtCoder load live numbers by this exact name. Any other name gets a tile with the numbers below."],
  "PLATFORMS[].c": ["Colour", "Hex code for the tile, e.g. #ffa116."],
  "PLATFORMS[].val": ["Problems solved (fallback)", "Shown only if the live numbers can't load. Platforms with live numbers update on their own."],
  "PLATFORMS[].lbl": ["Line under the number (fallback)", "e.g. problems solved · 200 E / 204 M / 51 H. Replaced by live data when it loads."],
  "PLATFORMS[].meta": ["Extra facts (fallback)", "Small label + value pairs, e.g. Max streak · 109d."],
  "PLATFORMS[].url": ["Profile link", "Your public profile page on the platform."],
  "PLATFORMS[].accounts": ["Accounts", "Only if you have more than one account on this platform."],
  "PLATFORMS[].accounts[].user": ["Username", "Your handle on the platform."],
  "PLATFORMS[].accounts[].url": ["Profile link", "That account's public profile page."],
  "PLATFORMS[].accounts[].val": ["Solved (fallback)", "Used only if live numbers can't load."],
  "PLATFORMS[].accounts[].note": ["Note", "e.g. 200 E / 204 M / 51 H."],
  "PLATFORMS[].more": ["Smaller platform", "Not used on the site at the moment."],

  // ---------- Festivals ----------
  "FESTIVALS[].kind": ["Decoration", "Type diwali for a row of lit diyas, or paste up to 6 emoji (e.g. 🎄 or 🙏🎉). Empty shows 👋."],
  "FESTIVALS[].name": ["Greeting", "The message shown next to the decoration, e.g. Happy Deepavali!"],
  "FESTIVALS[].from": ["First day", "Pick a date (Indian time). Leave empty to start showing now."],
  "FESTIVALS[].to": ["Last day", "The greeting shows up to and including this day. Leave empty to keep it until you remove it."],
};

// Names (and optional help, after "|") for the parts of short fixed lists.
export const TUPLES = {
  "ABOUT.terminal[]": ["Command|What appears to be typed, e.g. whoami", "What it prints|The answer shown under it"],
  "PROJECTS[].stats[]": ["Number|The big figure, e.g. 6 or 165", "What it counts|Short caption under it"],
  "PLATFORMS[].meta[]": ["Label|e.g. Max streak", "Value|e.g. 109d"],
  "JOURNEY_MAP[].lbl": ["Move right (px)|Distance from the pin; negative moves it left", "Move down (px)|Negative moves it up", "Text side|start, middle or end: which side of the text lines up with the point"],
};

// Fields edited with a date picker (stored as YYYY-MM-DD).
export const DATES = new Set(["FESTIVALS[].from", "FESTIVALS[].to"]);

// "SKILLS[].at.React.js" → the skill's own name, with help
export function docFor(path, key) {
  if (DOCS[path]) return DOCS[path];
  if (path.startsWith("SKILLS[].at.")) return [key, "Where you used it, e.g. Job Board, FlightWise AI."];
  return null;
}
