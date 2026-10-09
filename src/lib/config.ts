/** museum.config.json with its defaults filled in (scripts/config.mjs), inlined at build time by next.config.ts. */
export interface MuseumConfig {
  instagram: { account: string; browser: string; downloads: string };
  posts: { from: string | null; to: string | null };
  titles: { name: string; subtitle: string; pageTitle: string; description: string };
  look: { style: string; wall: string | null; ground: string | null; printCm: number; dateLocale: string };
  deploy: { remote: string; branch: string; basePath: string | null; cname: string | null };
}

export const CONFIG: MuseumConfig = JSON.parse(process.env.MUSEUM_CONFIG ?? "{}");

/** The path the site is served under ("" or "/<repo>"): prefixes the URLs of files in public/. */
export const BASE_PATH = process.env.MUSEUM_BASE_PATH ?? "";

/** A title with its placeholders ({fullname}, {count} ...) filled in; unknown ones stay as written. */
export function fillTitle(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}
