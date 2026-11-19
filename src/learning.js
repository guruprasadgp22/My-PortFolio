import { LEARNING } from "./data";
import LISTS from "./learning.json";

/*
  Courses for the Learning page, from the database when it has them (saved in the admin page), otherwise the
  ones built into data.js. Each course gets its lesson list from learning.json (a snapshot of the playlist)
  when there is one; a playlist added later in the admin page simply shows without the list.
*/
export const GROUPS = [...LEARNING.groups.map(({ tracks: _t, ...g }) => g), { id: "other", title: "Other courses", icon: "book" }];

// The built-in courses, in the shape the database stores (also what the admin page imports).
export const BUILT_IN = LEARNING.groups.flatMap((g) =>
  g.tracks.map((t, i) => ({ list: t.list, group: g.id, title: t.title, sub: t.sub || "", done: t.done ?? 0, count: LISTS[t.list]?.count ?? 1, focus: t.focus || [], order: i }))
);

// The playlist as YouTube has it now (live, from /api/playlists), keeping the hand-tidied titles from
// learning.json for videos it already has; without a live copy, the built-in one.
function lessonsOf(list, live) {
  const snap = LISTS[list]?.lessons || [];
  if (!live?.lessons?.length) return snap;
  const known = new Map(snap.map((l) => [l.v, l]));
  return live.lessons.map((l) => {
    const k = known.get(l.v);
    return k ? { ...l, t: k.t, ...(k.lc ? { lc: k.lc } : {}) } : l;
  });
}

export function coursesFrom(content, live) {
  const saved = content?.learning?.length ? content.learning : BUILT_IN;
  return saved.map((c) => {
    const lessons = lessonsOf(c.list, live?.[c.list]);
    return { focus: [], ...c, lessons, count: Math.max(c.count || 0, lessons.length) || 1 };
  });
}
