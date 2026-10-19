// Turns the site's content into one plain-text knowledge sheet for the chatbot.
// Used by the server (netlify/functions/chat.mjs) and by the offline fallback in the browser.
import { ABOUT, CERTIFICATIONS, DOING, EDUCATION, EXPERIENCE, JOURNEY, ME, PLATFORMS, PROJECTS, SKILLS } from "../data.js";
import NOTES, { PRONOUNS } from "./notes.js";

export const NAME = "Guruprasad";
export { PRONOUNS };

// Page ids the assistant can cite as sources. Each maps to a tab on the site.
export const SECTIONS = { about: "About", experience: "Experience", education: "Education", journey: "Journey", skills: "Skills", projects: "Projects", coding: "Coding", contact: "Contact" };

const list = (xs) => xs.map((x) => `- ${x}`).join("\n");

export function knowledge() {
  const socials = ME.socials.map((s) => `${s.label}: ${s.url.startsWith("/") ? ME.website.replace(/\/$/, "") + s.url : s.url}`);
  return `
# ${NAME} (section: about)
Roles: ${ME.roles.join(", ")}
Headline: ${ME.headline}
Summary: ${ME.lede}
Location: ${ME.location}
Status: ${ME.availability}
Looking for: ${ME.lookingFor.join(", ")}
Top skills: ${ME.topSkills.join(", ")}
Bio: ${ABOUT.bio} ${ABOUT.bio2}
Focus areas: ${DOING.map((d) => `${d.t}: ${d.d}`).join(" | ")}
Languages spoken: ${ABOUT.languages.map((l) => `${l.n} (${l.label})`).join(", ")}
${ABOUT.tulu ? `Hello in Tulu: "${ABOUT.tulu.phrase}" (said ${ABOUT.tulu.say}) means ${ABOUT.tulu.means}` : ""}
Interests: ${ABOUT.interests.map((i) => `${i.title}: ${i.back}`).join(" | ")}

# Contact (section: contact)
Email: ${ME.email}
${ME.phone ? `Phone: ${ME.phone}` : ""}
${socials.join("\n")}

# Experience, newest first (section: experience)
${EXPERIENCE.map((x) => `## ${x.role}, ${x.org} (${x.when})\n${x.sum ? x.sum + "\n" : ""}${x.flow ? `User lifecycle handled: ${x.flow.join(" → ")}\n` : ""}${list(x.pts)}`).join("\n\n")}

# Education (section: education)
${EDUCATION.map((e) => `- ${e.t}, ${e.p} (${e.yr}): ${e.score}`).join("\n")}
Certifications:
${CERTIFICATIONS.map((c) => `- ${c.t}${c.by ? `, ${c.by}` : ""}${c.when ? ` (${c.when})` : ""}`).join("\n")}

# Skills (section: skills)
${SKILLS.map((g) => `- ${g.h}: ${g.s.join(", ")}`).join("\n")}

# Projects (section: projects)
${PROJECTS.map((p) => {
  const cs = p.caseStudy;
  const arch = cs?.architecture?.flat().map(([n, sub, does, why]) => `  - ${n} (${sub})${does ? `: ${does}` : ""}${why ? ` Why: ${why}` : ""}`).join("\n");
  return `## ${p.t} [${p.cat}]
${p.d}
Stack: ${p.stack.join(", ")}
${p.url ? `Code: ${p.url}` : "Code: not public yet (a walkthrough is available on request)"}${p.demo ? `\nLive demo: ${p.demo}` : ""}${cs ? `
When: ${cs.when}
Problem: ${cs.problem}
${arch ? `Architecture:\n${arch}` : ""}
Challenges:
${list(cs.challenges || [])}
Status: ${cs.outcome}` : ""}`;
}).join("\n\n")}

# Coding practice (section: coding)
${PLATFORMS.filter((p) => p.val != null).map((p) => `- ${p.n}: ${p.val} ${p.lbl}${p.meta?.length ? ` (${p.meta.map(([k, v]) => `${k} ${v}`).join(", ")})` : ""} · ${(p.accounts || [p.url]).join(" and ")}`).join("\n")}
(These are the last saved numbers; the Coding page shows live ones.)

# Journey, oldest first (section: journey)
${JOURNEY.map((j) => `- ${j.yr}: ${j.t}. ${j.d}`).join("\n")}

# Extra notes from ${NAME} (section: about)
${NOTES.replace(/^- TODO.*$/gm, "").trim()}
`.replace(/\n{3,}/g, "\n\n").trim();
}
