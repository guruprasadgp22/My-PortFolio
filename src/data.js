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
  timeZone: "Asia/Kolkata", // for the live local time on the Contact page
  replyTime: "I usually reply within 24 hours", // TODO: keep this true, or change it
  // Recruiter quick view and the chatbot use these.
  lookingFor: ["Software Engineer", "Java Developer", "Backend Developer", "Full Stack Developer", "Python Developer"],
  availability: "Available to join immediately",
  // The three things recruiters filter on first, shown as one line under your name and in the quick view.
  // TODO: check the location / work-mode line says what you actually want.
  hiring: ["Available immediately", "Bengaluru / Remote", "SDE-1 · Java Backend"],
  topSkills: ["Java", "Spring Boot", "Python", "React.js", "PostgreSQL", "REST APIs", "Docker", "Microservices"],
  socials: [
    { label: "GitHub", url: "https://github.com/guruprasadgp22" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/guruprasadgp22/" },
    // Add more with the same shape, e.g. { label: "Instagram", url: "..." } or { label: "X", url: "..." }
    { label: "Resume", url: "/Guruprasad_P_updated.pdf" }, // the PDF in the public/ folder
  ],
  // Resume variants. "backend" is offered when a link has ?role=backend or "Match a job" finds a backend role.
  // TODO: put a Java Backend version of your resume in public/ and set backend to its path, e.g. "/Guruprasad_Java_Backend.pdf".
  resumes: { default: "/Guruprasad_P_updated.pdf", backend: "" },
};

export const ABOUT = {
  // Your photo lives at public/me.jpg. Leave "" to show the animated monogram instead.
  photo: "/me.jpg",
  bio: "I'm Guruprasad, a software developer with a Bachelor's degree in Computer Science and Engineering. I enjoy designing and building scalable, secure and user-focused applications.",
  bio2:
    "At Sony India Software Centre I worked in SAP Identity and Access Management: user lifecycle, role-based access control, authentication, authorization and security compliance. Before that I built full-stack apps with Java, Python, Spring Boot, Hibernate and React.js at KodNest, and a Car Rental Management System at DLithe. I'm a quick learner who likes hard problems, and I'm looking for roles as a Software Engineer, Java, Backend, Full Stack or Python Developer.",
  facts: [
    // live = counted from the rest of the site (companies, projects, solved); value is only the fallback
    { value: 3, suffix: "", label: "companies worked with", live: "companies" },
    { value: 1, suffix: " yr", label: "at Sony India" },
    { value: 8, suffix: "", label: "projects built", live: "projects" },
    { value: 1433, suffix: "+", label: "problems solved", live: "solved" },
  ],
  terminal: [
    ["whoami", "guruprasad — software developer (Java · Python · Spring Boot · React)"],
    ["cat focus.txt", "Java · Spring Boot · Microservices · React.js · PostgreSQL"],
    ["echo $LATEST_PROJECT", "Job Board — resume-matched jobs on Spring Boot & React, live on Render"],
    ["cat status", "available to join immediately ✔"],
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
    [{ n: "Spring Security", c: "#6db33f" }, { n: "Docker", c: "#2496ed" }, { n: "PostgreSQL", c: "#699eca" }, { n: "PyTorch", c: "#ee4c2c" }, { n: "Hibernate", c: "#bcae79" }, { n: "MySQL", c: "#00a0c4" }],
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
    { icon: "⌨", title: "Problem Solving", tag: "dsa", back: "Daily DSA practice, mostly on LeetCode, GeeksforGeeks and NeetCode. Live numbers are on the Coding page." },
    { icon: "♫", title: "Music", tag: "focus", back: "Music on while I code. It helps me get into deep focus." },
    { icon: "✈", title: "Travel", tag: "explore", back: "Exploring new places around Karnataka whenever I get the chance." },
  ],
};

// Your story, told the fun way. Shown on the Journey page.
// icon = the emoji on the timeline, ch = starts a new chapter, big = a milestone (highlighted).
export const JOURNEY = [
  { yr: "2018", icon: "🎒", ch: "School days", t: "SSLC cleared with 86.4%", d: "Finished 10th standard with 86.4%. Exams over, holidays on. Best feeling ever.", tags: ["SSLC", "86.4%"] },
  { yr: "2018", icon: "💻", t: "Hello, World!", d: "Picked PCMCs for PUC and wrote my first program in C. It came with my first bug, free of cost.", tags: ["PUC", "PCMCs", "C"] },
  { yr: "2020", icon: "😷", t: "PUC done, then COVID said hi", d: "Wrapped up PUC with 71.33%. Then COVID arrived and the whole world pressed the pause button.", tags: ["PUC", "71.33%"] },
  { yr: "Dec 2020", icon: "🏫", ch: "Engineering", t: "Officially an engineering student", d: "Joined B.E. in Computer Science at MITE, Mangalore. New laptop, big dreams, zero idea what a semicolon could do to me.", tags: ["B.E. CSE", "MITE"] },
  { yr: "2021 – 2023", icon: "🧩", t: "Collecting languages like Pokémon", d: "C led to C++, then Java, JavaScript, Python and more. Gotta code 'em all!", tags: ["C++", "Java", "JavaScript", "Python"] },
  { yr: "Aug 2023", icon: "🚗", t: "First internship at DLithe", d: "Built a Car Rental Management System with React, PHP and SQL. Lots of cars on screen, sadly no free rides.", tags: ["React.js", "PHP", "SQL"] },
  { yr: "May 2024", icon: "🎓", big: true, t: "Engineer, unlocked", d: "Finished my B.E. with a 7.26 CGPA. Four years, endless assignments, one degree, no regrets.", tags: ["Graduated", "7.26 CGPA"] },
  { yr: "May 2024", icon: "📩", big: true, t: "An offer letter from TCS", d: "Got an offer from TCS! Life had other plans and I couldn't join, but it told me I was on the right track.", tags: ["TCS", "Offer letter"] },
  { yr: "Oct 2024", icon: "☕", ch: "Levelling up", t: "Back to coding school at KodNest", d: "Joined KodNest to level up in full stack Java and Python. More code, more coffee, more 'aha!' moments.", tags: ["Java", "Python", "Full Stack"] },
  { yr: "May 2025", icon: "📞", ch: "Industry", big: true, t: "Sony is calling", d: "Got an apprenticeship offer from Sony India. Yes, that Sony! Cue the happy dance.", tags: ["Offer", "Sony"] },
  { yr: "Jun 2025", icon: "🏢", t: "Hello, real IT world", d: "Joined Sony as a Software Developer Apprentice. Learned how a real IT company works: big systems, real users, real deadlines, and SAP access management.", tags: ["Sony", "SAP IAM", "RBAC"] },
  { yr: "Jun 2026", icon: "✅", big: true, t: "Sony chapter complete", d: "Finished my apprenticeship on 2 June 2026, with a backpack full of industry lessons and a lot more confidence.", tags: ["Completed", "Industry ready"] },
  { yr: "Now", icon: "🚀", ch: "Now", t: "Leveling up, every single day", d: "Sharpening DSA, polishing my communication, building projects like FlightWise AI and learning something new daily. Next level loading…", tags: ["DSA", "Communication", "Projects", "Available now"] },
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
    role: "Software Developer Apprentice", // exact title from the resume and offer letter
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
    stats: [["6", "job sources, synced every 6 hours"], ["165", "skills recognised in a resume"]],
    img: "/projects/job-board.jpg",
    phone: "/projects/job-board-phone.jpg",
    cat: "Full-stack",
    d: "Two-sided job platform that matches jobs to your resume. Job seekers upload a resume, get jobs from LinkedIn, Indeed, Naukri, Glassdoor and free job APIs ranked by match %, apply to jobs posted on the site and track every application from Saved to Offer. Employers post jobs and review applicants ranked by how well their resume fits. Closed jobs are detected and removed automatically.",
    stack: ["Java 21", "Spring Boot 3.5", "Spring Security", "JWT", "JPA", "React 18", "Vite", "PostgreSQL", "Docker", "GitHub Actions"],
    hue: 220,
    url: "https://github.com/guruprasadgp22/Job-Board",
    demo: "https://job-board-6ev5.onrender.com/",
    // Free Render plan: the server sleeps when idle. Shows a "may take ~30 s" note, and the site pings it to wake it early.
    wake: "https://job-board-6ev5.onrender.com/actuator/health",
    apiDocs: "https://job-board-6ev5.onrender.com/swagger-ui.html",
    writeup: "/writing/job-board-matching/",
    // TODO: record a 60-second walkthrough (Loom or unlisted YouTube) and paste its link here.
    video: "",
    // TODO: create two demo accounts on the live site and fill these in, so recruiters can look around without signing up.
    demoLogins: [
      // { as: "Job seeker", email: "seeker@demo.dev", password: "…" },
      // { as: "Employer", email: "employer@demo.dev", password: "…" },
    ],
    // Engineering facts shown as badges. ci = the GitHub Actions workflow behind the build-status badge.
    ci: "https://github.com/guruprasadgp22/Job-Board/actions/workflows/ci.yml",
    badges: ["13 unit tests", "Docker", "Java 21", "Swagger / OpenAPI"],
    // Three files worth opening before an interview.
    read: [
      { f: "RelevanceScorer.java", what: "Service logic: how each job gets its 0–100 match score", url: "https://github.com/guruprasadgp22/Job-Board/blob/main/backend/src/main/java/com/guru/jobboard/service/RelevanceScorer.java" },
      { f: "JwtAuthFilter.java", what: "Security: the filter that checks the JWT on every request", url: "https://github.com/guruprasadgp22/Job-Board/blob/main/backend/src/main/java/com/guru/jobboard/security/JwtAuthFilter.java" },
      { f: "RelevanceAndLinkTests.java", what: "Tests: scoring rules and closed-job detection", url: "https://github.com/guruprasadgp22/Job-Board/blob/main/backend/src/test/java/com/guru/jobboard/RelevanceAndLinkTests.java" },
    ],
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
          "Reads PDF, DOCX or pasted resumes and pulls out skills using a catalog of 165 technologies and their spellings (reactjs → React, k8s → Kubernetes).",
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
    stats: [["9", "Spring Boot services behind one gateway"], ["2", "React apps: travellers and admins"]],
    img: "/projects/flightwise/cover.jpg",
    phone: "/projects/flightwise/phone.jpg",
    cat: "Full-stack",
    d: "Flight booking platform built as Spring Boot microservices. Travellers search flights in plain English or with filters, book with their seats held while they pay, and manage trips with PDF e-tickets and calendar reminders. A separate admin console manages flights, bookings, payments and users, with revenue, booking and occupancy dashboards.",
    stack: ["Java 21", "Spring Boot", "Spring Cloud Gateway", "Eureka", "JWT", "PostgreSQL", "React", "Vite", "Tailwind CSS", "Material UI", "Docker"],
    hue: 250,
    url: "https://github.com/guruprasadgp22/flightwise-ai",
    // no demo: it runs locally with Docker Compose. Add demo: "https://…" once it's hosted.
    // Screenshots shown in the case study, in order. src is in public/, cap is the caption.
    shots: [
      { src: "/projects/flightwise/home.jpg", cap: "Home: ask in plain English, e.g. “to Delhi under 6000 for 2”" },
      { src: "/projects/flightwise/flights.jpg", cap: "Flight search with filters, date chips and sorting" },
      { src: "/projects/flightwise/routes.jpg", cap: "Live stats and popular routes with fares" },
      { src: "/projects/flightwise/features.jpg", cap: "What travellers get" },
      { src: "/projects/flightwise/bookings.jpg", cap: "My Bookings: tickets, calendar and cancellation" },
      { src: "/projects/flightwise/profile.jpg", cap: "Profile with travel stats and saved details" },
      { src: "/projects/flightwise/login.jpg", cap: "Login" },
      { src: "/projects/flightwise/register.jpg", cap: "Create account" },
      { src: "/projects/flightwise/admin-login.jpg", cap: "Admin console login" },
      { src: "/projects/flightwise/admin-dashboard.jpg", cap: "Admin dashboard: users, flights, bookings and revenue" },
      { src: "/projects/flightwise/admin-charts.jpg", cap: "Booking overview and payment status charts" },
      { src: "/projects/flightwise/admin-occupancy.jpg", cap: "Flight occupancy and recent bookings" },
      { src: "/projects/flightwise/admin-activity.jpg", cap: "Recent payments and activity" },
      { src: "/projects/flightwise/admin-flights.jpg", cap: "Manage flights: add, edit, delete, status" },
      { src: "/projects/flightwise/admin-bookings.jpg", cap: "Booking management with search and export" },
      { src: "/projects/flightwise/admin-payments.jpg", cap: "Payment management with search and export" },
      { src: "/projects/flightwise/admin-users.jpg", cap: "User management: roles and status" },
    ],
    // Case study shown when the card is opened.
    caseStudy: {
      when: "June 2026 – present",
      problem:
        "Booking a flight usually means filling in the same search form over and over and comparing results by hand. FlightWise AI lets travellers type what they want, like “Bangalore to Delhi tomorrow under 6000”, and get exactly that, then filter by price, departure time and airline and sort by cheapest, fastest, earliest or latest. Booking takes under a minute: saved details fill themselves in, seats are held while you pay, and every trip lives in one place with PDF e-tickets, calendar reminders and one-click cancellation. Admins get their own console to run flights, bookings, payments and users.",
      // System design. Each node is [name, sub, what it does, why this choice]; tapping a box shows the last two.
      architecture: [
        [["Customer site", "React · Vite · Tailwind CSS",
          "Home with the plain-English Ask bar and popular routes, flight search with filters and sorting, booking, My Bookings, profile, and light and dark themes.",
          "Plain-English search is a rule-based parser that runs in the browser and turns a sentence into filters, so it needs no external AI service or API key."],
         ["Admin console", "React · Material UI",
          "Separate admin-only app: dashboard with revenue, booking and payment-status charts and flight occupancy, plus pages to manage flights, bookings, payments and users.",
          "Keeping admin tools in their own app means customers never download admin code, and every admin route is still checked on the server."]],
        [["Spring Cloud Gateway", "JWT · access rules",
          "The only entry point. It verifies every JWT, checks each route as public, logged-in or admin-only, and passes the caller's identity on to the services.",
          "Security is enforced once at the edge, and internal endpoints such as seat reservation are blocked from outside entirely."],
         ["Eureka", "service discovery",
          "Each service registers itself, and the gateway looks up where to send traffic.",
          "No hard-coded hosts or ports, so services can restart or move without config changes."]],
        [["Auth service", "accounts · roles",
          "Registration, login, JWT and refresh tokens, profiles, and admin user management.",
          "Passwords are BCrypt-hashed, and only an admin can create another admin."],
         ["Flight service", "flights · seats",
          "Flights, search and seat inventory.",
          "Seats are reserved with one conditional SQL UPDATE, so a flight can never be oversold."],
         ["Booking service", "bookings · holds",
          "Creates bookings, holds seats while the traveller pays, releases them if the hold expires, and handles cancellation.",
          "Each booking is checked against its owner, so users can only see or cancel their own trips."],
         ["Payment service", "payments · refunds",
          "Takes payments and refunds cancelled bookings. Payments are simulated in this demo.",
          "The amount is always read from the booking on the server, and a booking can only be paid once."],
         ["Notification service", "emails",
          "Sends booking confirmation and cancellation emails.",
          "Email is best-effort: if sending fails, the booking still goes through."],
         ["Dashboard service", "admin stats",
          "Collects the numbers behind the admin dashboard from the other services.",
          "The admin console gets everything in one call instead of querying every service itself."]],
        [["PostgreSQL", "database per service",
          "Each business service has its own database, with tables created by migrations.",
          "Services stay independent: one service's schema changes can't break another."],
         ["Docker Compose", "one command",
          "Builds and starts every service, both front ends and the database together.",
          "The whole system runs on any machine with one command."]],
      ],
      challenges: [
        "Stopping overselling: seat reservation is one conditional SQL UPDATE, so 10 parallel requests for the last 5 seats produce exactly 5 bookings",
        "Holding seats while the traveller pays, and releasing them automatically if the payment isn't finished in time",
        "Making payments tamper-proof: the amount is always taken from the booking on the server, and a booking can only be paid once",
        "Cancelling a paid booking refunds it and releases its seats exactly once, even if cancel is pressed twice",
        "Turning sentences like “Bangalore to Delhi tomorrow under 6000 for 2” into search filters with a rule-based parser that runs in the browser",
        "Keeping the admin console admin-only: the gateway verifies every JWT and checks the role on each route",
      ],
      outcome: "Complete and running locally with Docker Compose. One command starts every service, both front ends and the database. There's no live demo yet, so the screenshots below are from a local run; payments are simulated.",
    },
  },
  {
    t: "AI Dental Condition Detection",
    stats: [["4", "conditions detected on panoramic X-rays"], ["< 2 s", "typical analysis time"]],
    img: "/projects/dental/cover.jpg",
    phone: null, // no mobile screenshot yet: add "/projects/dental/phone.jpg" to show the phone mockup
    cat: "AI / ML",
    d: "Dentes, a web app that screens panoramic dental X-rays. A YOLOv5 model marks caries, deep caries, impacted teeth and peripheral lesions with colour-coded boxes, and you get a findings summary and a report you can print or save as a PDF. Sign in with Google or email; results are deleted automatically after 24 hours.",
    stack: ["Python", "YOLOv5", "PyTorch", "ONNX Runtime", "OpenCV", "Flask", "Firebase Auth", "JavaScript", "Docker"],
    hue: 18,
    url: "https://github.com/guruprasadgp22/Dental-Condition-Detection-System",
    // no demo: render.yaml is ready, add demo: "https://…" once it's deployed.
    // TODO: add model results (mAP, precision/recall) and dataset size if you have them.
    caseStudy: {
      when: "April 2026 – present",
      problem:
        "Spotting caries, deep caries, impacted teeth and peripheral lesions on a panoramic X-ray takes time and a trained eye. Dentes lets you upload an X-ray and, in about two seconds, see each finding boxed and labelled with the model's confidence, a summary with the highest-priority finding, and a printable report. It's a screening aid, not a medical diagnosis.",
      // System design. Each node is [name, sub, what it does, why this choice]; tapping a box shows the last two.
      architecture: [
        [["Web pages", "Flask templates · JavaScript",
          "Home, Scan X-ray, Conditions, Profile and a printable report. Upload by drag-and-drop, click or paste (JPG/PNG up to 10 MB) or try a sample, adjust the confidence threshold, then explore the result: show or hide each condition, toggle boxes and labels, and hover a finding to highlight it.",
          "Plain pages with light and dark mode keep the home page to about 110 KB, down from more than 20 MB of GIFs."],
         ["Firebase Auth", "Google or email",
          "Sign in with Google or email, create an account and reset a forgotten password. Scanning and the profile page need a signed-in user.",
          "Secure accounts without running an auth server, and Firestore rules let each user read and edit only their own profile."]],
        [["Flask server", "Python · gunicorn",
          "Receives the X-ray, runs detection, saves the marked image and findings, and serves the report page. A cleanup step deletes results older than 24 hours.",
          "A small Python server keeps the model, image handling and pages in one app, and old scans don't pile up."]],
        [["YOLOv5 model", "trained in PyTorch",
          "Detects four classes on panoramic X-rays: caries, deep caries, impacted tooth and peripheral lesion.",
          "A one-stage detector finds and labels every region in a single pass, fast enough for a result in about two seconds."],
         ["ONNX Runtime", "inference",
          "Runs the model exported from PyTorch to ONNX, picking CPU, CUDA or Apple MPS automatically.",
          "Hosting needs no PyTorch, so the server uses about 250 MB of RAM and fits on a free plan."],
         ["OpenCV", "image processing",
          "Reads the uploaded X-ray and produces the marked image you can download.",
          "Fast, well-tested image handling in Python with a headless build for servers."]],
        [["Docker", "Render-ready",
          "A Dockerfile and a Render blueprint (render.yaml) build and run the app on any Docker host.",
          "One image runs the same everywhere, and a git push can redeploy it."]],
      ],
      challenges: [
        "Exporting the YOLOv5 model to ONNX so the server runs without PyTorch in about 250 MB of RAM",
        "Cutting the home page from more than 20 MB of GIFs to about 110 KB",
        "Building an interactive viewer: colour-coded boxes, per-condition show/hide, and hover-to-highlight",
        "Keeping scans private: results are deleted after 24 hours, recent scans stay in the browser, and each user can only read their own profile",
        "Making upload easy and safe: drag-and-drop, click or paste, a built-in sample, and a 10 MB limit",
      ],
      outcome: "Working end to end locally: sign in, upload a panoramic X-ray, get marked findings in about two seconds, and print or save the report. The Docker and Render setup is ready, but there's no live demo yet. It's a screening aid, not a medical diagnosis.",
    },
  },
  // training: true = smaller internship / course projects, listed under "Training projects" below the showcase.
  // from = where it was built. TODO: push the code for the ones with url: "" and paste the repo links.
  {
    t: "Car Rental Management System",
    training: true,
    from: "DLithe internship",
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
    training: true,
    from: "Practice project",
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
    training: true,
    from: "KodNest internship",
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
    training: true,
    from: "KodNest internship",
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
    training: true,
    from: "KodNest internship",
    stats: [["KodNest", "internship project"], ["CRUD", "with a database"]],
    img: "/projects/todo.svg",
    cat: "Web app",
    d: "Task manager with CRUD operations, REST API integration and database connectivity. Built at KodNest.",
    stack: ["CRUD", "REST API", "Database"],
    hue: 100,
    url: "",
  },
];

// Grouped skills, no scores. at = where you used it (shown under the chip), so every skill can be backed up in an interview.
// Only list what you've actually used. Removed for now (not in any project yet): Kubernetes, Kafka, Redis, LangChain4j, RAG,
// automation testing. Add one back once a project uses it.
export const SKILLS = [
  { h: "Languages", s: ["Java", "Python", "JavaScript", "SQL", "C++"], at: { Java: "Job Board, FlightWise AI", Python: "Dental detection", JavaScript: "Job Board, FlightWise AI", SQL: "Job Board, FlightWise AI" } },
  { h: "Backend", s: ["Spring Boot", "Spring Security", "JWT", "Spring Cloud Gateway", "Eureka", "Hibernate / JPA", "JDBC", "RESTful APIs", "Microservices", "Flask", "Django"], at: { "Spring Boot": "Job Board, FlightWise AI", "Spring Security": "Job Board", JWT: "Job Board, FlightWise AI", "Spring Cloud Gateway": "FlightWise AI", Eureka: "FlightWise AI", "Hibernate / JPA": "Job Board, KodNest", JDBC: "KodNest", "RESTful APIs": "Job Board, FlightWise AI", Microservices: "FlightWise AI", Flask: "Dental detection", Django: "KodNest" } },
  { h: "Frontend", s: ["React.js", "HTML5", "CSS3", "Tailwind CSS", "Material UI", "Vite"], at: { "React.js": "Job Board, FlightWise AI", "Tailwind CSS": "FlightWise AI", "Material UI": "FlightWise AI", Vite: "Job Board, FlightWise AI" } },
  { h: "Databases", s: ["PostgreSQL", "MySQL", "MongoDB", "Oracle SQL", "Firebase"], at: { PostgreSQL: "Job Board, FlightWise AI", MySQL: "KodNest", MongoDB: "KodNest", "Oracle SQL": "KodNest", Firebase: "Dental detection" } },
  { h: "DevOps", s: ["Docker", "GitHub Actions", "Linux/Unix"], at: { Docker: "Job Board, FlightWise AI, Dental", "GitHub Actions": "Job Board" } },
  { h: "AI / ML", s: ["PyTorch", "YOLOv5", "ONNX Runtime", "OpenCV"], at: { PyTorch: "Dental detection", YOLOv5: "Dental detection", "ONNX Runtime": "Dental detection", OpenCV: "Dental detection" } },
  { h: "Tools", s: ["Git", "GitHub", "Maven", "Postman", "IntelliJ IDEA", "VS Code", "Swagger / OpenAPI"], at: { Maven: "Job Board, FlightWise AI", "Swagger / OpenAPI": "Job Board" } },
  { h: "CS fundamentals & practices", s: ["Data Structures & Algorithms", "OOP", "Collections Framework", "Database Design", "Unit Testing", "Manual Testing", "Agile"], at: { "Data Structures & Algorithms": "LeetCode, GFG, NeetCode", "Unit Testing": "Job Board (JUnit)", "Database Design": "Job Board, FlightWise AI", "Manual Testing": "KodNest" } },
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
  // Platforms with more than one profile list each under accounts (its own number and link). The card's number is
  // the highest account, never the sum, so a problem solved on both accounts isn't counted twice.
  {
    n: "LeetCode", c: "#ffa116", val: 455, lbl: "problems solved · 200 E / 204 M / 51 H · best of 2 accounts", meta: [["Rating", "1311"], ["Max streak", "109d"]],
    url: "https://leetcode.com/u/guruprasadgp22/",
    accounts: [
      { user: "guruprasadgp22", url: "https://leetcode.com/u/guruprasadgp22/", val: 455, note: "200 E / 204 M / 51 H" },
      { user: "guruprasad6200", url: "https://leetcode.com/u/guruprasad6200/", val: 354, note: "133 E / 174 M / 47 H" },
    ],
  },
  // more: true = shown under "More platforms" (collapsed) so the strongest profiles lead.
  { n: "GeeksforGeeks", c: "#2f8d46", val: 652, lbl: "problems solved", meta: [["Score", "1965"], ["Institute", "#1"]], url: "https://www.geeksforgeeks.org/profile/guruprasadgp22" },
  { n: "NeetCode", c: "#ff5fa2", val: 235, lbl: "problems solved · 114 E / 115 M / 6 H", meta: [["Max streak", "135d"], ["Rank", "Top 1.2%"]], url: "https://neetcode.io/user/PrimalPikachu220" },
  { n: "Code360", more: true, c: "#f05b5b", val: 4, lbl: "problems · Naukri Code 360", meta: [["Moderate", "1"], ["Hard", "1"]], url: "https://www.naukri.com/code360/profile/guruprasadgp" },
  {
    n: "HackerRank", more: true, c: "#c6e55c", val: 50, lbl: "challenges solved · best of 2 accounts", meta: [["Java", "4★"], ["Certificates", "3"]],
    url: "https://www.hackerrank.com/profile/guruprasad6200",
    accounts: [
      { user: "guruprasad6200", url: "https://www.hackerrank.com/profile/guruprasad6200", val: 50, note: "Python 3★ · 3 certificates" },
      { user: "gp130143", url: "https://www.hackerrank.com/profile/gp130143", val: 43, note: "Java 4★" },
    ],
  },
  { n: "HackerEarth", more: true, c: "#7b83ff", val: 9, lbl: "problems solved · 35 submissions", meta: [["Score", "160"], ["Rank", "Top 20%"]], url: "https://www.hackerearth.com/@guruprasadgp/" },
  // Loads live while the InterviewBit profile is public. Set val to null to hide the card.
  { n: "InterviewBit", more: true, c: "#14b8a6", val: 6, lbl: "problems solved · score 1,228", meta: [["University rank", "#7"], ["Streak", "1d"]], url: "https://www.interviewbit.com/profile/guruprasad-gp_339/" },
];

// score is optional: shown as plain text under the qualification
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
  { icon: "server", t: "Backend & APIs", d: "Spring Boot REST APIs and microservices with Spring Security, JWT, JPA and PostgreSQL (Job Board, FlightWise AI)." },
  { icon: "code", t: "Frontend development", d: "Responsive React.js interfaces with Vite, Material UI and Tailwind CSS." },
  { icon: "brain", t: "AI & ML", d: "Computer vision with PyTorch and YOLOv5, served through ONNX Runtime (Dental detection)." },
  { icon: "git", t: "DevOps & tooling", d: "Docker images, GitHub Actions for builds and scheduled jobs, with Git, Maven and Linux in daily use." },
];

// Seasonal touches, shown only between from and to (dates in India time). Keep it to a few days a year.
export const FESTIVALS = [
  { kind: "diwali", name: "Happy Deepavali!", from: "2026-11-06", to: "2026-11-10" },
  { kind: "diwali", name: "Happy Deepavali!", from: "2027-10-27", to: "2027-10-31" },
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
