// Instagram page to museum data: download the configured account's posts with gallery-dl, then write
// data/pictures.json and copy the images it names into public/pictures/ (both kept out of git).
//
//   npm run scrape               download new posts, then rebuild the data
//   npm run scrape -- --offline  rebuild the data from what is already downloaded
//
// Reads museum.config.json (scripts/config.mjs): instagram.account, .browser and .downloads, and posts.from / .to
// (only posts in that range are downloaded and shown).
//
// gallery-dl (https://github.com/mikf/gallery-dl) is found as `gallery-dl`, else run through `uvx gallery-dl` or
// `py -m gallery_dl` / `python -m gallery_dl`; install it with `pip install gallery-dl` or `uv tool install
// gallery-dl`. It borrows the browser's Instagram login (Instagram shows a profile's posts only to a logged-in
// visitor) and downloads only what it does not have yet.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig, ROOT, username } from "./config.mjs";

const DATA = path.join(ROOT, "data", "pictures.json");
const PICTURES = path.join(ROOT, "public", "pictures");
/** Image types the browser decodes and the gallery hangs (videos and the rest are skipped). */
const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "webp"]);

// Windows runs the commands through the shell (to find .cmd / .exe shims), which needs arguments with spaces quoted.
const WIN = process.platform === "win32";
const q = (a) => (WIN && /[\s()<>&|]/.test(a) ? `"${a}"` : a);

/** The first way of running gallery-dl that works here. */
function galleryDl() {
  const tries = [["gallery-dl"], ["uvx", "gallery-dl"], ["py", "-m", "gallery_dl"], ["python", "-m", "gallery_dl"]];
  for (const cmd of tries) {
    const r = spawnSync(cmd[0], [...cmd.slice(1), "--version"], { encoding: "utf8", shell: WIN });
    if (r.status === 0) return cmd;
  }
  throw new Error("gallery-dl was not found. Install it with `pip install gallery-dl` or `uv tool install gallery-dl`.");
}

/** gallery-dl's --filter for posts.from / .to (both days included), or null. */
function dateFilter({ from, to }) {
  const day = (d) => {
    const [y, m, dd] = d.split("-").map(Number);
    return `datetime(${y}, ${m}, ${dd})`;
  };
  const next = (d) => new Date(Date.parse(`${d}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
  const parts = [];
  if (from) parts.push(`date >= ${day(from)}`);
  if (to) parts.push(`date < ${day(next(to))}`);
  return parts.length ? parts.join(" and ") : null;
}

function download(user, config) {
  const cmd = galleryDl();
  const filter = dateFilter(config.posts);
  const args = [
    ...cmd.slice(1),
    "--cookies-from-browser", config.instagram.browser,
    "--write-metadata",
    "-d", path.resolve(ROOT, config.instagram.downloads),
    ...(filter ? ["--filter", filter] : []),
    `https://www.instagram.com/${user}/`,
  ];
  console.log(`> ${cmd[0]} ${args.join(" ")}`);
  const r = spawnSync(cmd[0], args.map(q), { stdio: "inherit", shell: WIN });
  // gallery-dl exits non-zero when some posts failed (a video, a hiccup); what it saved is still used
  if (r.status !== 0) console.warn(`gallery-dl exited with ${r.status}; building from what was downloaded.`);
}

/** Every image post in a gallery-dl folder (one metadata file per image, "<image>.json") in the date range,
 *  oldest first. */
function readPosts(folder, { from, to }) {
  const pictures = [];
  let account = null;
  let skipped = 0;
  for (const name of fs.readdirSync(folder)) {
    if (!name.endsWith(".json") || name === "info.json") continue;
    const image = name.slice(0, -".json".length);
    const meta = JSON.parse(fs.readFileSync(path.join(folder, name), "utf8"));
    account ??= meta.username ? { username: meta.username, fullname: meta.fullname || meta.username } : null;
    const date = String(meta.post_date ?? meta.date).slice(0, 10);
    if ((from && date < from) || (to && date > to)) continue;
    if (!IMAGE_TYPES.has(String(meta.extension).toLowerCase()) || !fs.existsSync(path.join(folder, image))) {
      skipped++;
      continue;
    }
    const shortcode = meta.post_shortcode ?? meta.shortcode;
    pictures.push({
      image_name: image,
      date,
      description: meta.description ?? "",
      width: meta.width,
      height: meta.height,
      url: meta.post_url ?? (shortcode ? `https://www.instagram.com/p/${shortcode}/` : null),
    });
  }
  pictures.sort((a, b) => a.date.localeCompare(b.date) || a.image_name.localeCompare(b.image_name));
  return { account, pictures, skipped };
}

/** Download (unless offline) and write the museum's data; returns the number of pictures. */
export function scrape(config = loadConfig(), { offline = false } = {}) {
  const user = username(config.instagram.account);
  if (!user) throw new Error("Set instagram.account in museum.config.json (copy museum.config.example.json).");
  if (!offline) download(user, config);
  const folder = path.resolve(ROOT, config.instagram.downloads, "instagram", user);
  if (!fs.existsSync(folder)) throw new Error(`Nothing downloaded: ${folder} does not exist.`);

  const { account, pictures, skipped } = readPosts(folder, config.posts);
  if (!pictures.length) throw new Error(`No images in ${folder} for the configured dates.`);
  const data = {
    account: { username: user, fullname: account?.fullname ?? user, url: `https://www.instagram.com/${user}/` },
    pictures,
  };
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");

  // public/pictures holds exactly the images the data names
  fs.mkdirSync(PICTURES, { recursive: true });
  const keep = new Set(pictures.map((p) => p.image_name));
  for (const name of fs.readdirSync(PICTURES)) if (!keep.has(name)) fs.rmSync(path.join(PICTURES, name));
  let copied = 0;
  for (const p of pictures) {
    const from = path.join(folder, p.image_name);
    const to = path.join(PICTURES, p.image_name);
    if (fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size) continue;
    fs.copyFileSync(from, to);
    copied++;
  }
  console.log(
    `${data.account.fullname} (@${user}): ${pictures.length} pictures, ${pictures[0].date} to ${pictures.at(-1).date}` +
      `${skipped ? ` (${skipped} videos or missing files skipped)` : ""}; ${copied} images copied to public/pictures.`
  );
  return pictures.length;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  scrape(loadConfig(), { offline: process.argv.includes("--offline") });
}
