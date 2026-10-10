# HBCC: WordPress to Contentful migration

Project: `C:\dev\hbcc\dev\website-2027`  
Source: [hobsonsbaychess.com](https://hobsonsbaychess.com/)  
Updated: 10 October 2026

## Objective

Preserve HBCC branding, content and club addresses while replacing WordPress editing with Contentful. Astro generates the main site. Results, upcoming events/calendar, registration, member login, games, broadcasts and Oceania Youth retain their existing services.

The expanded implementation has editable pages/sections, recursive main/footer menus, native media/rich text and a 2026 tournament feed. Changes follow [the pre-change homepage audit](HOMEPAGE-AUDIT.md).

## Completed source and audit work

- Captured 73 published WordPress pages, five posts and 387 media records. Fourteen club information pages are retained; unused sports demo routes are archived for review.
- Preserved HTML, styles, fonts and media under `reference/`. The manifest records URLs, hashes, dates and errors. Originals remain separate from approximately 13 MB of optimized runtime media/fonts.
- Downloaded authenticated All content WXR to `reference/admin-export/hbcc-wordpress-2026-10-10.xml`. Its 545 records include published/draft/trashed pages, posts, attachments, menus, custom CSS, forms, timelines and other theme/plugin data. The original 6 MB file is unchanged; two invalid legacy dash bytes were repaired only in a separate UTF-8 copy.
- WXR/screenshots stay local and ignored by Git. WXR contains media references, not a complete database/filesystem backup; reconcile uncaptured assets before closing WordPress.
- Recorded the full homepage audit before CMS changes and froze first-version content/source. Restored missing footer links/contact/Instagram/YouTube, original menu nesting and new-tab behavior.
- Native rich text preserves all wording from the first version's 13 information pages. Calendar deliberately points to the existing service. Detailed inner layouts remain theme approximations; this is not pixel-identical reproduction.

## Content architecture

The package has 13 types, 290 entries and 96 media assets. Website settings link to homepage, menus, branding, socials, shared banner and gallery. Pages link to ordered sections; menus link to recursive items with page references or URLs.

Sections cover formatted content, columns, cards/FAQs, galleries/embeds, statistics, standings/events, features, schedules, sponsors, news, quotes and join banners. Other records manage cards, values, days/sessions, sponsors, gallery media, articles and tournament presentation. There are no HTML or JSON-object fields for normal editing.

[CMS-GUIDE.md](CMS-GUIDE.md) documents types and editorial steps. Native assets/references, slug checks and cycle/missing-dependency validation support repeatable imports and reliable builds.

## Remaining sequence

| Step | Status / action |
| --- | --- |
| Preserve source and audit homepage | Complete; evidence and differences documented |
| Build editable frontend/model | Complete locally; 22 HTML routes and prepared native model |
| Load Contentful drafts | Requires `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`; current read APIs work but space is empty |
| Validate imported graph | Run `contentful:verify`, open draft preview at port 4328 and exercise real CMS edits |
| Review club content | Replace/hide sports demo news; review historical counts, fees, sponsor tiers, committee, policies and downloads |
| Publish reviewed records | Publish linked entries/assets; verify Delivery API and strict production build |
| Connect hosting | Select project, configure Delivery credentials, strict build/output and publish/unpublish deploy hook |
| Optional contact form | Choose a sending destination if email contact is insufficient and test real delivery |
| Accept staging | Check retained routes, layouts, downloads, keyboard use, SEO, redirects and publish/rebuild |
| Domain cutover | Deploy accepted release, configure certificate/DNS and rollback; preserve email/service subdomains |

The importer defaults to dry-run. `--apply` activates models/editors, processes preserved media and creates drafts. It detects locale, uses stable IDs, retries limits and records changes. Reruns skip existing entries and refuse incompatible models. `--apply --publish` is available for a reviewed batch.

## Update behavior

Existing `.env` names are supported. Management credentials are migration-only; Delivery/Preview access is server-only and public output is checked for leakage.

Publishing page/menu/media changes takes effect after rebuilding/deploying the static site. Strict launch builds need actual published CMS content and reject Preview drafts. Local CMS preview reads drafts on reload; empty-space fallback supports local review.

Tournament results and event cards refresh in the browser and at build time. The year is checked and the source date shown. 2026 Open points sum standard/classical scores across tournaments, replacing the single 2025 Club Championship table. Registration and calendar stay on the existing service.

## Retained routes

Keep `/about-us/`, `/history/`, `/play-chess/`, `/juniors/`, `/tournaments/`, `/champions/`, `/best-in-the-west/`, `/peter-caissa-memorial/`, `/dgt-link/`, `/calendar/`, `/sponsors/`, `/membership/`, `/contact/` and `/policies/`. `/news/` lists retained articles; their original slugs remain.

Page references follow slug edits, but inbound paths still need redirects. Preserve slugs until redirect changes are planned. Legacy aliases are in deployment configuration; decide redirects/404s for archived demo routes.

## Validation and launch

Eleven tests cover CMS edits, menu hierarchy/cycles, new/renamed pages, dependencies, rich text safety, preview routing/pagination, real 2026 scoring, outages and package integrity. The conversion audit checks retained wording. Build validation checks local links/assets, headings, WordPress media dependence and secrets.

Desktop/390 px checks cover homepage, live refresh, nested menus and FAQs. A real Contentful draft/published edit cycle still requires import. Hosting hooks, optional form sending, DNS and club acceptance are launch work.

## Primary documentation

- [WordPress export](https://wordpress.com/support/export/) describes recovery scope.
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/overview/) covers model/media/entry management.
- [Contentful editor interfaces](https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/) defines configured native controls.
- [Rich text format](https://www.contentful.com/developers/docs/tutorials/general/getting-started-with-rich-text-field-type/) defines editable nodes/tables.
- [Tournament application](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments) supplies existing service routes and scoring.
