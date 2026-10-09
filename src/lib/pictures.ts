import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { ArtistWithPaintings, Painting } from "./types";
import { BASE_PATH, CONFIG, fillTitle } from "./config";

/** One entry of data/pictures.json (scripts/scrape.mjs). */
interface Picture {
  image_name: string;
  date: string; // YYYY-MM-DD
  description: string;
  width: number;
  height: number;
  /** The post on Instagram. */
  url?: string | null;
}

interface Account {
  username: string;
  fullname: string;
  url: string;
}

const DATA = path.join(process.cwd(), "data", "pictures.json");

async function readData(): Promise<{ account?: Account; pictures: Picture[] }> {
  try {
    return JSON.parse(await readFile(DATA, "utf8"));
  } catch {
    throw new Error("No data/pictures.json: run `npm run scrape` first (it reads museum.config.json).");
  }
}

/** "2015-06-05" in the config's date language: "5 June 2015". */
function longDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(CONFIG.look.dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The museum as the gallery component expects it (one "artist" whose works are the photos, a run of rooms per
 *  year), and the page's title and description, all with the config's titles filled in. */
export const loadMuseum = cache(async () => {
  const { account, pictures } = await readData();
  const { from, to } = CONFIG.posts;
  const sorted = pictures
    .filter((p) => (!from || p.date >= from) && (!to || p.date <= to))
    .sort((a, b) => a.date.localeCompare(b.date) || a.image_name.localeCompare(b.image_name));
  const years = [...new Set(sorted.map((p) => Number(p.date.slice(0, 4))))];

  const username = account?.username ?? "";
  const first = sorted[0]?.date ?? "";
  const last = sorted[sorted.length - 1]?.date ?? "";
  const firstYear = years[0] ?? "";
  const lastYear = years[years.length - 1] ?? "";
  const values = {
    username,
    fullname: account?.fullname || username,
    count: sorted.length,
    from: first && longDate(first),
    to: last && longDate(last),
    firstYear,
    lastYear,
    years: firstYear === lastYear ? String(firstYear) : `${firstYear}–${lastYear}`,
  };
  const t = CONFIG.titles;

  const long = CONFIG.look.printCm;
  const paintings: Painting[] = sorted.map((p) => {
    const year = Number(p.date.slice(0, 4));
    const description = p.description.trim();
    const landscape = p.width >= p.height;
    return {
      slug: p.image_name.replace(/\.[^.]+$/, ""),
      title: description,
      year,
      date: p.date,
      imageUrl: `${BASE_PATH}/pictures/${encodeURIComponent(p.image_name)}`,
      imageWidth: p.width,
      imageHeight: p.height,
      widthCm: landscape ? long : (long * p.width) / p.height,
      heightCm: landscape ? (long * p.height) / p.width : long,
      story: description,
      facts: [],
      wikipediaUrl: null,
      postUrl: p.url ?? null,
      phase: years.indexOf(year),
    };
  });

  const museum: ArtistWithPaintings = {
    slug: "museum",
    periodSlug: "photographs",
    periodName: fillTitle(t.subtitle, values),
    periodColor: "#888888",
    name: fillTitle(t.name, values),
    birthYear: years[0] ?? null,
    deathYear: years[years.length - 1] ?? null,
    tagline: "",
    bio: "",
    portraitUrl: null,
    portraitWidth: null,
    portraitHeight: null,
    wikipediaUrl: null,
    paintingCount: paintings.length,
    paintings,
    phases: years.map((y) => ({ name: String(y), from: y, to: y })),
  };
  return { museum, pageTitle: fillTitle(t.pageTitle, values), description: fillTitle(t.description, values) };
});
