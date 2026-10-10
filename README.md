# Hobsons Bay Chess Club — website 2027

Astro rebuild of HBCC's WordPress website, with Contentful managing pages, menus, sections, news, calendar events and media. GitHub Actions builds published content for [GitHub Pages](https://hobsons-bay-chess-club-au.github.io/website-2027/).

The actual Contentful account is populated: **15 types, 447 entries and 99 assets**. There are **439 published entries**, including three recent club stories and 150 calendar events. Five disabled theme news posts and three conflicting spreadsheet events remain drafts. [Open Website settings](https://app.contentful.com/spaces/7r7s5slcmer0/entries/hbcc-site-settings).

## Develop and verify

Requires Node 22.12+; development and Actions use Node 24.

```powershell
Set-Location C:\dev\hbcc\dev\website-2027
npm ci
npm run dev                          # http://127.0.0.1:4327/
npm run cms:preview                  # Draft CMS preview, port 4328
npm test
npm run contentful:verify -- --published
npm run build:production
npm run verify
```

Local `.env` supports the original Delivery/Preview key names. Production reads the published Delivery API, refuses Preview drafts and reports missing references. `CONTENT_SOURCE=reference` explicitly selects the preserved fixture for offline review; `contentful` requires the account.

Read [the CMS guide](docs/CMS-GUIDE.md) for native editing, publishing and calendar/news management. Normal page editing uses rich text and entry/media pickers.

## News and calendar

Three genuine September/October 2026 club stories replace the five football theme demos, including the homepage and Tournaments news section. Original HBCC photographs are uploaded to Contentful; articles credit and link their sources. Old demo news addresses redirect to `/news/`.

The interactive `/calendar/` imports Schedule 2026.xlsx's published spreadsheet. It offers month/agenda views, category filtering and an iCalendar download; mobile opens in agenda view. Editors manage individual events in Contentful. Three contradictory source rows are documented for review, and no event times were invented.

```powershell
npm run news:scrape                                  # Public scrape, dry run
npm run news:scrape -- --file=reference/facebook/captured-posts.json --apply
```

Future imports save **drafts**, deduplicate and protect editor changes. Unattended Facebook scraping is **disabled**: the anonymous page currently supplies a profile without dated posts. The initial capture used the signed-in browser. [Editorial update](docs/EDITORIAL-UPDATE.md) records sources, limitations and review items.

## Hosting and existing services

[The public repository](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027) has Pages enabled, Delivery build secrets and `CONTENT_SOURCE=contentful`. Pushes to main deploy published content. Hourly CMS rebuilds are enabled; editors can run **Actions → Build and deploy HBCC → Run workflow** for an immediate rebuild. See [the deployment guide](docs/GITHUB-PAGES.md).

Standings and upcoming cards use the [existing tournament application](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments), with 2026 standard/classical points, checked year, stable ties and a dated fallback. Results, registration and the tournament website's own calendar remain there. The main club calendar is now separately editable.

The `hobsonsbaychess.com` domain still serves WordPress. Domain/DNS cutover is a separate launch step.

## Checks and migration files

Twenty-one tests cover CMS editing/references/menus, rich text safety, tournament scoring/outages, deployment paths, spreadsheet dates, calendar filters/downloads and Facebook draft protection. The published root build produces 20 content pages and nine legacy HTML redirects; 958 local links/assets passed verification. Desktop and 390 px checks cover the calendar and the previously audited homepage/menu/FAQs.

| Path | Purpose |
| --- | --- |
| `src/components/`, `src/pages/` | Frontend, navigation, calendar and tournament summary |
| `src/lib/content-source.mjs` | API reader and native reference validation |
| `src/data/cms.json` | Preserved structured fixture |
| `contentful/` | Schema, seed, assets and native editor controls |
| `scripts/import-cms.mjs` | Initial dry-run/resumable draft import |
| `scripts/apply-site-update.mjs` | Controlled migration update; not a routine editor tool |
| `scripts/sync-facebook-news.mjs` | Public/captured post import to drafts |
| `reference/calendar/`, `reference/facebook/` | Spreadsheet, source audit, news references and original photos |
| `reference/audit/` | Pre-change homepage audit and frozen first version |
| `reference/admin-export/` | Private WordPress export, excluded from Git/build |
| `public/wp-assets/`, `public/news-assets/`, `public/fonts/` | Offline media and self-hosted fonts |

The original 545-record WordPress export is unchanged, with a separate repaired UTF-8 audit copy. It contains content/metadata and media references rather than a complete filesystem/database backup. Public downloads are preserved; credentials, private export, raw Facebook hydration and screenshots are excluded from Git.

Historical counts, fees, sponsor tiers, committee and policies still need club acceptance. Contact uses the club email link. See [the homepage audit](docs/HOMEPAGE-AUDIT.md) and [migration plan](docs/MIGRATION-PLAN.md).
