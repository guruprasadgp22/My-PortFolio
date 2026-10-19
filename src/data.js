/* ==========================================================
   EDIT YOUR DETAILS HERE
   Everything on the site comes from this file.
   Filled from your resume and LinkedIn profile. Lines marked "TODO" still need your input.
   ========================================================== */

export const ME = {
  first: "GURU",
  last: "PRASAD",
  initials: "GP",
  roles: ["Full Stack Developer", "Software Engineer", "Java Developer", "Backend Developer", "Python Developer"],
  headline: "Java | Python | Spring | Spring Boot",
  lede:
    "Software developer with a B.E. in Computer Science, building scalable, secure and user-focused applications with Java, Python, Spring Boot and React.js.",
  email: "guruprasad6200@gmail.com",
  phone: "+91 76248 14091", // shown in the sidebar contacts. Set to "" to hide it.
  website: "https://guruprasadgp.netlify.app/",
  location: "Bengaluru, Karnataka",
  // Recruiter quick view. TODO: set availability to something specific, e.g. "Immediate joiner" or "Notice: 15 days".
  lookingFor: ["Software Engineer", "Java Developer", "Backend Developer", "Full Stack Developer", "Python Developer"],
  availability: "Open to work",
  topSkills: ["Java", "Spring Boot", "Python", "React.js", "PostgreSQL", "REST APIs", "Docker", "Microservices"],
  socials: [
    { label: "GitHub", url: "https://github.com/guruprasadgp22" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/guruprasadgp22/" },
    // Add more with the same shape, e.g. { label: "Instagram", url: "..." } or { label: "X", url: "..." }
    { label: "Resume", url: "/Guruprasad_P_updated.pdf" }, // the PDF in the public/ folder
  ],
};

export const ABOUT = {
  // Your photo lives at public/me.jpg. Leave "" to show the animated monogram instead.
  photo: "/me.jpg",
  bio: "I'm Guruprasad, a software developer with a Bachelor's degree in Computer Science and Engineering. I enjoy designing and building scalable, secure and user-focused applications.",
  bio2:
    "At Sony India Software Centre I worked in SAP Identity and Access Management: user lifecycle, role-based access control, authentication, authorization and security compliance. Before that I built full-stack apps with Java, Python, Spring Boot, Hibernate and React.js at KodNest, and a Car Rental Management System at DLithe. I'm a quick learner who likes hard problems, and I'm looking for roles as a Software Engineer, Java, Backend, Full Stack or Python Developer.",
  facts: [
    { value: 3, suffix: "", label: "internships" },
    { value: 1, suffix: " yr", label: "at Sony India" },
    { value: 8, suffix: "", label: "projects built" },
    { value: 1100, suffix: "+", label: "problems solved" },
  ],
  terminal: [
    ["whoami", "guruprasad — software developer (Java · Python · Spring Boot · React)"],
    ["cat focus.txt", "Spring Boot · Microservices · React.js · PostgreSQL · RAG"],
    ["echo $CURRENTLY_BUILDING", "FlightWise AI — flight search with Kafka, Redis & LangChain4j"],
    ["cat status", "open to SDE and full-stack roles ✔"],
  ],
  // Languages from LinkedIn. lvl is LinkedIn's 1–5 proficiency scale (5 = native or bilingual).
  languages: [
    { n: "Kannada", label: "Native or bilingual", lvl: 5 },
    { n: "Tulu", label: "Native or bilingual", lvl: 5 },
    { n: "English", label: "Professional working", lvl: 3 },
  ],
  // Tech that circles your photo on the About page. Inner ring first, outer ring second. c = brand colour.
  orbit: [
    [{ n: "Java", c: "#f89820" }, { n: "Spring Boot", c: "#6db33f" }, { n: "React", c: "#61dafb" }, { n: "Python", c: "#ffd43b" }],
    [{ n: "Kafka", c: "#e8e8e8" }, { n: "Docker", c: "#2496ed" }, { n: "PostgreSQL", c: "#699eca" }, { n: "Redis", c: "#ff4438" }, { n: "Hibernate", c: "#bcae79" }, { n: "MySQL", c: "#00a0c4" }],
  ],
  // "Ask me to say hello in Tulu" on the About page.
  // TODO: you're the native speaker, so check the phrase and the way it's spelled out.
  tulu: { phrase: "Encha ullar?", say: "EN-cha ool-LAR", means: "How are you? (the polite way to say hi)" },
  // "Two truths and a lie". Exactly one has lie: true. Every truth here is already on your site.
  // TODO: swap in your own, e.g. something surprising you've done or a skill outside tech.
  truths: [
    { s: "I once kept a LeetCode streak going for 109 days in a row.", why: "True! 109 days is my max streak. Some days the problem was easy, some days it was 11:58 pm." },
    { s: "I've never written a single line of C.", lie: true, why: "The lie! My very first program was in C, back in PUC. It came with my first bug, free of cost." },
    { s: "I'm ranked #1 in my institute on GeeksforGeeks.", why: "True! #1 in my institute on GFG, with 650+ problems solved." },
  ],
  // TODO: these are not on your resume. Edit the text so it sounds like you.
  interests: [
    { icon: "🏏", title: "Cricket", tag: "teamwork", back: "Weekend matches with friends. Reading the game is a lot like reading a codebase." },
    { icon: "⌨", title: "Problem Solving", tag: "dsa", back: "Regular DSA practice on LeetCode, GFG, NeetCode and Code 360 keeps my thinking sharp." },
    { icon: "♫", title: "Music", tag: "focus", back: "Music on while I code. It helps me get into deep focus." },
    { icon: "✈", title: "Travel", tag: "explore", back: "Exploring new places around Karnataka whenever I get the chance." },
  ],
};

// Your story, told the fun way. Shown on the Journey page.
export const JOURNEY = [
  { yr: "2018", t: "SSLC cleared with 86.4%", d: "Finished 10th standard with 86.4%. Exams over, holidays on. Best feeling ever.", tags: ["SSLC", "86.4%"] },
  { yr: "2018", t: "Hello, World!", d: "Picked PCMCs for PUC and wrote my first program in C. It came with my first bug, free of cost.", tags: ["PUC", "PCMCs", "C"] },
  { yr: "2020", t: "PUC done, then COVID said hi", d: "Wrapped up PUC with 71.33%. Then COVID arrived and the whole world pressed the pause button.", tags: ["PUC", "71.33%"] },
  { yr: "Dec 2020", t: "Officially an engineering student", d: "Joined B.E. in Computer Science at MITE, Mangalore. New laptop, big dreams, zero idea what a semicolon could do to me.", tags: ["B.E. CSE", "MITE"] },
  { yr: "2021 – 2023", t: "Collecting languages like Pokémon", d: "C led to C++, then Java, JavaScript, Python and more. Gotta code 'em all!", tags: ["C++", "Java", "JavaScript", "Python"] },
  { yr: "Aug 2023", t: "First internship at DLithe", d: "Built a Car Rental Management System with React, PHP and SQL. Lots of cars on screen, sadly no free rides.", tags: ["React.js", "PHP", "SQL"] },
  { yr: "May 2024", t: "Engineer, unlocked", d: "Finished my B.E. with a 7.26 CGPA. Four years, endless assignments, one degree, no regrets.", tags: ["Graduated", "7.26 CGPA"] },
  { yr: "May 2024", t: "An offer letter from TCS", d: "Got an offer from TCS! Life had other plans and I couldn't join, but it told me I was on the right track.", tags: ["TCS", "Offer letter"] },
  { yr: "Oct 2024", t: "Back to coding school at KodNest", d: "Joined KodNest to level up in full stack Java and Python. More code, more coffee, more 'aha!' moments.", tags: ["Java", "Python", "Full Stack"] },
  { yr: "May 2025", t: "Sony is calling", d: "Got an internship offer from Sony India. Yes, that Sony! Cue the happy dance.", tags: ["Offer", "Sony"] },
  { yr: "Jun 2025", t: "Hello, real IT world", d: "Joined Sony as a Software Developer Intern. Learned how a real IT company works: big systems, real users, real deadlines, and SAP access management.", tags: ["Sony", "SAP IAM", "RBAC"] },
  { yr: "Jun 2026", t: "Sony chapter complete", d: "Finished my internship on 2 June 2026, with a backpack full of industry lessons and a lot more confidence.", tags: ["Completed", "Industry ready"] },
  { yr: "Now", t: "Leveling up, every single day", d: "Sharpening DSA, polishing my communication, building projects like FlightWise AI and learning something new daily. Next level loading…", tags: ["DSA", "Communication", "Projects", "Open to work"] },
];

// Stops on the animated map at the top of the Journey page, oldest first. lat/lon are the real places
// (from OpenStreetMap). lbl = where the name sits relative to its pin: [dx, dy, "start" | "end"].
export const JOURNEY_MAP = [
  { n: "Mudradi", d: "SSLC · M N D S M Aided High School", yrs: "2017 – 2018", lat: 13.4205, lon: 74.9924, lbl: [34, -30, "start"] },
  { n: "Hiriadka", d: "PUC · Karnataka Public School", yrs: "2018 – 2020", lat: 13.3506, lon: 74.8659, lbl: [-4, -50, "end"] },
  { n: "Moodabidri", d: "B.E. at MITE · DLithe internship", yrs: "2020 – 2024", lat: 13.051, lon: 74.9648, lbl: [32, 40, "start"] },
  { n: "Bengaluru", d: "KodNest · Sony India", yrs: "2024 – now", lat: 12.9767, lon: 77.59, lbl: [-6, 44, "end"] },
];

// Newest first. Every role from your resume and LinkedIn.
// sum, tech and flow feed the stacked cards at the top of the Experience page; pts are the full details below them.
export const EXPERIENCE = [
  {
    when: "Jun 2025 – Jun 2026",
    role: "Software Developer Intern",
    org: "Sony India Software Centre Pvt. Ltd. · Bengaluru, Karnataka",
    sum: "SAP Identity and Access Management in a production enterprise environment: who gets access to what, and keeping it safe.",
    tech: ["SAP IAM", "RBAC", "Access reviews", "Audits", "Ticketing & SLAs"],
    flow: ["Create", "Provision", "Modify", "Audit", "Deactivate"], // the user lifecycle I handled
    pts: [
      "Administered SAP Identity and Access Management (IAM) processes across the full user lifecycle: account creation, access provisioning, role changes, password resets and deactivation, in line with organizational security policies",
      "Managed role-based access control (RBAC) by assigning, modifying and auditing user roles and authorizations, following least privilege and segregation of duties",
      "Maintained authentication and authorization configurations across SAP environments, performing access reviews, resolving authorization issues and supporting audits",
      "Worked with cross-functional teams, business stakeholders and application owners to process access requests, troubleshoot access issues and implement role changes",
      "Handled user requests through enterprise ticketing and access management processes, monitoring SLAs and documenting provisioning and identity management work",
      "Built knowledge of enterprise security, SAP authorization management, identity governance, risk mitigation and IT compliance in a production support environment",
      "Strengthened communication, documentation, stakeholder management and adherence to standard operating procedures in a collaborative enterprise team",
    ],
  },
  {
    when: "Oct 2024 – Jun 2025",
    role: "Full Stack Development Intern",
    org: "KodNest Technologies · Bengaluru, Karnataka",
    sum: "Full stack Java and Python, end to end. Built QuickNote, a To-Do List and a full-stack Currency Converter.",
    tech: ["Java", "Spring Boot", "Hibernate", "Django", "React.js", "MySQL"],
    pts: [
      "Completed a full stack development internship in Java and Python, designing, building, testing and deploying web applications with industry best practices",
      "Learned Core and Advanced Java, OOP, the Collections Framework, JDBC, exception handling, multithreading and file handling",
      "Built backend applications with Spring Framework, Spring Boot, Hibernate and Django: REST APIs, CRUD operations, dependency injection and layered architecture",
      "Designed responsive interfaces with HTML5, CSS3, JavaScript and React.js, integrated with backend APIs",
      "Worked with MySQL, Oracle SQL and MongoDB: schema design, SQL queries and data persistence",
      "Gained exposure to manual and automation testing, API validation, debugging and defect tracking across the SDLC",
      "Developed QuickNote, a To-Do List and a full-stack Currency Converter with CRUD, REST API integration, responsive UI and database connectivity",
      "Used Git, GitHub, Maven, IntelliJ IDEA, VS Code and Postman in day-to-day development",
    ],
  },
  {
    when: "Aug 2023 – Sep 2023",
    role: "Web Development Intern",
    org: "DLithe Consultancy Services Pvt. Ltd. · Moodabidri, Karnataka",
    sum: "My first real project: a Car Rental Management System, from the React screens down to the SQL.",
    tech: ["React.js", "PHP", "SQL", "Git"],
    pts: [
      "Gained hands-on full stack web development experience and learned the software development lifecycle through a real project",
      "Built responsive interfaces with HTML5, CSS3, JavaScript and React.js: components, state, events, routing and form validation",
      "Wrote PHP backend logic connected to relational databases, with SQL queries and CRUD operations",
      "Developed a Car Rental Management System where users browse vehicles, register, book rentals and manage reservations",
      "Improved debugging and clean coding habits, and worked with Git and GitHub in a collaborative workflow",
    ],
  },
];

// img = cover image in public/projects/ (falls back to animated art in colour `hue` if empty) · cat = filter category on the Projects page
// url = the project's own GitHub repo, demo = live site (both optional).
// stats = the two highlight numbers shown under the title in the showcase: [big text, label].
// TODO: swap the stats for real results when you have them (users, GitHub stars, accuracy, response time…).
// phone = optional phone-sized screenshot for the phone mockup (otherwise img is cropped to fit).
// TODO: projects with url: "" have no public repo yet. Push the code and paste the repo link to show a "View code" button.
export const PROJECTS = [
  {
    t: "Job Board",
    stats: [["6", "job sources, synced every 6 hours"], ["~200", "skills recognised in a resume"]],
    img: "/projects/job-board.jpg",
    phone: "/projects/job-board-phone.jpg",
    cat: "Full-stack",
    d: "Two-sided job platform that matches jobs to your resume. Job seekers upload a resume, get jobs from LinkedIn, Indeed, Naukri, Glassdoor and free job APIs ranked by match %, apply to jobs posted on the site and track every application from Saved to Offer. Employers post jobs and review applicants ranked by how well their resume fits. Closed jobs are detected and removed automatically.",
    stack: ["Java 21", "Spring Boot 3.5", "Spring Security", "JWT", "JPA", "React 18", "Vite", "PostgreSQL", "Docker", "GitHub Actions"],
    hue: 220,
    url: "https://github.com/guruprasadgp22/Job-Board",
    demo: "https://job-board-6ev5.onrender.com/",
    caseStudy: {
      when: "October 2026",
      problem:
        "Job hunting means checking LinkedIn, Naukri, Indeed and company pages one by one, guessing which roles actually fit, and losing track of where you applied. Job Board brings jobs into one place, scores each one against your resume, shows which required skills you have and which you're missing, and tracks every application. Employers get the other side: post a job and see applicants ranked by resume fit.",
      architecture: [
        [["React 18 frontend", "Vite · served by Spring Boot",
          "Dashboard, ranked job search, the application board (Saved → Applied → Interviewing → Offer), profile and resume upload, and employer screens for postings and applicants.",
          "Spring Boot serves the React build, so the whole app ships as one deployable unit on one URL."]],
        [["Spring Security + JWT", "BCrypt · roles",
          "Email and password accounts with BCrypt-hashed passwords; every request carries a JWT. Job seekers and employers get separate, role-protected endpoints.",
          "Stateless tokens keep each user's jobs, resume and applications private without server sessions."],
         ["Resume parser", "PDFBox · skill catalog",
          "Reads PDF, DOCX or pasted resumes and pulls out skills using a catalog of about 200 technologies and their spellings (reactjs → React, k8s → Kubernetes).",
          "Normalised skill names make matching reliable when resumes and job ads word things differently."]],
        [["Job sync", "6 sources",
          "Pulls jobs from Remotive, RemoteOK, Arbeitnow and The Muse, plus LinkedIn, Indeed, Naukri and Glassdoor through the JSearch API and Adzuna, using your desired role and top skills as search terms.",
          "Those sites forbid scraping, so jobs come from official APIs, plus a one-click bookmarklet that saves the job you're viewing."],
         ["Match scorer", "0–100 per job",
          "Scores each job on keyword hits and the share of its required skills found on your resume, with bonuses for preferred location and role and penalties for a seniority mismatch.",
          "Showing ✓ matched and missing skills on every job explains the score instead of just ranking."],
         ["Cleanup", "link checker",
          "Re-checks job links and deletes a job (and its application data) when the page returns 404/410 or says the role is closed or filled.",
          "Pages that block the checker (403, 429, timeouts) are retried later, never deleted, so open jobs aren't lost by mistake."]],
        [["PostgreSQL", "JPA",
          "Stores users, jobs, employer postings, applications and preferences, and remembers removed jobs so the next sync doesn't add them back.",
          "Users, jobs and applications are linked records, which a relational database models directly."],
         ["GitHub Actions", "cron every 6 hours",
          "Wakes the app and runs job sync for every user, then cleanup.",
          "Render's free instances sleep after 15 minutes idle, so the app's own schedule can't be relied on."],
         ["Docker on Render", "one image",
          "Builds the frontend and backend into one image and runs it on Render, with secrets passed as environment variables.",
          "One image and one service keep hosting free and simple, and no secret ever lands in the repo."]],
      ],
      challenges: [
        "Getting jobs from LinkedIn, Naukri and Indeed without scraping them: official APIs where they exist, and a bookmarklet that reads the job page you're on",
        "Designing a match score that's fair: keyword weight by where a skill appears, a minimum of five skills so a two-skill job can't hit 100%, and seniority penalties",
        "Deciding safely when a job has closed: delete on 404/410 or a \"no longer accepting applications\" message, but never on a blocked or slow page",
        "Protecting the free JSearch quota with a minimum gap between identical searches",
        "Keeping jobs fresh on a free host that sleeps, by waking it from a GitHub Actions cron",
      ],
      outcome: "Live on Render with code on GitHub. Seekers and employers can sign up, match, apply and track today. On the free plan, the first load after the app has slept takes 30–60 seconds.",
    },
  },
  {
    t: "FlightWise AI",
    stats: [["5", "backend services behind one gateway"], ["9", "technologies"]],
    img: "/projects/flightwise.svg",
    cat: "Full-stack",
    d: "Intelligent flight search and booking platform with personalized recommendations by price, airline, duration, departure time and layovers, plus admin controls for flights, schedules, pricing and bookings. Built on a microservices backend with Spring Cloud Gateway, Eureka, JWT auth, event-driven messaging and AI-powered conversational search.",
    stack: ["Java 21", "Spring Boot", "React.js", "PostgreSQL", "Redis", "Apache Kafka", "Docker", "LangChain4j", "RAG"],
    hue: 200,
    url: "",
    // Case study shown when the card is opened. TODO: add real results (users, latency, accuracy) once you have them.
    caseStudy: {
      when: "June 2026 – present",
      problem:
        "Comparing flights by price, airline, duration, departure time and layovers means jumping between tabs. FlightWise AI puts search, comparison and booking in one place, recommends flights from your preferences, and lets you ask for flights in plain English. Admins get controls for flights, schedules, pricing and bookings.",
      // System design. Each node is [name, sub, what it does, why this choice]; tapping a box shows the last two.
      // TODO: check the explanations match exactly how you built it, and edit them in your own words.
      architecture: [
        [["React.js frontend", "Material UI · Tailwind CSS",
          "Search screen with filters, the booking flow, the admin dashboard and the chat-style AI search.",
          "Components keep search results, filters and booking state in sync. Material UI and Tailwind give a consistent look without hand-writing every style."]],
        [["Spring Cloud Gateway", "routing · JWT auth",
          "The single entry point for every request. It routes each call to the right service and checks the JWT before letting it through.",
          "Authentication happens once at the edge instead of being repeated in every service, and the frontend only ever talks to one URL."],
         ["Eureka", "service discovery",
          "A service registry. Each service registers itself when it starts, and the gateway asks Eureka where to send traffic.",
          "No hard-coded hosts or ports, so a service can restart, move or run several copies without any config change."]],
        [["Flight service", "Spring Boot",
          "Owns flights, schedules and prices. Handles search and filtering by price, airline, duration, departure time and layovers, plus admin edits.",
          "Search is read-heavy and changes on its own schedule, so it can scale and deploy separately from booking."],
         ["Booking service", "Spring Boot",
          "Creates and manages bookings, and publishes an event to Kafka whenever a booking changes.",
          "Booking has its own data and rules. Keeping it separate means a flood of searches can't slow down people who are trying to book."],
         ["AI search", "LangChain4j · RAG",
          "Turns a plain-English request like “cheapest evening flight to Delhi next Friday” into a real search over the flight catalogue.",
          "RAG grounds every answer in actual flight data, so the model suggests flights that exist instead of making them up."]],
        [["PostgreSQL", "data",
          "The source of truth for flights, users and bookings.",
          "Bookings need transactions: a booking and the seats it uses must change together or not at all, which a relational database guarantees."],
         ["Redis", "fast lookups",
          "Caches popular search results and frequent lookups in memory.",
          "The same routes get searched again and again. Answering them from memory is much faster and takes load off PostgreSQL."],
         ["Apache Kafka", "events",
          "The event bus. Booking events flow to whichever services need to react to them.",
          "Services stay loosely coupled: booking doesn't call other services directly, so it keeps working even if one of them is slow or down."]],
      ],
      challenges: [
        "Splitting the backend into Spring Boot microservices behind one gateway, with Eureka so services find each other without hard-coded addresses",
        "Keeping services in step with event-driven messaging on Kafka instead of services calling each other directly",
        "Grounding the conversational search in real flight data with LangChain4j and RAG, so answers come from the catalogue instead of guesses",
        "Securing every route with JWT authentication at the gateway",
      ],
      outcome: "In active development. Search, recommendations, admin tools and AI-powered conversational search are built on a containerised (Docker) microservices backend.",
    },
  },
  {
    t: "AI Dental Condition Detection",
    stats: [["4", "conditions detected on X-rays"], ["YOLOv5", "object-detection model"]],
    img: "/projects/dental.svg",
    cat: "AI / ML",
    d: "Detects caries, deep caries, impacted teeth and peripheral lesions in panoramic dental X-rays using a YOLOv5 model, with annotated bounding-box results. A Flask web app lets users upload X-rays, run them through the model and view or download the results.",
    stack: ["Python", "PyTorch", "YOLOv5", "OpenCV", "Flask", "JavaScript"],
    hue: 18,
    url: "",
    // TODO: add model results (mAP, precision/recall) and dataset size if you have them.
    caseStudy: {
      when: "April 2026 – present",
      problem:
        "Spotting caries, deep caries, impacted teeth and peripheral lesions on panoramic dental X-rays takes time and a trained eye. This system flags them automatically and draws labelled boxes around each finding, so an X-ray can be reviewed at a glance.",
      architecture: [
        [["Upload X-ray", "HTML · CSS · JavaScript"]],
        [["Flask web app", "Python"]],
        [["OpenCV", "image processing"], ["YOLOv5 model", "PyTorch"]],
        [["Annotated result", "view · download"]],
      ],
      challenges: [
        "Training a YOLOv5 model to tell four different dental conditions apart on panoramic X-rays",
        "Turning the model into a tool anyone can use: a Flask app that handles upload, inference and download",
        "Drawing clear bounding boxes and labels with OpenCV so the results are easy to read",
      ],
      outcome: "Working end to end: upload a panoramic X-ray, get annotated detections for four conditions, and download the result.",
    },
  },
  // From your LinkedIn summary. TODO: add the real tech stack for the last five and a link for each.
  {
    t: "Car Rental Management System",
    stats: [["DLithe", "internship project"], ["6", "technologies"]],
    img: "/projects/car-rental.svg",
    cat: "Full-stack",
    d: "Rental platform where users browse available vehicles, register accounts, book cars and manage their reservations through a responsive interface. Built during my DLithe internship.",
    stack: ["HTML", "CSS", "JavaScript", "React.js", "PHP", "SQL"],
    hue: 38,
    url: "",
  },
  {
    t: "Full-Stack E-Commerce Application",
    stats: [["Full-stack", "auth, REST API and CRUD"]],
    img: "/projects/ecommerce.svg",
    cat: "Full-stack",
    d: "Full-stack online store with authentication, API integration and CRUD operations over the product and order data.",
    stack: ["Full-stack", "Authentication", "REST API", "CRUD"],
    hue: 330,
    url: "",
  },
  {
    t: "Currency Converter",
    stats: [["KodNest", "internship project"], ["REST", "API integration"]],
    img: "/projects/currency.svg",
    cat: "Full-stack",
    d: "Full-stack currency converter with REST API integration, a responsive UI and database connectivity. Built at KodNest.",
    stack: ["REST API", "Responsive UI", "Database"],
    hue: 150,
    url: "https://github.com/guruprasadgp22/Currency-Converter",
  },
  {
    t: "QuickNote",
    stats: [["Live", "demo on Vercel"], ["KodNest", "internship project"]],
    img: "/projects/quicknote.svg",
    cat: "Web app",
    d: "Note-taking app with create, edit and delete, a responsive UI and persistent storage. Built at KodNest.",
    stack: ["CRUD", "REST API", "Responsive UI"],
    hue: 50,
    url: "https://github.com/guruprasadgp22/Quick-Note",
    demo: "https://quick-note-phi.vercel.app",
  },
  {
    t: "To-Do List",
    stats: [["KodNest", "internship project"], ["CRUD", "with a database"]],
    img: "/projects/todo.svg",
    cat: "Web app",
    d: "Task manager with CRUD operations, REST API integration and database connectivity. Built at KodNest.",
    stack: ["CRUD", "REST API", "Database"],
    hue: 100,
    url: "",
  },
];

// From your resume and LinkedIn summary. lv = how confident you are with the group (0–100), shown as an LED meter.
// TODO: the lv values are estimates. Set them to what feels right.
export const SKILLS = [
  { h: "Languages", lv: 85, s: ["Java", "Python", "JavaScript", "SQL", "C++"] },
  { h: "Backend", lv: 85, s: ["Spring Framework", "Spring Boot", "Spring Security", "JWT", "Hibernate", "JDBC", "Django", "RESTful APIs", "Microservices"] },
  { h: "Frontend", lv: 80, s: ["React.js", "HTML5", "CSS3", "JavaScript", "Tailwind CSS", "Material UI"] },
  { h: "Databases", lv: 80, s: ["PostgreSQL", "MySQL", "MongoDB", "Oracle SQL", "Redis", "Firebase"] },
  { h: "Cloud & DevOps", lv: 75, s: ["Docker", "Kubernetes", "CI/CD", "Apache Kafka", "Linux/Unix"] },
  { h: "AI / ML", lv: 70, s: ["PyTorch", "YOLOv5", "OpenCV", "LangChain4j", "RAG"] },
  { h: "Tools", lv: 85, s: ["Git", "GitHub", "Maven", "Postman", "IntelliJ IDEA", "VS Code"] },
  { h: "CS, Testing & Soft Skills", lv: 80, s: ["OOP", "Collections Framework", "Database Design", "Manual Testing", "Automation Testing", "Agile", "Leadership", "Time Management"] },
];

// Certifications from your resume and LinkedIn (newest first). by / when / url are optional.
// TODO: add url: "https://..." (the certificate or its verification page) to show a "Verify" link.
export const CERTIFICATIONS = [
  { t: "Java Spring Framework, Spring Boot & Spring AI (Generative AI)", by: "Udemy", when: "May 2026" },
  { t: "Python For Beginners Course In-Depth", by: "Udemy", when: "Apr 2026" },
  { t: "Artificial Intelligence for Beginners: Python and AI Basics", by: "Udemy", when: "Dec 2025" },
  { t: "Full Stack Development in Java and Python", by: "KodNest Technologies", when: "Jun 2025" },
  { t: "SQL (Intermediate)", by: "HackerRank", when: "Dec 2024", url: "https://www.hackerrank.com/certificates/96fb11a6b514" },
  { t: "SQL (Basic)", by: "HackerRank", when: "Dec 2024", url: "https://www.hackerrank.com/certificates/e379be5c665c" },
  { t: "Java (Basic)", by: "HackerRank", when: "Dec 2024", url: "https://www.hackerrank.com/certificates/6f23e9c5497d" },
];

// LeetCode, GFG and Code360 numbers pulled from the public profiles on 17 Oct 2026.
export const PLATFORMS = [
  { n: "LeetCode", c: "#ffa116", val: 444, lbl: "problems solved · 194 E / 201 M / 49 H", meta: [["Rating", "1311"], ["Max streak", "109d"]], url: "https://leetcode.com/u/guruprasadgp22/" },
  { n: "GeeksforGeeks", c: "#2f8d46", val: 652, lbl: "problems solved", meta: [["Score", "1965"], ["Institute", "#1"]], url: "https://www.geeksforgeeks.org/profile/guruprasadgp22" },
  { n: "NeetCode", c: "#ff5fa2", val: 235, lbl: "problems solved · 114 E / 115 M / 6 H", meta: [["Max streak", "135d"], ["Rank", "Top 1.2%"]], url: "https://neetcode.io/user/PrimalPikachu220" },
  { n: "Code360", c: "#f05b5b", val: 4, lbl: "problems · Naukri Code 360", meta: [["Moderate", "1"], ["Hard", "1"]], url: "https://www.naukri.com/code360/profile/guruprasadgp" },
  // Two HackerRank accounts, added together. The card links to the first; both are listed under accounts.
  {
    n: "HackerRank", c: "#c6e55c", val: 93, lbl: "challenges solved · 2 accounts", meta: [["Java", "4★"], ["Certificates", "3"]],
    url: "https://www.hackerrank.com/profile/guruprasad6200",
    accounts: ["https://www.hackerrank.com/profile/guruprasad6200", "https://www.hackerrank.com/profile/gp130143"],
  },
  { n: "HackerEarth", c: "#7b83ff", val: 9, lbl: "problems solved · 35 submissions", meta: [["Score", "160"], ["Rank", "Top 20%"]], url: "https://www.hackerearth.com/@guruprasadgp/" },
  // Loads live while the InterviewBit profile is public. Set val to null to hide the card.
  { n: "InterviewBit", c: "#14b8a6", val: 6, lbl: "problems solved · score 1,228", meta: [["University rank", "#7"], ["Streak", "1d"]], url: "https://www.interviewbit.com/profile/guruprasad-gp_339/" },
];

// score is optional: shown on a split-flap board
export const EDUCATION = [
  {
    yr: "Dec 2020 – May 2024",
    t: "Bachelor of Engineering - Computer Science and Engineering",
    p: "Mangalore Institute of Technology and Engineering, Mangalore, Karnataka",
    score: "7.26 CGPA",
  },
  {
    yr: "Jun 2018 – Mar 2020",
    t: "PUC (Pre-University Course) - Science (PCMCs)",
    p: "Karnataka Public School, Hiriadka, Udupi",
    score: "71.33%",
  },
  {
    yr: "Jun 2017 – May 2018",
    t: "SSLC (10th Standard)",
    p: "M N D S M Aided High School, Mudrady, Udupi",
    score: "86.4%",
  },
];

// "What I'm doing" cards on the About page. icon: code | server | brain | git
export const DOING = [
  { icon: "server", t: "Backend & APIs", d: "Spring Boot microservices, REST APIs, JWT auth and event-driven systems with Kafka, Redis and PostgreSQL." },
  { icon: "code", t: "Frontend development", d: "Responsive React.js interfaces styled with Material UI and Tailwind CSS." },
  { icon: "brain", t: "AI & ML", d: "Computer vision with PyTorch and YOLOv5, and AI-powered search with LangChain4j and RAG." },
  { icon: "git", t: "DevOps & tooling", d: "Docker, Kubernetes and CI/CD pipelines, with Git, Maven and Linux in daily use." },
];

// Tabs in the navbar: [page id, label, icon, short label for the phone tab bar]
export const NAV = [
  ["about", "About", "user"],
  ["experience", "Experience", "briefcase", "Work"],
  ["education", "Education", "cap", "Study"],
  ["journey", "Journey", "route"],
  ["skills", "Skills", "layers"],
  ["projects", "Projects", "folder"],
  ["coding", "Coding", "code"],
  ["contact", "Contact", "mail"],
];
