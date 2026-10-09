// Deploy the museum: scrape the configured Instagram account, build the static site, and push it to the branch
// GitHub Pages serves.
//
//   npm run deploy                     scrape (new posts only), build, push
//   npm run deploy -- --offline        don't download, rebuild from what is already downloaded
//   npm run deploy -- --skip-scrape    use data/ and public/pictures/ as they are
//   npm run deploy -- --no-push        stop after the build (the site is in out/)
//
// Reads museum.config.json (scripts/config.mjs). deploy.remote is a git remote of this repo (or a URL) and
// deploy.branch the branch to publish to (gh-pages); in the repository's Settings > Pages, set the source to
// "Deploy from a branch", that branch, folder / (root). The site is served at https://<user>.github.io/<repo>/,
// so it is built under /<repo> unless deploy.basePath or deploy.cname say otherwise.
//
// Each deploy commits the site to a local repository kept in .deploy/ and force-pushes it: the branch holds only
// the built site, and photos already pushed are not uploaded again.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadConfig, ROOT } from "./config.mjs";
import { scrape } from "./scrape.mjs";

const OUT = path.join(ROOT, "out");
const CACHE = path.join(ROOT, ".deploy");
const args = new Set(process.argv.slice(2));

function run(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { stdio: "inherit", cwd: ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${argv.join(" ")} failed (exit ${r.status})`);
  return r;
}
function git(argv, cwd = ROOT) {
  const r = spawnSync("git", argv, { cwd, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** The remote's URL: deploy.remote itself when it is one, else that remote of this repository. */
function remoteUrl(remote) {
  if (/^(https?:\/\/|git@|ssh:\/\/|file:\/\/)/.test(remote) || /[\\/]/.test(remote)) return remote;
  return git(["remote", "get-url", remote]);
}

/** Where GitHub Pages serves the site from the remote's URL: "/<repo>" for a project site, "" for <user>.github.io. */
function pagesOf(url) {
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(url ?? "");
  if (!m) return null;
  const [, owner, repo] = m;
  const userSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  return {
    basePath: userSite ? "" : `/${repo}`,
    url: userSite ? `https://${repo}/` : `https://${owner.toLowerCase()}.github.io/${repo}/`,
  };
}

const config = loadConfig();
const d = config.deploy;
const push = !args.has("--no-push");

// 1. the data
if (!args.has("--skip-scrape")) scrape(config, { offline: args.has("--offline") });

// 2. where it will be served
const url = remoteUrl(d.remote);
if (push && !url) {
  throw new Error(
    `No git remote "${d.remote}". Add your GitHub repository (git remote add ${d.remote} <url>), or set deploy.remote ` +
      "in museum.config.json to its URL."
  );
}
const pages = pagesOf(url);
const basePath = d.basePath ?? (d.cname ? "" : (pages?.basePath ?? ""));
const siteUrl = d.cname ? `https://${d.cname}/` : (pages?.url ?? null);

// 3. the static site, in out/
console.log(`\nBuilding the site${basePath ? ` under ${basePath}` : ""} ...`);
run(process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "build"], {
  env: { ...process.env, MUSEUM_BASE_PATH: basePath },
});
// GitHub Pages runs sites through Jekyll unless told not to, which drops the _next/ folder
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
if (d.cname) fs.writeFileSync(path.join(OUT, "CNAME"), `${d.cname}\n`);
if (!push) {
  console.log(`\nBuilt in out/. To look at it: npx serve out${basePath ? ` (it expects to be served under ${basePath})` : ""}`);
  process.exit(0);
}

// 4. publish: the site as the branch's only content
if (!fs.existsSync(path.join(CACHE, ".git"))) {
  fs.mkdirSync(CACHE, { recursive: true });
  run("git", ["init", "-q"], { cwd: CACHE });
  run("git", ["checkout", "-q", "-b", d.branch], { cwd: CACHE });
}
for (const name of fs.readdirSync(CACHE)) if (name !== ".git") fs.rmSync(path.join(CACHE, name), { recursive: true, force: true });
fs.cpSync(OUT, CACHE, { recursive: true });
run("git", ["add", "-A"], { cwd: CACHE });
if (git(["status", "--porcelain"], CACHE)) {
  run("git", ["commit", "-q", "-m", `Deploy ${new Date().toISOString().slice(0, 16).replace("T", " ")}`], { cwd: CACHE });
} else {
  console.log("Nothing changed since the last deploy.");
}
console.log(`\nPushing to ${url} (${d.branch}) ...`);
run("git", ["push", "--force", url, `HEAD:${d.branch}`], { cwd: CACHE });
console.log(`\nDeployed.${siteUrl ? ` The museum will be at ${siteUrl} in a minute or two.` : ""}`);
