// Offline answers: used when the AI is unavailable (no API key, API down, or rate-limited).
// Everything comes straight from data.js, so it can't say anything that isn't on the site.
import { ABOUT, EDUCATION, EXPERIENCE, ME, PLATFORMS, PROJECTS, SKILLS } from "../data.js";
import { NAME } from "./knowledge.js";

const has = (q, ...words) => words.some((w) => new RegExp(`(^|[^a-z])${w}`, "i").test(q));
const solved = PLATFORMS.reduce((n, p) => n + (p.val || 0), 0);

// Tech names with the spellings people use for them. Shared with the job matcher below.
const ALIASES = {
  "Java": ["java", "core java", "java 8", "java 17", "java 21"],
  "Spring Boot": ["spring boot", "springboot"],
  "Spring Framework": ["spring framework", "spring mvc", "spring"],
  "Spring Security": ["spring security"],
  "JWT": ["jwt", "json web token"],
  "Hibernate / JPA": ["hibernate", "jpa"],
  "JDBC": ["jdbc"],
  "Python": ["python"],
  "Django": ["django"],
  "Flask": ["flask"],
  "JavaScript": ["javascript", "js", "es6"],
  "React.js": ["react", "react.js", "reactjs"],
  "HTML5": ["html", "html5"],
  "CSS3": ["css", "css3"],
  "Tailwind CSS": ["tailwind"],
  "Material UI": ["material ui", "mui"],
  "SQL": ["sql"],
  "PostgreSQL": ["postgresql", "postgres"],
  "MySQL": ["mysql"],
  "MongoDB": ["mongodb", "mongo"],
  "Oracle SQL": ["oracle"],
  "Firebase": ["firebase"],
  "Docker": ["docker", "containers", "containerization"],
  "GitHub Actions": ["github actions"],
  "Linux/Unix": ["linux", "unix", "shell scripting"],
  "Microservices": ["microservices", "microservice"],
  "RESTful APIs": ["rest", "restful", "rest api", "rest apis", "web services"],
  "Git": ["git", "github", "version control"],
  "Maven": ["maven"],
  "Postman": ["postman"],
  "Swagger / OpenAPI": ["swagger", "openapi"],
  "Unit Testing": ["unit testing", "junit"],
  "OOP": ["oop", "object oriented", "object-oriented"],
  "Data Structures & Algorithms": ["data structures", "algorithms", "dsa", "problem solving", "problem-solving"],
  "PyTorch": ["pytorch"],
  "OpenCV": ["opencv", "computer vision"],
  "YOLOv5": ["yolo", "yolov5", "object detection"],
  "Manual Testing": ["manual testing"],
  "Agile": ["agile", "scrum"],
  "SAP IAM": ["sap", "identity and access", "iam", "rbac", "access management"],
  "C++": ["c\\+\\+"],
};
// Common requirements that are NOT in Guruprasad's data, so the matcher can list them as gaps.
const OTHER = {
  "AWS": ["aws", "amazon web services"], "Azure": ["azure"], "GCP": ["gcp", "google cloud"], "TypeScript": ["typescript"],
  "Angular": ["angular"], "Vue.js": ["vue"], "Node.js": ["node", "node.js", "nodejs", "express"], "Go": ["golang"],
  "C#/.NET": ["c#", "\\.net"], "Kotlin": ["kotlin"], "Jenkins": ["jenkins"], "Terraform": ["terraform"], "GraphQL": ["graphql"],
  "Next.js": ["next.js", "nextjs"], "Elasticsearch": ["elasticsearch"], "RabbitMQ": ["rabbitmq"], "Mockito": ["mockito"],
  // listed on older resumes but not used in a project yet, so they count as gaps
  "Kafka": ["kafka", "event-driven", "event driven"], "Redis": ["redis"], "Kubernetes": ["kubernetes", "k8s"], "CI/CD pipelines": ["ci/cd", "cicd", "continuous integration", "continuous delivery"],
  "LLMs / RAG": ["rag", "retrieval augmented", "llm", "langchain", "generative ai", "genai"], "Automation testing": ["automation testing", "test automation"],
  "Selenium": ["selenium"], "Spark": ["spark", "pyspark"], "System design": ["system design", "low level design", "lld", "hld"],
};
const mine = new Set([...SKILLS.flatMap((g) => g.s), ...PROJECTS.flatMap((p) => p.stack), "Data Structures & Algorithms", "SAP IAM"]);
// "React.js" → "React.js", "Apache Kafka" → "Apache Kafka", "Java 21" → "Java", "Spring Boot" → "Spring Boot"
const canon = (s) => Object.entries(ALIASES).find(([n, w]) => n === s || w.some((a) => new RegExp(`^${a}$`, "i").test(s)))?.[0] || s;
const found = (text, words) => words.some((w) => new RegExp(`(^|[^a-z0-9+#.])${w}($|[^a-z0-9+#])`, "i").test(text));

export function matchJD(jd) {
  const matched = Object.entries(ALIASES).filter(([n, w]) => (mine.has(n) || n === "Spring Framework" || n === "Java") && found(jd, w)).map(([n]) => n);
  // "spring" alone shouldn't double-count when Spring Boot already matched
  const m = matched.includes("Spring Boot") ? matched.filter((n) => n !== "Spring Framework") : matched;
  const missing = Object.entries(OTHER).filter(([, w]) => found(jd, w)).map(([n]) => n);
  const total = m.length + missing.length;
  const score = total ? Math.round((m.length / total) * 100) : 0;
  // projects whose stack shares the most matched skills
  const projects = PROJECTS.map((p) => ({ p, hits: p.stack.filter((s) => m.includes(canon(s))) }))
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 3)
    .map(({ p, hits }) => ({ t: p.t, why: `Uses ${hits.slice(0, 4).join(", ")}.` }));
  return {
    score,
    role: "",
    verdict: total ? `Keyword match: ${m.length} of ${total} technologies in this description appear in ${NAME}'s experience and projects.` : "I couldn't spot any technologies in that text. Is it a job description?",
    matched: m,
    missing,
    projects,
    pitch: `${NAME} is a ${ME.roles[0].toLowerCase()} from ${ME.location} with a B.E. in Computer Science (${EDUCATION[0].score}) and a year as a ${EXPERIENCE[0].role} at Sony India. ${m.length ? `Relevant skills for this role: ${m.slice(0, 6).join(", ")}.` : ""} Recent work includes ${PROJECTS[0].t}, a ${PROJECTS[0].stack.slice(0, 4).join(", ")} platform, and ${solved.toLocaleString("en-IN")}+ DSA problems solved.`,
    source: "offline",
  };
}

// Answers for the suggested questions and other common ones. Returns { text, from } or null.
export function faq(q) {
  const sony = EXPERIENCE[0], fw = PROJECTS.find((p) => /flightwise/i.test(p.t)) || PROJECTS[0];
  if (has(q, "sony", "sap", "iam")) return { text: `At Sony India Software Centre (${sony.when}), ${NAME} was a ${sony.role} in SAP Identity and Access Management.\n- ${sony.flow ? `Handled the full user lifecycle: ${sony.flow.join(" → ")}` : sony.pts[0]}\n- ${sony.pts[1]}\n- ${sony.pts[2]}`, from: ["experience"] };
  if (has(q, "flightwise", "flight")) return { text: `**${fw.t}**: ${fw.d}\n\nStack: ${fw.stack.join(", ")}.`, from: ["projects"] };
  if (has(q, "join", "notice", "availab", "start", "relocat", "when can")) return { text: `${NAME} is **${ME.availability.toLowerCase()}**: no notice period, since the Sony apprenticeship ended on 2 June 2026.\n- ${(ME.hiring || []).join("\n- ")}\n\nTo set up an interview, email ${ME.email}${ME.phone ? ` or call ${ME.phone}` : ""}.`, from: ["about", "contact"] };
  if (has(q, "hire", "why should", "strength", "fit")) return { text: `A few reasons:\n- A year of enterprise experience at Sony India (SAP IAM, RBAC, audits)\n- Full-stack Java and Python: ${ME.topSkills.slice(0, 6).join(", ")}\n- Builds real systems, like ${fw.t}, a flight booking platform on Spring Boot microservices\n- ${solved.toLocaleString("en-IN")}+ DSA problems solved across LeetCode, GFG, NeetCode and Code360`, from: ["experience", "projects", "coding"] };
  if (has(q, "experience", "intern", "work", "job", "kodnest", "dlithe")) return { text: EXPERIENCE.map((x) => `- **${x.role}**, ${x.org.split(" · ")[0]} (${x.when})`).join("\n"), from: ["experience"] };
  if (has(q, "project")) return { text: PROJECTS.map((p) => `- **${p.t}**: ${p.stack.slice(0, 4).join(", ")}`).join("\n"), from: ["projects"] };
  if (has(q, "educat", "degree", "college", "cgpa", "puc", "sslc", "mite")) return { text: EDUCATION.map((e) => `- ${e.t}, ${e.p.split(",")[0]}: ${e.score}`).join("\n"), from: ["education"] };
  if (has(q, "leetcode", "gfg", "geeks", "dsa", "coding", "problems", "neetcode", "hackerrank", "hackerearth", "code360")) return { text: PLATFORMS.filter((p) => p.val != null).map((p) => `- ${p.n}: ${p.val} ${p.lbl.split(" · ")[0]}`).join("\n"), from: ["coding"] };
  if (has(q, "tulu", "hello in")) return ABOUT.tulu ? { text: `Hello in Tulu: **${ABOUT.tulu.phrase}** (say it: ${ABOUT.tulu.say}). It means "${ABOUT.tulu.means}".`, from: ["about"] } : null;
  if (has(q, "contact", "email", "phone", "reach", "call", "linkedin")) return { text: `Email: ${ME.email}${ME.phone ? `\nPhone: ${ME.phone}` : ""}\nLinkedIn: ${ME.socials.find((s) => s.label === "LinkedIn")?.url}`, from: ["contact"] };
  const tech = Object.entries(ALIASES).find(([, w]) => found(q, w));
  if (tech) {
    const [n] = tech;
    const group = SKILLS.find((g) => g.s.includes(n));
    // "where used" from the Skills page first, otherwise the projects whose stack names it
    const used = group?.at?.[n] || PROJECTS.filter((p) => p.stack.some((s) => s.toLowerCase().startsWith(n.toLowerCase().split(/[ .]/)[0]))).map((p) => p.t).join(", ");
    if (group || used) return { text: `Yes. ${group ? `${n} is in ${NAME}'s ${group.h} skills.` : ""}${used ? ` Used in: ${used}.` : ""}`.trim(), from: [group && "skills", used && "projects"].filter(Boolean) };
  }
  const gap = Object.entries(OTHER).find(([, w]) => found(q, w));
  if (gap) return { text: `${gap[0]} isn't in ${NAME}'s projects or experience yet, so it isn't listed on the site. Closest related work: ${PROJECTS[0].t} (${PROJECTS[0].stack.slice(0, 5).join(", ")}).`, from: ["skills", "projects"] };
  return null;
}

export const OFFLINE_MISS = `I'm in offline mode right now, so I can only answer common questions (try the suggestions below). For anything else, email ${NAME} at ${ME.email}.`;
