# Instagram museum

Turn an Instagram account into a walkable 3D museum: every photo hangs on a gallery wall, oldest first, a run of
rooms per year, with a sign giving its date and caption. Click a photo to see it up close, with a link to the
post. The site is static, so it can be hosted free on GitHub Pages.

The gallery is the museum component of [art-history-museum](https://github.com/justdataplease/art-history-museum)
(MIT), fed with Instagram photos instead of Wikipedia paintings.

## Quick start

You need [Node.js](https://nodejs.org) 20+ and [gallery-dl](https://github.com/mikf/gallery-dl)
(`pip install gallery-dl`, or `uv tool install gallery-dl`).

```bash
npm install
cp museum.config.example.json museum.config.json   # then set instagram.account
npm run scrape                                      # download the posts
npm run dev                                         # walk it at http://localhost:3000
```

Instagram only shows a profile's posts to a logged-in visitor, so gallery-dl borrows the login of your browser
(`instagram.browser`, Firefox by default). Log in to Instagram there first.

## Configuration: `museum.config.json`

Kept out of git, like everything built from it. Every field except `instagram.account` has a default.

| Field | Default | |
| --- | --- | --- |
| `instagram.account` | | Username, `@username` or the profile's URL |
| `instagram.browser` | `firefox` | The browser whose Instagram login gallery-dl uses (`chrome`, `edge`, ...) |
| `instagram.downloads` | `downloads` | Where gallery-dl saves the posts (relative to this folder) |
| `posts.from`, `posts.to` | `null` | Only posts between these dates (`YYYY-MM-DD`, both included) |
| `titles.name` | `{fullname}` | On the entrance doors, the title card and every wall sign |
| `titles.subtitle` | `Photographs · {years} · {count} photos` | The line under the name on the title card |
| `titles.pageTitle` | `{fullname} · a walkable museum` | The browser tab's title |
| `titles.description` | `Walk a 3D gallery of {fullname}'s ...` | The page description (search engines, link previews) |
| `look.style` | `postwar` | Room style: `postwar` (contemporary), `print-room`, `early-modern`, `secession`, ...; all of them in [docs/styles.md](docs/styles.md) |
| `look.wall` | `#a9a59f` | Wall colour; `null` for the style's own |
| `look.ground` | `null` | Floor: `marble`, `concrete`, `oak-light`, `oak-dark`, `parquet`; `null` for the style's own |
| `look.printCm` | `80` | The size photos hang at, longer side in cm |
| `look.dateLocale` | `en-GB` | Language of the dates: `en-GB` (5 June 2015), `en-US` (June 5, 2015), `he-IL`, ... |
| `deploy.remote` | `origin` | The git remote (or a URL) the site is pushed to |
| `deploy.branch` | `gh-pages` | The branch GitHub Pages serves |
| `deploy.basePath` | `null` | The path the site lives under; `null` works it out from the remote |
| `deploy.cname` | `null` | A custom domain for GitHub Pages |

Placeholders in the titles: `{username}`, `{fullname}`, `{count}` (photos shown), `{from}` and `{to}` (the first
and last post's dates), `{firstYear}`, `{lastYear}`, `{years}` (`2012–2022`).

## Deploy to GitHub Pages

```bash
npm run deploy
```

1. **Scrape:** downloads the account's new posts in the date range and writes `data/pictures.json` and
   `public/pictures/`.
2. **Build:** builds the static site into `out/`, under `/<repo>` when the remote is a GitHub project repository.
3. **Publish:** commits the site to the `gh-pages` branch of `deploy.remote` and pushes it.

The first time, in the repository's **Settings → Pages**, choose **Deploy from a branch**, then `gh-pages` and
`/ (root)`. The museum is then at `https://<user>.github.io/<repo>/`.

Options: `--offline` (don't download, rebuild from what's already downloaded), `--skip-scrape` (use `data/` as it is),
`--no-push` (build only, then look at `out/`).

Scraping needs your browser's Instagram login, so deploys run on your computer, not in GitHub Actions.

Keep in mind:
- **The photos become public.** The site and the `gh-pages` branch are public, even though the code's branch never
  holds the photos. To keep the code repository free of them, point `deploy.remote` at a separate repository made
  for the site.
- **GitHub Pages limits:** a site of up to 1 GB, and about 100 GB of traffic a month. A thousand Instagram photos
  come to about 100 MB.

## Where things are

- `scripts/scrape.mjs`, `scripts/deploy.mjs`: the steps above. `scripts/config.mjs` reads the config and holds the
  defaults.
- `src/lib/pictures.ts`: turns `data/pictures.json` into the gallery's data and fills in the titles.
- `src/components/museum/`: the gallery. The wall sign is drawn in `exhibit-placard.ts`, the panel beside an
  inspected photo is `InspectPanel.tsx`.
