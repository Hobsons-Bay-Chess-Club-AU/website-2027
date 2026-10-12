# Hobsons Bay Chess Club — website 2027

Astro rebuild of HBCC's WordPress website, with Contentful managing pages, menus, sections, news, calendar events and media. The approved V2 is [live on Vercel](https://hbcc-website-2027.vercel.app/) with server rendering, one-hour ISR, a Contentful publication webhook and private saved-draft previews. GitHub Actions deploys code updates. [GitHub Pages](https://hobsons-bay-chess-club-au.github.io/website-2027/) retains the current/V2 comparison.

The Contentful account contains **17 types, 887 entries (879 published, eight existing drafts) and 100 assets**. The original 642 records were preserved, with 245 additional native records for the approved V2 pages, menus and proposals. Three recent club stories, calendar events, reusable policies, membership fees, committee cards and champions are editable. [Open approved V2 Website settings](https://app.contentful.com/spaces/7r7s5slcmer0/entries/v2-hbcc-site-settings).

## Develop and verify

Requires Node 24; development, GitHub Actions and Vercel use Node 24.

```powershell
Set-Location C:\dev\hbcc\dev\website-2027
npm ci
npm run dev                          # http://127.0.0.1:4327/
npm run dev:server                   # Approved SSR V2, port 4332
npm run cms:preview                  # Draft CMS preview, port 4328
npm test
npm run contentful:verify -- --published
npm run build:production
npm run verify
npm run build:vercel
npm run deploy:vercel -- --dry        # Safe upload inventory
npm run deploy:vercel
```

Local `.env` supports the original Delivery/Preview key names. Production reads the published Delivery API, refuses Preview drafts and reports missing references. `CONTENT_SOURCE=reference` explicitly selects the preserved fixture for offline review; `contentful` requires the account.

Read [the CMS guide](docs/CMS-GUIDE.md) for native editing and [the Vercel guide](docs/VERCEL.md) for caching, preview access, webhooks and deployment. Normal editing uses rich text and entry/media pickers.

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

Fifty-one tests cover CMS editing/references/menus, policies, page restoration, rich text safety, tournament scoring/outages, deployment paths, spreadsheet dates, native V2 isolation, snapshot invalidation, signed preview sessions, reserved server routes, redirect safety and Facebook draft protection. Both static builds verify links, anchors, media and repository paths. [Live Vercel verification](docs/VERCEL-VERIFICATION.json) covers public routes, CDN hits, private draft isolation and a real Contentful publish/webhook with content restoration.

| Path | Purpose |
| --- | --- |
| `src/components/`, `src/pages/` | Frontend, navigation, calendar and tournament summary |
| `src/lib/content-source.mjs` | API reader and native reference validation |
| `src/data/cms.json` | Preserved structured fixture |
| `contentful/` | Schema, seed, assets and native editor controls |
| `scripts/import-cms.mjs` | Initial dry-run/resumable draft import |
| `scripts/apply-site-update.mjs` | Controlled migration update; not a routine editor tool |
| `scripts/apply-membership-about-policies.mjs` | Targeted version-checked Membership/About/policy model migration |
| `scripts/sync-facebook-news.mjs` | Public/captured post import to drafts |
| `reference/calendar/`, `reference/facebook/` | Spreadsheet, source audit, news references and original photos |
| `reference/audit/` | Pre-change homepage audit and frozen first version |
| `reference/admin-export/` | Private WordPress export, excluded from Git/build |
| `public/wp-assets/`, `public/news-assets/`, `public/fonts/` | Offline media and self-hosted fonts |

The original 545-record WordPress export is unchanged, with a separate repaired UTF-8 audit copy. It contains content/metadata and media references rather than a complete filesystem/database backup. Public downloads are preserved; credentials, private export, raw Facebook hydration and screenshots are excluded from Git.

Historical counts, fees, sponsor tiers, committee and policies still need club acceptance. Contact uses the club email link. See [the homepage audit](docs/HOMEPAGE-AUDIT.md) and [migration plan](docs/MIGRATION-PLAN.md).
