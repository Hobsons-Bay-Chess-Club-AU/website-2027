# Homepage audit — before the CMS expansion

Audited 10 October 2026 against [the live HBCC homepage](https://hobsonsbaychess.com/), the supplied screenshots, the preserved WordPress REST content and the authenticated WordPress export. The first-version source and content were copied to `reference/audit/first-version-*` before implementation changes. A fresh source capture, section/link inventory and desktop screenshots are preserved alongside them.

The first version contains every major homepage section and all 14 club information routes. It is a functional reconstruction, not a pixel-identical port of the Campo theme. The following gaps need attention in this version.

| Area | First-version finding | Resolution in the CMS version |
| --- | --- | --- |
| Header | Knight logo, Facebook, Instagram and menu button present. Logo and hero fonts/assets match the source. | Make branding, social links and menu references editable. |
| Main menu | All 21 source destinations present, but the Upcoming & Register and Champions grandchildren were flattened. Member Login lost its new-tab setting. | Restore three-level hierarchy, ordered linked menu items, enabled toggles and new-tab options. |
| Hero | Title, gold strapline, description, partner graphic, two buttons and four feature cards present. Partner alt/label and button labels were hardcoded. | Editable homepage fields, linked actions/cards, asset picker and partner alternative text. |
| Feature cards | Content and destinations present; the source cards use placeholder `#` links, improved in the rebuild. Membership glyph differs slightly from the source. | Keep useful destinations and use the source address-card glyph. |
| Club statistics | All six values and labels present. Theme counter animation and decorative icons absent. `99 Juniors in 2025` is historical data. | Editable individual statistics; retain the explicit 2025 label until the club supplies a 2026 junior count. Decorative icon support; no invented 2026 count. |
| Standings | Faithful eight-row 2025 table and original full-table URL, now outdated by the requested change. | Replace with the current 2026 Open leaderboard, using classical points across tournaments. This is a different measure from a single Club Championship. |
| Events | Four old January/March 2026 cards reproduced. The final event had only a general registration URL. | Use the existing tournament service for upcoming events and calendar; stop maintaining a duplicate event list in the CMS. |
| Weekly feature | Source photo, heading, description and action present; copy/action hardcoded. | Editable section text, image and action. |
| Weekly schedule | All seven days and three sessions present. Source per-day decorative imagery/theme calendar styling simplified. Source Download Schedule points to a missing PDF; the rebuild uses View Schedule. | Editable days/sessions and labels; link to the existing tournament calendar. Do not restore the broken download. |
| Sponsors | All six logos present; source carousel replaced by a responsive grid. Sponsor links default to the sponsor page where the source has no useful link. One logo is Community Bank Altona & Laverton, despite a source filename referring to Altona Sports Club. | Editable sponsor records, logos, links and order; correct the accessible name to match the logo. |
| Latest news | Three homepage stories, images, dates, headlines and all-news route retained. Author/category metadata absent. The five imported posts are football theme demo content, already flagged for review. | Editable posts with author/category fields and homepage selection. Keep demo-content review flags visible to editors. |
| Testimonial | Quote retained; copy hardcoded. | Editable quote section. No invented attribution. |
| Join banner | Headline and join action retained. Source Contact us/email prompt missing. | Restore editable contact prompt and action alongside join action. |
| Footer club links | All five labels present; source placeholder News/Results/Privacy links improved. | Editable footer menu; results points to the current leaderboard. |
| Footer quick links | About Us and Contact omitted from the seven-link source list. | Restore both; ordered footer menu references. |
| Footer contact/connect | Email, address, Facebook and Instagram present. CONNECT heading, YouTube link and MORE ON INSTAGRAM prompt missing. | Restore them with editable social items and labels. |
| Footer gallery | All six source images present; alt text generic; no Instagram action. | Editable gallery cards with individual alt text and optional links. |
| Copyright/legal | Club/year and two labels retained. Broken/misdirected source policy destinations repaired to the existing policies page. | Editable copyright text and legal menu; year generated automatically. |
| Styling and interaction | Typography, black/gold hero and imagery close to source; source brush transitions, animated counters, carousel, timetable decoration and exact lower-page spacing differ. | Preserve the established visual language, improve CMS editability and retain accessible native navigation/accordions. Do not claim pixel equivalence. |
| Forms/embedded services | The homepage has no contact form. Inner contact page uses a working mail link because Contact Form 7 requires a separate sending service. | Retain an honest contact route; calendar and registration continue on their existing services. |
| Mobile/accessibility | First version has a responsive two-column feature grid, stacked results/events, native dialog and keyboard focus handling. A full desktop capture can show lazy-loaded news images as blank until scrolled into view. | Recheck at 390 px and 1440 px after CMS changes, including nested menus, tables, accordion content and loaded images. |

## Tournament integration findings

The supplied [tournament repository](https://github.com/Hobsons-Bay-Chess-Club-AU/tournaments) contains the current v2 application. Verified public routes are `/v2/leaderboard`, `/v2/leaderboard/open`, `/v2/upcoming` and `/v2/calendar`.

The Open leaderboard's default Points tab sums `score` from tournaments whose `ratingType` is `standard`; it does not show just the Club Championship points. The public `open-ratings.json` supplies a year and generation timestamp. The homepage must check that year, show the data timestamp, preserve source order for tied scores, and never relabel a cached 2025 table as 2026. Upcoming events stay in the tournament service; the CMS controls presentation and links only.

## CMS coverage required by this audit

Editors must be able to add/reorder/hide page sections, edit rich text without HTML, replace images through Contentful's media picker, manage recursive main/footer menus, edit homepage copy/actions/cards/statistics/schedule/sponsors/news/testimonial, and manage global branding/contact/social/gallery/SEO content. WordPress HTML remains a migration reference rather than the primary page editor. Tournament scores, registration and calendar data remain owned by the existing tournament service.

Post-implementation verification and any unresolved source-content issues are recorded in `CMS-GUIDE.md` and `verification.json`.

## Implementation follow-through

The identified content gaps are addressed in the local CMS version: original submenu nesting/new-tab setting, footer About/Contact links, contact banner, Connect/Instagram prompt and YouTube. Statistics/icons, sponsor accessible naming, news metadata and footer media are editable. The 2026 Open table and current tournament-service event cards replace old data.

Native conversion preserves every word of the first version's 13 information pages; the calendar deliberately delegates to the existing service. Eleven tests pass, the 22-page build succeeds, and 1,213 local links/assets check without missing files, unsafe URLs or WordPress media dependencies. Desktop/390 px checks cover current results, nested menus and native membership FAQs.

The Contentful account import remains pending a Management token. These checks validate the local model/fixtures and frontend; they do not claim a successful write or editorial cycle in the still-empty account.
