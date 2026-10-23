// Live button, plus the "may take ~30 s" note and demo logins for a sleeping free server.
export default function LiveNote({ p }) {
  if (!p.demo) return null;
  const logins = p.demoLogins?.filter((l) => l.email) || [];
  return (
    <>
      {/* short pill; the full explanation is in its tooltip */}
      {p.wake && (
        <p className="sc-wake" title="Free server: the first load can take about 30 seconds while it wakes up. It started waking when you opened this page.">
          <i aria-hidden="true" />Free server · first load can take ~30 s
        </p>
      )}
      {logins.length > 0 && (
        <dl className="sc-logins">
          <dt>Try it without signing up</dt>
          {logins.map((l) => <dd key={l.as}><b>{l.as}</b> <code>{l.email}</code> / <code>{l.password}</code></dd>)}
        </dl>
      )}
    </>
  );
}
