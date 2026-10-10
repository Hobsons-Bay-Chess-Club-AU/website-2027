# HBCC Contentful editor guide

The actual [Contentful space](https://app.contentful.com/spaces/7r7s5slcmer0/entries) contains **15 native content types, 447 entries and 99 processed assets**. There are 439 published entries and 99 published assets. Five disabled theme articles and three calendar events needing date confirmation remain drafts.

Ordinary editing uses rich text, media pickers, dropdowns and ordered entry references. No HTML or JSON is required.

## Content model

| Type | Editors manage |
| --- | --- |
| Website settings (`siteSettings`) | Branding, contact/address, homepage, menus, socials, join banner, footer gallery and news labels |
| Website page (`page`) | Title, slug, SEO, hero, ordered sections, homepage partner/actions/features and visibility |
| Menu (`navigationMenu`) | Main navigation or footer column, with items in display order |
| Menu item / button / social link (`navigationItem`) | Label, page or URL, children, new-tab setting, icon and visibility |
| Page / homepage section (`section`) | Layout, heading, rich text, media, actions and linked collections/calendar |
| Card / question / timeline item (`contentCard`) | Features, cards, FAQs and timeline items |
| Club statistic (`statistic`) | Value, label, icon and visibility |
| Weekly schedule day (`scheduleDay`) | Day, sessions and empty-day message |
| Weekly session (`scheduleSession`) | Name, display time, venue and link |
| Sponsor / partner (`sponsor`) | Name, logo, website, description and visibility |
| Gallery image (`galleryImage`) | Media, alternative text and optional link |
| News article (`post`) | Title, slug, date, rich text, cover/alt, author, category, summary and visibility |
| Club calendar (`calendarSchedule`) | Year, introduction and linked calendar events |
| Calendar event (`calendarEvent`) | Title, first/last dates, category, details, arbiter and visibility |
| Tournament integration (`tournamentFeed`) | Year, existing service URLs, table/card counts and explanatory text |

Sections support rich text, columns, cards, accordions, galleries, approved embeds, statistics, standings/events, feature banners, weekly schedules, sponsors, news, testimonials, join banners and calendars. Reuse linked sections across pages. The frontend controls typography and responsive layout; Contentful controls content and order.

## Edit pages

1. Filter the Content tab by **Website page** and open a page.
2. Change its title, summary, hero or search title; replace images using the picker.
3. Open a linked **Sections in display order** entry. Edit its native rich text, actions, media or collections.
4. Drag sections to reorder. Remove a reference to remove it from this page, or set **Show on website** to Hide to disable it everywhere.
5. Add a Section for another block. Columns reference child sections; FAQs reference Card entries.
6. Publish the changed page, linked entries and media.

New enabled pages appear at the next build without a new code route. Keep existing slugs during migration: page references follow slug edits, but inbound URLs require redirects. News and system routes are reserved.

The Home page has dedicated hero, partner, action and feature-card fields, plus seven ordered sections. [Website settings](https://app.contentful.com/spaces/7r7s5slcmer0/entries/hbcc-site-settings) controls the shared header/footer.

## Manage menus

1. Open **Main navigation**, **Club**, **Quick Links** or **Legal links** under Menu.
2. Drag items into order, or create a Menu item.
3. Enter its label and select a page. Use URL for external destinations, `/news/`, email or anchors. Shared tournament links can reference Tournament service and its destination. Priority is page, tournament destination, then URL.
4. Reference child items for submenus. Tournaments retains Upcoming & Register and Champions nesting.
5. Choose visibility/new-tab behavior, then publish the item and menu.

Items can be reused as buttons or in other menus. Avoid linking an item into its own descendants. Missing published references, cycles and duplicate routes fail the build clearly.

## Manage news

Three September/October 2026 club stories are published with original HBCC photographs and source credits. The five football demos are disabled drafts; their old URLs redirect to `/news/`.

Create a **News article**, supply title, unique slug, date, summary, rich text, cover and descriptive alt text. Select **Show**, then publish the article and media. The homepage and Tournaments news section select the newest published, visible articles automatically. A News section can also reference a specific ordered selection.

Dates display in Melbourne time. **Allow Facebook updates** is off for the three curated stories; ordinary editors can leave the technical import fingerprints untouched.

Future Facebook imports save drafts and protect manual editorial changes. The unattended scraper is disabled because Facebook's anonymous page currently provides no dated posts. Initial stories were captured through the signed-in browser; [EDITORIAL-UPDATE.md](EDITORIAL-UPDATE.md) documents the draft import and its current limitation.

## Manage the club calendar

The native [Calendar page](https://hobsons-bay-chess-club-au.github.io/website-2027/calendar/) replaces the spreadsheet embed. Its **Club calendar** links **150 visible events**, with month/agenda views, filters and an iCalendar download. Mobile opens in agenda view.

1. Open **Club calendar ` HBCC Calendar 2026** and its **Calendar events** list.
2. Open an event to edit its title, first day, last day, category or details. The last day is inclusive; single-day events use the same date in both fields.
3. For a new event, create a **Calendar event**, choose Show, then add its reference to the Club calendar.
4. Publish the event and the calendar if its references changed. Publish the page/section only if you changed them.
5. Hide an event to remove it from the website. Remove its reference if it should no longer belong to this calendar.

The source supplied dates without session times, so imports and calendar downloads use whole-day dates. Retain the actual Melbourne date when using Contentful's Date picker. For a future year, create a Club calendar with that year and its events, then select it in the Calendar section.

The original date text, weekday, sheet row, event type, school schedule and arbiter are retained for checking. **Three contradictory rows are hidden drafts, not linked to the published calendar**. To include one, confirm its dates with the club, correct them, turn off **Date needs confirmation**, choose Show, add its reference and publish. [The editorial update](EDITORIAL-UPDATE.md) lists the exact rows.

The tournament application's own [calendar](https://tournament.hobsonsbaychess.com/v2/calendar), upcoming events and registration remain available as separate services. Editing the club calendar does not change tournament registration data.

## Tournament data

Tournament administration stays on the [existing site](https://tournament.hobsonsbaychess.com/v2/upcoming) and [repository](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments).

**2026 Standings** uses the [Open leaderboard](https://tournament.hobsonsbaychess.com/v2/leaderboard/open), summing standard/classical scores and preserving source ordering for ties. Rapid/blitz scores are excluded. It replaces the single 2025 Club Championship table.

The feed checks its year and displays its generation date. Results and upcoming cards refresh from public endpoints; a verified dated snapshot supports static rendering and outages. Contentful manages headings, counts and links, while the service manages scores/registration. Changing the expected year cannot relabel old data.

## Publish to the website

A Contentful publish updates the CMS immediately. Page copy, routes, menus, news, calendar and media reach the static website after a rebuild.

The [public GitHub repository](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027) builds the **published Delivery API**, with hourly rebuilds enabled. For an immediate update use **Actions ` Build and deploy HBCC ` Run workflow ` contentful**. Publish dependencies as well as the page; a failed build preserves the previous deployment. [GITHUB-PAGES.md](GITHUB-PAGES.md) covers hosting.

Tournament standings/upcoming cards refresh directly from their service, independently of CMS publication.

## Developer import and preview

Keep credentials in ignored local `.env`. Delivery/Preview keys read content; the Management token performs migrations and draft imports.

```powershell
npm run contentful:import                        # Dry run, no writes
npm run contentful:import -- --apply              # Initial draft import, skips existing entries
npm run contentful:verify -- --published
npm run cms:preview                              # Native CMS drafts, port 4328
npm run build:production                         # Published content only
npm run verify
```

The initial importer activates models/editors, processes preserved media, detects locale and uses stable IDs. Reruns skip existing entries and refuse incompatible models. Its optional `--apply --publish` keeps disabled/review entries unpublished.

`npm run contentful:update` validates the controlled migration update; `--apply --publish` applies it. This is a developer migration command: it rewrites a documented set of baseline entries. Routine editorial changes belong in Contentful, not another migration rerun.

Strict production builds require complete published content and refuse Preview drafts. Local CMS preview reads saved drafts on reload. Ordinary local review uses port 4327; strict CMS preview uses 4328.

## Club review before domain launch

Historical junior counts, membership fees, sponsor tiers, committee names, policies and downloads retain captured wording and need club acceptance. Contact uses email because Contact Form 7 is not a portable mail backend. Three spreadsheet date conflicts need club confirmation. The production domain remains on WordPress.

See [HOMEPAGE-AUDIT.md](HOMEPAGE-AUDIT.md), [MIGRATION-PLAN.md](MIGRATION-PLAN.md) and the [live CMS verification](CMS-LIVE-VERIFICATION.json).

The model follows Contentful's [native editor interfaces](https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/) and [rich text format](https://www.contentful.com/developers/docs/tutorials/general/getting-started-with-rich-text-field-type/).
