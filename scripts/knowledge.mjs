// Exports the chatbot's knowledge sheet for the Java chat-service (backend/chat-service). The sheet is built from
// src/data.js and src/chat/notes.js by the same function the site uses, so both always say the same thing.
// Run after editing data.js or notes.js:  npm run backend:knowledge
import { writeFileSync } from "node:fs";
import { knowledge, NAME, PRONOUNS, SECTIONS } from "../src/chat/knowledge.js";
import { PROJECTS } from "../src/data.js";

const out = new URL("../backend/chat-service/src/main/resources/knowledge.json", import.meta.url);
const sheet = { name: NAME, pronouns: PRONOUNS || "", sections: Object.keys(SECTIONS), projects: PROJECTS.map((p) => p.t), text: knowledge() };
writeFileSync(out, JSON.stringify(sheet, null, 1) + "\n");
console.log(`Wrote ${out.pathname} (${sheet.text.length} characters, ${sheet.projects.length} projects)`);
