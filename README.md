# Hobsons Bay Chess Club — website 2027

An Astro reconstruction of HBCC's WordPress site with a structured Contentful CMS: homepage, 14 club information pages, preserved news routes, nested menus, native rich text/sections, archived media and the 2026 tournament integration.

**Current state:** the local implementation and migration package are ready. Delivery/Preview keys are valid, but the Contentful space is empty. Creating the model/content requires `CONTENTFUL_MANAGEMENT_TOKEN` in local `.env`; nothing has yet been imported into the account.

## Run locally

```powershell
Set-Location C:\dev\hbcc\dev\website-2027
npm ci
npm run dev
```

Open <http://127.0.0.1:4327/>. Node 22.12+ is required; this environment uses Node 24.

`CONTENT_SOURCE=auto` reads Contentful when populated. A verified empty space renders the structured local reference; an API failure is reported. `reference` explicitly selects the fixture, while `contentful` requires real CMS content.

## CMS

Read [the editor guide](docs/CMS-GUIDE.md) for managing pages, menus, sections, media and publication.

The package has **13 types, 290 entries, 96 assets and 13 editor configurations**. All fields use native controls. Normal page editing uses rich text and references, with no raw HTML/JSON-object fields.

```powershell
npm run contentful:check
npm run contentful:import                 # Dry run
npm run contentful:import -- --apply       # Import drafts after adding Management token
npm run contentful:verify
npm run cms:preview                       # http://127.0.0.1:4328/
```

Models activate; media and entries remain drafts. Existing entries and incompatible models are not overwritten. The local import report is ignored by Git. Read keys cannot perform an import.

After review/publication:

```powershell
npm run contentful:verify -- --published
npm run build:production
npm run verify
```

Production builds refuse Preview drafts and require the published CMS. Configure a Contentful publish/unpublish deploy hook when hosting is selected; none is configured yet.

## Tournament service

The 2025 table and old January/March cards are replaced with the [2026 Open leaderboard](https://tournament.hobsonsbaychess.com/v2/leaderboard/open), current upcoming events and existing calendar links. Scoring follows the [tournament application](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments): standard/classical scores, stable ties and a checked year.

The source update date is shown. Browser refreshes read public tournament endpoints; verified dated results support static rendering and outages. Contentful owns presentation; the existing service owns scores, dates and registration.

## Checks

```powershell
npm test
node scripts/audit-page-conversion.mjs
npm run build
npm run verify
```

Eleven tests cover actual CMS field changes, menu hierarchy/hiding/cycles, new/renamed pages, missing references, safe rich text, preview authentication/pagination, 2026 scoring, outages and native package integrity. Conversion checks preserve all first-version wording on 13 pages; calendar content is deliberately replaced with the existing-service link.

The build generates 22 HTML pages plus the sitemap. The verifier checks local links/assets, headings, WordPress media dependence and credential leakage. Browser checks cover desktop, 390 px mobile, nested menus and membership FAQs. See [the pre-change homepage audit](docs/HOMEPAGE-AUDIT.md).

## Files

| Path | Purpose |
| --- | --- |
| `src/components/`, `src/pages/` | Layouts, recursive navigation and tournament summary |
| `src/lib/content-source.mjs` | API reader, native references and validation |
| `src/data/cms.json` | Structured local reference using the Contentful model |
| `src/data/site.json` | First-version conversion source |
| `src/data/tournaments.json` | Verified dated tournament fallback |
| `contentful/` | Model, seed, assets and native editor configuration |
| `scripts/import-cms.mjs` | Dry-run/resumable draft importer |
| `reference/audit/` | Homepage inventory, frozen first version and conversion evidence |
| `reference/api/`, `html/`, `styles/`, `assets/`, `fonts/` | Public source capture and original media |
| `reference/admin-export/` | Private WXR, excluded from Git/build |
| `public/wp-assets/`, `public/fonts/` | Optimized runtime media/self-hosted fonts |

The unchanged WordPress export has 545 records, with a separately repaired UTF-8 audit copy. It contains content/metadata and media references rather than a full filesystem/database backup. Original public downloads are retained separately; runtime media/fonts use about 13 MB.

No deployment or DNS cutover was performed. Imported news is sports demo material flagged for review. Historical fees, sponsorship and policies remain captured content. Contact uses a real email link; the missing schedule download is replaced by the tournament calendar.

See [the migration plan](docs/MIGRATION-PLAN.md) for recovery and launch work.
