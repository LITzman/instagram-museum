// The museum's config (museum.config.json, see museum.config.example.json and the README), read by next.config.ts
// (which hands it to the app as MUSEUM_CONFIG) and by the scrape and deploy scripts. Every field has a default.

import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");

const DEFAULTS = {
  instagram: {
    /** The account to show: a username, "@username" or the profile's URL. */
    account: "",
    /** The browser whose Instagram login gallery-dl borrows (firefox, chrome, edge, ...). */
    browser: "firefox",
    /** Where gallery-dl downloads to (it makes <downloads>/instagram/<username>/ inside). */
    downloads: "downloads",
  },
  /** Only posts from / to these dates (YYYY-MM-DD, both included); null: no limit. */
  posts: { from: null, to: null },
  /** The museum's wording. Placeholders: {username} {fullname} {count} {from} {to} {firstYear} {lastYear} {years}. */
  titles: {
    /** On the entrance doors, the title card at the top and every wall sign. */
    name: "{fullname}",
    /** The line under the name on the title card. */
    subtitle: "Photographs · {years} · {count} photos",
    /** The browser tab's title and the page description. */
    pageTitle: "{fullname} · a walkable museum",
    description: "Walk a 3D gallery of {fullname}'s photographs from Instagram.",
  },
  look: {
    /** A room style (src/components/museum/theme.ts ROOM_STYLES): "postwar" is a contemporary gallery. */
    style: "postwar",
    /** A wall colour (#rrggbb) and floor (marble, concrete, oak-light, oak-dark, parquet); null: the style's own. */
    wall: "#a9a59f",
    ground: null,
    /** The printed size a photo hangs at, its longer side in cm. */
    printCm: 80,
    /** The language of the dates on the signs ("en-GB": 5 June 2015, "en-US": June 5, 2015, "he-IL" ...). */
    dateLocale: "en-GB",
  },
  deploy: {
    /** The git remote (a name in this repo, or a URL) the built site is pushed to. */
    remote: "origin",
    branch: "gh-pages",
    /** The path the site is served under: null works it out from the remote (/<repo> on <user>.github.io, nothing
     *  for a <user>.github.io repo or a custom domain). */
    basePath: null,
    /** A custom domain for GitHub Pages (written to CNAME); null: none. */
    cname: null,
  },
};

function merge(base, over) {
  if (!over || typeof over !== "object" || Array.isArray(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = base && typeof base[k] === "object" && base[k] ? merge(base[k], v) : v;
  return out;
}

/** The config file in use: $MUSEUM_CONFIG_FILE, else museum.config.json, else the example. */
export function configFile() {
  if (process.env.MUSEUM_CONFIG_FILE) return path.resolve(process.env.MUSEUM_CONFIG_FILE);
  const own = path.join(ROOT, "museum.config.json");
  return fs.existsSync(own) ? own : path.join(ROOT, "museum.config.example.json");
}

export function loadConfig(file = configFile()) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  delete raw.$comment;
  return merge(DEFAULTS, raw);
}

/** "https://www.instagram.com/some_user/" or "@some_user" -> "some_user". */
export function username(account) {
  const m = /instagram\.com\/([^/?#]+)/i.exec(account);
  return (m ? m[1] : account).replace(/^@/, "").trim();
}
