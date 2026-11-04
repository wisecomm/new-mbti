#!/usr/bin/env node
// Verification harness for new-mbti. Run from the repo root:
//   node .claude/skills/verify/bin/control-mbti.mjs <up|doctor|login|run|results|down> [...]
// Scratch state lives in .verify/ (deleted by `down`); proof lives in .verify-evidence/ (kept).

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, openSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SCRATCH = join(ROOT, ".verify");
const EVIDENCE_ROOT = join(ROOT, ".verify-evidence");
const RUN_FILE = join(SCRATCH, "run.json");
const PORT = Number(process.env.VERIFY_PORT ?? 3100);
const APP_URL = `http://localhost:${PORT}`;
const READY_MARKER = "MBTI 테스트";
const TEST_EMAIL = "verify-user@example.test";
const OTHER_EMAIL = "verify-other@example.test";

const [cmd, ...args] = process.argv.slice(2);
const commands = { up, doctor, login, run, results, down };
if (!commands[cmd]) {
  console.error(`usage: control-mbti.mjs <${Object.keys(commands).join("|")}>`);
  process.exit(2);
}
await commands[cmd](...args).catch((err) => {
  console.error(`✗ ${cmd}: ${err.message}`);
  process.exit(1);
});

// ---------- commands ----------

/** Start local Supabase (if needed) and an isolated `next dev` on PORT, then seed the test users. */
async function up() {
  if (existsSync(RUN_FILE)) throw new Error(`${RUN_FILE} exists: a run is active. Run doctor, or down first.`);
  if (await portInUse(PORT)) throw new Error(`port ${PORT} is already taken by something this run did not start.`);
  if (spawnSync("docker", ["info"], { stdio: "ignore" }).status !== 0)
    throw new Error("Docker daemon not reachable (`docker info` failed). Start Docker Desktop or OrbStack first.");
  mkdirSync(SCRATCH, { recursive: true });

  let startedSupabase = false;
  let sb = supabaseStatus();
  if (!sb) {
    console.log("… starting local Supabase (first run pulls Docker images, can take minutes)");
    sh("npx", ["supabase", "start"], { inherit: true });
    startedSupabase = true;
    sb = supabaseStatus();
    if (!sb) throw new Error("supabase start finished but `supabase status` still fails");
  }
  if (!(await tableExists(sb))) {
    console.log("… applying migrations");
    sh("npx", ["supabase", "migration", "up", "--local"], { inherit: true });
    if (!(await tableExists(sb))) throw new Error("mbti_results still missing after migration up");
  }

  const log = openSync(join(SCRATCH, "next.log"), "w");
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: sb.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sb.publishableKey,
      NEXT_PUBLIC_SITE_URL: APP_URL,
    },
  });
  child.unref();

  const run = { pid: child.pid, port: PORT, appUrl: APP_URL, startedSupabase, supabase: sb, startedAt: new Date().toISOString() };
  writeFileSync(RUN_FILE, JSON.stringify(run, null, 2));

  await waitForReady(60_000);
  for (const email of [TEST_EMAIL, OTHER_EMAIL]) await ensureUser(sb, email, run);
  writeFileSync(RUN_FILE, JSON.stringify(run, null, 2));
  console.log(`✓ up: ${APP_URL} (pid ${child.pid}), supabase ${sb.url}${startedSupabase ? " (started by this run)" : " (already running)"}`);
}

/** Read-only: is this instance worth driving? */
async function doctor() {
  const run = readRun();
  const checks = [];
  const check = async (name, fn) => {
    try {
      const detail = await fn();
      checks.push(["✓", name, detail ?? ""]);
    } catch (err) {
      checks.push(["✗", name, err.message]);
    }
  };

  await check("run file", () => `pid ${run.pid}, port ${run.port}`);
  await check("next dev process alive", () => {
    process.kill(run.pid, 0);
  });
  await check(`port ${run.port} owned by our process group`, () => {
    const owners = lsofPids(run.port);
    const ours = owners.filter((p) => pgid(p) === run.pid);
    if (!ours.length) throw new Error(`owners ${owners.join(",") || "none"}, none in pgid ${run.pid}`);
    return `pids ${ours.join(",")}`;
  });
  await check("app renders /login", async () => {
    const res = await fetch(`${run.appUrl}/login`);
    const body = await res.text();
    if (res.status !== 200 || !body.includes(READY_MARKER)) throw new Error(`status ${res.status}, marker missing`);
  });
  await check("app points at the local Supabase", () => {
    const now = supabaseStatus();
    if (!now) throw new Error("supabase status failed");
    if (now.url !== run.supabase.url) throw new Error(`run uses ${run.supabase.url}, status says ${now.url}`);
    return now.url;
  });
  await check("mbti_results table exists", async () => {
    if (!(await tableExists(run.supabase))) throw new Error("missing; run `npx supabase migration up --local`");
  });
  await check("test user can sign in", async () => {
    await sessionCookies(run, TEST_EMAIL);
  });

  for (const [mark, name, detail] of checks) console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
  if (checks.some(([m]) => m === "✗")) process.exit(1);
}

/** Write a Playwright storageState for a seeded user (default: the main test user). */
async function login(email = TEST_EMAIL) {
  const run = readRun();
  const path = await writeStorageState(run, email);
  console.log(`✓ login: ${email} -> ${path}`);
}

/**
 * Run a journey module: `run <journey.mjs> [--anon] [--as other]`.
 * The module's default export receives { page, context, step, shot, db, appUrl, evidence }.
 */
async function run(journeyPath, ...flags) {
  if (!journeyPath) throw new Error("usage: run <journey.mjs> [--anon] [--as other]");
  const state = readRun();
  const anon = flags.includes("--anon");
  const email = flags.includes("--as") && flags[flags.indexOf("--as") + 1] === "other" ? OTHER_EMAIL : TEST_EMAIL;

  const name = journeyPath.split("/").pop().replace(/\.mjs$/, "");
  const evidence = join(EVIDENCE_ROOT, `${new Date().toISOString().replace(/[:.]/g, "-")}-${name}`);
  mkdirSync(evidence, { recursive: true });

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: state.appUrl,
    locale: "ko-KR",
    storageState: anon ? undefined : await writeStorageState(state, email),
  });
  const page = await context.newPage();
  const transcript = [];
  let n = 0;
  const shot = async (label) => {
    const file = join(evidence, `${String(++n).padStart(2, "0")}-${label}`);
    await page.screenshot({ path: `${file}.png`, fullPage: true });
    writeFileSync(`${file}.aria.txt`, await page.locator("body").ariaSnapshot());
    return file;
  };
  const step = async (label, fn) => {
    try {
      const detail = await fn();
      transcript.push(`✓ ${label}${detail ? ` — ${detail}` : ""}`);
      console.log(transcript.at(-1));
    } catch (err) {
      transcript.push(`✗ ${label} — ${err.message}`);
      console.log(transcript.at(-1));
      await shot(`FAILED-${label.replace(/\W+/g, "-")}`).catch(() => {});
      throw err;
    }
  };
  // Fixture setup and read-only proof only; journeys must drive the behavior under test through the UI.
  const who = (alias) => (alias === "other" ? OTHER_EMAIL : alias ?? email);
  const db = {
    results: (alias) => resultsFor(state, who(alias)),
    insert: (alias, scores) => insertResult(state, who(alias), scores),
    clear: (alias) => clearResults(state, who(alias)),
  };

  let failed = false;
  try {
    const mod = await import(pathToFileURL(resolve(journeyPath)).href);
    await mod.default({ page, context, step, shot, db, appUrl: state.appUrl, evidence, email });
  } catch {
    failed = true;
  } finally {
    writeFileSync(join(evidence, "transcript.txt"), `${journeyPath} as ${anon ? "anonymous" : email}\n${transcript.join("\n")}\n`);
    await browser.close();
  }
  console.log(`${failed ? "✗" : "✓"} evidence: ${evidence}`);
  if (failed) process.exit(1);
}

/** Read-only second view of stored results: `results [other]`. */
async function results(who) {
  const state = readRun();
  console.log(JSON.stringify(await resultsFor(state, who === "other" ? OTHER_EMAIL : TEST_EMAIL), null, 2));
}

/** Tear down only what `up` started. Keeps .verify-evidence/. */
async function down() {
  if (!existsSync(RUN_FILE)) {
    rmSync(SCRATCH, { recursive: true, force: true });
    console.log("nothing to tear down (no .verify/run.json); removed any partial .verify/");
    return;
  }
  const state = readRun();
  try {
    process.kill(-state.pid, "SIGTERM");
    console.log(`✓ stopped next dev process group ${state.pid}`);
  } catch {
    console.log(`· next dev process group ${state.pid} already gone`);
  }
  if (state.supabase) {
    // `supabase stop` keeps the data volume, so delete every verify user (seeded and journey sign-ups,
    // cascading their results) either way; `up` recreates the seeded ones. Guest sessions the app
    // created during this run go too; anonymous users from before startedAt are not ours.
    const startedAt = new Date(state.startedAt);
    const { users } = await admin(state.supabase, "GET", `/auth/v1/admin/users?per_page=1000`);
    const ours = users.filter(
      (u) =>
        /^verify-.*@example\.test$/.test(u.email ?? "") || (u.is_anonymous === true && new Date(u.created_at) >= startedAt),
    );
    for (const u of ours) await admin(state.supabase, "DELETE", `/auth/v1/admin/users/${u.id}`);
    console.log(`✓ removed ${ours.length} verify and guest users`);
  }
  if (state.startedSupabase) {
    sh("npx", ["supabase", "stop"], { inherit: true });
    console.log("✓ stopped local Supabase (this run started it)");
  } else {
    console.log("· left the shared Supabase running");
  }
  rmSync(SCRATCH, { recursive: true, force: true });
  console.log(`✓ removed .verify/ (evidence kept in ${EVIDENCE_ROOT})`);
}

// ---------- helpers ----------

function readRun() {
  if (!existsSync(RUN_FILE)) throw new Error("no active run; start one with `up`");
  return JSON.parse(readFileSync(RUN_FILE, "utf8"));
}

function sh(command, argv, { inherit = false } = {}) {
  const res = spawnSync(command, argv, { cwd: ROOT, stdio: inherit ? "inherit" : "pipe", encoding: "utf8" });
  if (res.status !== 0) throw new Error(`${command} ${argv.join(" ")} exited ${res.status}${res.stderr ? `: ${res.stderr.trim()}` : ""}`);
  return res.stdout;
}

/** Parsed `supabase status -o env`, or null when local Supabase isn't running. */
function supabaseStatus() {
  const res = spawnSync("npx", ["supabase", "status", "-o", "env"], { cwd: ROOT, encoding: "utf8" });
  if (res.status !== 0) return null;
  const env = Object.fromEntries(
    res.stdout
      .split("\n")
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  const url = env.API_URL;
  const publishableKey = env.PUBLISHABLE_KEY ?? env.ANON_KEY;
  const secretKey = env.SECRET_KEY ?? env.SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !secretKey) return null;
  return { url, publishableKey, secretKey };
}

async function admin(sb, method, path, body) {
  const res = await fetch(`${sb.url}${path}`, {
    method,
    headers: { apikey: sb.secretKey, Authorization: `Bearer ${sb.secretKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function tableExists(sb) {
  const res = await fetch(`${sb.url}/rest/v1/mbti_results?select=id&limit=1`, {
    headers: { apikey: sb.secretKey, Authorization: `Bearer ${sb.secretKey}` },
  });
  return res.ok;
}

/** Create (or reset the password of) a confirmed email user. Records its id and password in the run. */
async function ensureUser(sb, email, state) {
  const password = randomBytes(18).toString("base64url");
  const list = await admin(sb, "GET", `/auth/v1/admin/users?per_page=1000`);
  const existing = list.users.find((u) => u.email === email);
  const user = existing
    ? await admin(sb, "PUT", `/auth/v1/admin/users/${existing.id}`, { password })
    : await admin(sb, "POST", "/auth/v1/admin/users", { email, password, email_confirm: true });
  state.users = { ...state.users, [email]: user.id };
  state.passwords = { ...state.passwords, [email]: password };
}

/** Sign in through @supabase/ssr exactly like the app's server client, capturing the cookies it sets. */
async function sessionCookies(state, email) {
  const { createServerClient } = await import("@supabase/ssr");
  const jar = new Map();
  const supabase = createServerClient(state.supabase.url, state.supabase.publishableKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: state.passwords[email] });
  if (error) throw new Error(`sign-in for ${email} failed: ${error.message}`);
  return [...jar].map(([name, value]) => ({ name, value }));
}

async function writeStorageState(state, email) {
  const cookies = (await sessionCookies(state, email)).map(({ name, value }) => ({
    name,
    value,
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
  const path = join(SCRATCH, `state-${email.split("@")[0]}.json`);
  writeFileSync(path, JSON.stringify({ cookies, origins: [] }, null, 2));
  return path;
}

async function resultsFor(state, email) {
  const id = state.users?.[email];
  if (!id) throw new Error(`no seeded user ${email}`);
  const res = await fetch(
    `${state.supabase.url}/rest/v1/mbti_results?user_id=eq.${id}&select=*&order=created_at.desc`,
    { headers: { apikey: state.supabase.secretKey, Authorization: `Bearer ${state.supabase.secretKey}` } },
  );
  if (!res.ok) throw new Error(`results query -> ${res.status} ${await res.text()}`);
  return res.json();
}

function restHeaders(sb, extra = {}) {
  return { apikey: sb.secretKey, Authorization: `Bearer ${sb.secretKey}`, "Content-Type": "application/json", ...extra };
}

/** Fixture: store a questionnaire result for a seeded user, bypassing the UI. Returns the row. */
async function insertResult(state, email, scores) {
  const res = await fetch(`${state.supabase.url}/rest/v1/mbti_results`, {
    method: "POST",
    headers: restHeaders(state.supabase, { Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: state.users[email],
      submission_id: crypto.randomUUID(),
      method: "questionnaire",
      method_version: "verify-fixture",
      ...scores,
    }),
  });
  if (!res.ok) throw new Error(`insert fixture -> ${res.status} ${await res.text()}`);
  return (await res.json())[0];
}

/** Fixture: delete every result of a seeded user. */
async function clearResults(state, email) {
  const res = await fetch(`${state.supabase.url}/rest/v1/mbti_results?user_id=eq.${state.users[email]}`, {
    method: "DELETE",
    headers: restHeaders(state.supabase),
  });
  if (!res.ok) throw new Error(`clear fixture -> ${res.status} ${await res.text()}`);
}

async function waitForReady(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${APP_URL}/login`);
      if (res.status === 200 && (await res.text()).includes(READY_MARKER)) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`app not ready after ${timeoutMs / 1000}s; see .verify/next.log`);
}

async function portInUse(port) {
  return lsofPids(port).length > 0;
}

function lsofPids(port) {
  const res = spawnSync("lsof", ["-t", `-iTCP:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
  return res.stdout.split("\n").filter(Boolean).map(Number);
}

function pgid(pid) {
  const res = spawnSync("ps", ["-o", "pgid=", "-p", String(pid)], { encoding: "utf8" });
  return Number(res.stdout.trim());
}
