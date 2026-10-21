/*
  EXTRA THINGS THE CHATBOT KNOWS
  Everything else (experience, projects, skills, education, stats…) comes from src/data.js automatically.
  Write plain Markdown between the backticks. The assistant answers ONLY from data.js and this file,
  so anything a recruiter might ask that isn't on the site belongs here.
*/

// How the assistant refers to you. Leave "" and it will just use your name.
export const PRONOUNS = "";

export default `
## Availability and preferences
- Available to join immediately. No notice period: the Sony apprenticeship ended on 2 June 2026.
- Job title at Sony: Software Developer Apprentice (as on the offer letter and resume).
- Target role: SDE-1 / Java Backend Developer; also open to Full Stack and Python roles.
- Location: based in Bengaluru, open to remote. TODO: say whether you'd relocate and which work modes (on-site, hybrid, remote) you prefer.

## Interview notes (why I built things the way I did)
- FlightWise AI: the system-design reasoning for every part (gateway, Eureka, each service, PostgreSQL, Docker) is in the project data, so the assistant can already explain those choices.
- TODO: add the hardest bug you fixed in FlightWise AI and how you found it.
- TODO: anything else you'd like to be asked about (e.g. what you'd improve next).

## Fun facts
- Speaks Tulu natively. Hello in Tulu: see the Tulu phrase in the About data.
- TODO: favourite cricket moment or player, if you'd like the assistant to share it.
`;
