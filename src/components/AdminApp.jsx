import { useCallback, useEffect, useState } from "react";
import Admin from "./Admin";

/*
  The admin pages, shown instead of the portfolio (see main.jsx) and kept out of search engines:
    /admin/login  the sign-in page
    /admin        the editor, once signed in
  Moving between them uses the browser history, so Back and Forward work and nothing reloads.
*/
const pageOf = () => (location.pathname.replace(/\/+$/, "") === "/admin/login" ? "login" : "editor");

export default function AdminApp() {
  const [page, setPage] = useState(pageOf);

  useEffect(() => {
    // the portfolio locks window scrolling on wide screens (its cards scroll instead); these pages scroll normally
    document.documentElement.classList.add("admin-mode");
    const onPop = () => setPage(pageOf());
    addEventListener("popstate", onPop);
    // never indexed, never shown in link previews
    const robots = Object.assign(document.createElement("meta"), { name: "robots", content: "noindex, nofollow" });
    document.head.append(robots);
    return () => (removeEventListener("popstate", onPop), robots.remove(), document.documentElement.classList.remove("admin-mode"));
  }, []);

  useEffect(() => {
    document.title = page === "login" ? "Sign in · Site editor" : "Site editor · Guruprasad";
  }, [page]);

  const go = useCallback((path) => {
    if (location.pathname !== path) history.replaceState(null, "", path);
    setPage(pageOf());
    scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /></div>
      <main className={`admin-page ${page}`}>
        <Admin page={page} go={go} />
      </main>
    </>
  );
}
