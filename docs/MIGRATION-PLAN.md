# HBCC: WordPress to Contentful migration

Project: `C:\dev\hbcc\dev\website-2027`  
Source: [hobsonsbaychess.com](https://hobsonsbaychess.com/)  
Updated: 10 October 2026

## Objective and completed work

Preserve HBCC branding, content and club addresses while replacing WordPress editing with Contentful. Astro generates the frontend for GitHub Pages. Scores, upcoming tournaments, registration, member login, games and broadcasts retain their existing services. The main club calendar is now a Contentful component, imported from the source spreadsheet.

- Captured 73 WordPress pages, five posts and 387 media records, with HTML, styles, fonts and media. Fourteen club information pages are retained.
- Downloaded the authenticated 545-record All content WXR. The original is unchanged; a separate UTF-8 copy repairs two legacy byte errors. The private export and screenshots are ignored by Git. This is a content export, not a full database/filesystem backup.
- Audited every homepage section before changing the first version, with a frozen source copy. Restored missing footer/contact/social links, original menu nesting and new-tab behavior.
- Converted the first version's 13 information pages to native rich text without dropping their wording. Removed demo news widgets; replaced the calendar embed on request. Inner theme layouts remain approximations, not pixel-identical reproductions.
- Created and imported 15 native Contentful types/editor configurations, 447 entries and 99 assets. Published 439 entries and 99 assets.
- Published three actual club stories with original HBCC images, source links and credits. Five football theme demos remain disabled drafts, with old routes redirected to News.
- Converted 119 spreadsheet rows into 153 events: 150 published and three hidden drafts with contradictory source dates. Added month/agenda views, filters and iCalendar download.
- Verified real published Delivery content, CMS references, desktop/mobile calendar behavior, all 21 tests and a strict production build.
- Configured the public frontend repository for Contentful builds, GitHub Pages and hourly editorial rebuilds. The Facebook draft-import workflow remains disabled because the anonymous feed contains no dated posts.

[CMS-GUIDE.md](CMS-GUIDE.md) explains native editing. [EDITORIAL-UPDATE.md](EDITORIAL-UPDATE.md) records the news sources and calendar conflicts. The original [homepage audit](HOMEPAGE-AUDIT.md) remains the baseline evidence.

## Architecture

Website settings link homepage, recursive menus, branding, shared banner and gallery. Pages link ordered native sections; sections link cards, statistics, weekly schedules, sponsors, news, calendar or tournament presentation settings. Editors use rich text and entry/media pickers rather than HTML/JSON.

The package contains 447 entries; five disabled news posts and three review events are excluded from publication. The published main site renders 20 content pages plus nine legacy HTML redirects.

The initial importer defaults to dry-run and skips existing entries. The controlled update script is a developer migration tool, not a routine publishing command; reapplying it can reset selected baseline content.

## Launch sequence

| Step | Status / action |
| --- | --- |
| Preserve source and audit homepage | Complete, including frozen first-version evidence |
| Build editable pages, menus and media | Complete in the actual Contentful account |
| Import/publish CMS graph | Complete; strict Delivery verification passes |
| Replace theme news and spreadsheet calendar | Complete; three calendar rows retained for confirmation |
| Connect GitHub hosting | Contentful is selected; hourly rebuilds enabled |
| Review club content | Confirm historical counts, fees, sponsor tiers, committee, policies/downloads and calendar conflicts |
| Accept staging | Club checks retained routes, layouts, accessibility, content and downloads |
| Optional unattended Facebook import | Draft workflow prepared; needs a usable public feed before enabling |
| Optional contact form | Choose and test a sending service if email is insufficient |
| Domain cutover | Configure Pages custom domain, DNS/certificate and rollback; preserve email/service subdomains |

## Updates, routes and recovery

Contentful publication reaches the website after a static rebuild. Immediate rebuilds are available from GitHub Actions; scheduled rebuilds run hourly, subject to GitHub delays. Production uses the published Delivery API and excludes Preview drafts.

Tournament scores and upcoming cards refresh separately from public endpoints, with checked year and generation date. Standard/classical scores replace the old 2025 Club Championship measure. Registration and the tournament website's own calendar remain on that service.

Retained club routes are `/about-us/`, `/history/`, `/play-chess/`, `/juniors/`, `/tournaments/`, `/champions/`, `/best-in-the-west/`, `/peter-caissa-memorial/`, `/dgt-link/`, `/calendar/`, `/sponsors/`, `/membership/`, `/contact/` and `/policies/`. `/news/` lists current club articles. Page references follow slug edits, but inbound addresses require redirects.

The fixture and original public assets support offline review/recovery. Credentials, private export, raw Facebook hydration and runtime reports remain outside Git. Retain WordPress/export access until the club accepts launch and uncaptured assets are reconciled.

## Validation

Twenty-one tests cover native editing, menu hierarchy/cycles, new/renamed routes, dependencies, rich text safety, API pagination/preview, real 2026 scoring, outages, repository paths, calendar date formats/month overlap/downloads and Facebook draft protection. The conversion audit checks retained wording, excluding the intentional replacement of demo news and the calendar embed.

The published root build checks 958 local links/assets across 20 pages and nine aliases, without missing files, unsafe URLs, WordPress media dependence or credential leakage. Browser checks cover desktop/390 px calendar controls and the previously checked homepage/menu/FAQs. [GITHUB-PAGES.md](GITHUB-PAGES.md) covers project-path builds and future domain hosting.

## Primary documentation

- [WordPress export](https://wordpress.com/support/export/)
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/overview/)
- [Native editor interfaces](https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/)
- [Rich text format](https://www.contentful.com/developers/docs/tutorials/general/getting-started-with-rich-text-field-type/)
- [Tournament application](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments)
