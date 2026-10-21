import { ME, PROJECTS } from "../data";

/*
  Personalised links for job applications:
    https://guruprasadgp.netlify.app/?for=LogistiQ&role=backend
  for  = the company, greeted by name in the sidebar
  role = backend | fullstack | ai | python: puts the most relevant projects first and picks the matching resume
  Both are optional. The company name is only ever rendered as text.
*/
const q = new URLSearchParams(location.search);
const company = (q.get("for") || "").replace(/[^\p{L}\p{N} &.'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
const ROLES = ["backend", "fullstack", "ai", "python"];
const role = ROLES.find((r) => r === (q.get("role") || "").toLowerCase()) || "";

export const VISITOR = { company, role };

// Projects in the order that suits the role: AI / Python roles see the dental model first, others keep data.js order.
export function projectsFor(r = role) {
  if (r !== "ai" && r !== "python") return PROJECTS;
  const ai = PROJECTS.filter((p) => p.cat === "AI / ML");
  return [...ai, ...PROJECTS.filter((p) => !ai.includes(p))];
}

// The resume to offer: the Java Backend variant for backend roles when one exists, otherwise the default.
export const resumeFor = (r = role) => (r === "backend" && ME.resumes?.backend) || ME.resumes?.default || ME.socials.find((s) => s.label === "Resume")?.url;
