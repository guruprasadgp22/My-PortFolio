#!/usr/bin/env node
/*
  Database setup from your own computer (reads MONGODB_URI from .env):
    npm run admin:user          create the one admin user (or change its password); asks for the password
    npm run db:seed             copy the Learning courses from src/data.js into an empty database, add indexes
  There is only ever one admin: creating a user replaces any other, and signs out old sessions.
*/
import { createInterface } from "node:readline";
import { db } from "../netlify/lib/db.mjs";
import { hashPassword } from "../netlify/lib/auth.mjs";
import { cleanLearning } from "../netlify/lib/validate.mjs";

const [cmd, arg] = process.argv.slice(2);

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : s.replace(/[^\r\n]/g, "")); // don't echo the password
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), hidden && process.stdout.write("\n"), resolve(a))));
}

async function createUser() {
  const username = (arg || (await ask("Admin username: "))).trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error("Username: 3–40 characters, letters, numbers, . _ -");
  const password = await ask("Password (at least 12 characters): ", { hidden: true });
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  if ((await ask("Repeat password: ", { hidden: true })) !== password) throw new Error("Passwords don't match");
  const d = await db();
  const admins = d.collection("admins");
  const old = await admins.findOne({ _id: username });
  await admins.deleteMany({ _id: { $ne: username } }); // one admin only
  await admins.updateOne(
    { _id: username },
    { $set: { hash: await hashPassword(password), fails: 0, lockUntil: null, updatedAt: new Date() }, $inc: { version: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(old ? `Password changed for "${username}" (old sessions signed out).` : `Admin "${username}" created. Sign in at /#admin`);
}

async function seed() {
  const d = await db();
  await d.collection("learning").createIndex({ group: 1, order: 1 });
  await d.collection("contests").createIndex({ date: -1 });
  const learning = d.collection("learning");
  if (await learning.countDocuments()) {
    console.log("Learning already has courses; nothing copied.");
  } else {
    const courses = await builtIn();
    const docs = courses.map((c) => {
      const r = cleanLearning(c);
      if (r.error) throw new Error(`${c.title}: ${r.error}`);
      return { _id: c.list, ...r.value, order: c.order, updatedAt: new Date() };
    });
    await learning.insertMany(docs);
    console.log(`Copied ${docs.length} Learning courses into the database.`);
  }
  await d.collection("meta").updateOne({ _id: "content" }, { $set: { at: new Date().toISOString() } }, { upsert: true });
}

// The same list as BUILT_IN in src/learning.js (that file imports JSON, which plain Node can't without an attribute).
async function builtIn() {
  const { LEARNING } = await import("../src/data.js");
  const { readFile } = await import("node:fs/promises");
  const lists = JSON.parse(await readFile(new URL("../src/learning.json", import.meta.url)));
  return LEARNING.groups.flatMap((g) => g.tracks.map((t, i) => ({ list: t.list, group: g.id, title: t.title, sub: t.sub || "", done: t.done ?? 0, count: lists[t.list]?.count ?? 1, focus: t.focus || [], order: i })));
}

const run = { user: createUser, seed }[cmd];
if (!run) {
  console.log("Usage: node scripts/admin.mjs user [username] | seed");
  process.exit(1);
}
run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  });
