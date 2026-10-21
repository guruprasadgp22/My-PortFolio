// Keeps the Job Board demo awake. Render's free plan puts a service to sleep after 15 minutes without traffic,
// and waking it takes 30-60 seconds, which looks broken to a recruiter. Netlify runs this every 10 minutes
// (scheduled functions are free on every plan), so the service never goes idle.
// Note: Render gives 750 free instance hours a month per workspace, and one always-on service uses about 744.
const URLS = ["https://job-board-6ev5.onrender.com/actuator/health"];

export default async () => {
  const results = await Promise.allSettled(URLS.map((u) => fetch(u, { signal: AbortSignal.timeout(25000) })));
  results.forEach((r, i) => console.log(URLS[i], r.status === "fulfilled" ? r.value.status : String(r.reason)));
  return new Response("ok");
};

export const config = { schedule: "*/10 * * * *" };
