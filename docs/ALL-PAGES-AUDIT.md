# HBCC full page audit — 12 October 2026

The review compared fresh public WordPress pages with both deployed rebuilds, then checked the repaired pages at desktop and phone widths. It covers all 14 migrated core pages, the news listing and stories, and the additional V2 Coaching, Privacy and team-review routes.

The first word-preservation report compared the rebuild with the first extracted copy. That proved the second conversion preserved that copy, but could not detect material already lost during extraction. This audit uses fresh WordPress HTML, including subheadlines, icon-list text, media, tables, actions and maps. Phrase differences are candidates for review: intentional rewrites, duplicate responsive content and WordPress plugin controls are not automatically omissions.

## Findings and repairs

| Page | Findings | Result |
| --- | --- | --- |
| About Us | Previously lost introduction, volunteers, arbiter roster and layouts were restored in the preceding release. | Verified five committee portraits, ten volunteers, sixteen arbiters, three affiliations, governance links and the venue map. Source spelling and opening-hour discrepancies remain for the club. |
| Membership | The preceding release restored five fee cards, four benefits, shared statistics, joining steps, policy links, junior information and FAQs. | Verified native CMS fields and policy destinations. Existing fee amounts are retained for club approval. |
| Play Chess | Eight icon-list points were missing. Who-can-play, event formats and joining steps were flattened; the original hero title/calendar action was absent. | Restored the eight points, native cards, image/text sections, four steps, five FAQs and hero action. V2 retains its additional First Visit section and weekly schedule. |
| Juniors | Four parent-information points were missing. V2's replacement introductions lost the original program and coach context. The age FAQ contained `[X]`. | Restored four parent guidance cards and both introductions; programs, coaches, pathway and policies use native entries. Replaced the age placeholder with an enquiry. Juniors and V2 Coaching share the same four coach records. |
| Tournaments | Three club-competition points and four venue/rules points were missing. Hero actions and flagship names were lost in the flattened layout. | Restored seven points, three hero actions, four flagship cards, format cards, policy action and FAQs. V2 retains the tournament routing hub. The unsupported Koshnitsky Grandmaster wording remains removed. |
| Sponsors | V2 used only the six homepage sponsors, omitting Bacchus Marsh Grammar from the original seven-logo Sponsors page. Benefits, package headings, inclusions, activations and process steps were flattened. The original GS Chess destination was misdirected. | Seven named profiles now have contained logos, aligned headings and equal minimum card heights. Restored benefits, shared statistics, package heading, inclusion list, four activation cards, four process steps, FAQs, hero/enquiry actions and the GS Chess destination. All editable material remains native CMS content. |
| Champions | The original list stopped at 2024 and displayed oldest first. | Added **2025 — Julian McIntyre, 5 points**, verified against final round-seven standings. Twelve published Club champion records display newest first, automatically sorted by year. The 2025 row links to final results. |
| Contact | The initial migration replaced the entire page with a short email block, losing the map, session guidance, visitor advice, forfeit periods, etiquette and useful journeys. | Restored session cards, shared venue map, address/directions, visitor guidance, arrival/forfeit information, native etiquette link, club contacts and event/membership actions. Removed duplicate mobile copy. Email provides the working enquiry destination. |
| History | Historical text and photographs survived, but raw timeline plugin instructions were visible in the current rebuild. | Removed exposed shortcodes in both rebuilds. The original historical material remains. The source ends in 2003; a later history chapter requires club material. |
| Best in the West | Winners through 2025 and both 2018/2019 winner tables survived. Raw plugin instructions were visible in the current rebuild. | Preserved all names and both tables; removed leaked shortcodes. Tables scroll within their own region on a phone. No missing years or later winners were invented. |
| Peter Caissa Memorial | The memorial text, portrait and winners survived; raw plugin instructions were visible in the current rebuild. | Preserved the original content/media and removed leaked shortcodes. Further winner records require club confirmation. |
| DGT Link / Live Boards | All four Lichess destinations survived. Source wording described completed 2026 broadcasts as currently live. | Verified links. V2 deliberately labels these as a Broadcast Archive and directs visitors to upcoming events. |
| Calendar | The WordPress spreadsheet/document link was deliberately replaced with a calendar component. | Preserved imported dates and the existing tournament service. V2 retains its separately reviewed Term 4 corrections, activity filters, upcoming agenda and iCalendar download. Three ambiguous import rows remain hidden drafts. |
| Policies | WordPress's short document list was expanded in the previous release into seven approved native Club policy entries. | Verified policy ordering, media, hide/show behaviour and links from Membership, About, Juniors, Tournaments and Contact. |
| News | WordPress football-theme placeholders were deliberately replaced with recent sourced club reports in the earlier update. | Verified the three published club stories and their existing photographs. Future Facebook imports remain drafts and protect manual editorial edits. |
| V2-only pages | Coaching, Privacy & Photography and the review page have no direct one-to-one WordPress page. | Coaching reuses the Junior CMS cards and parent guidance; Privacy reuses the approved policy; review notes list changes and outstanding decisions. |

The initial extraction removed `.bt_bb_icon_holder` as if it were decoration, although it contains real editorial text. That removal has been corrected. The one-time restoration also protects later CMS edits, so running it again does not overwrite the new cards or champion names.

## Intentional differences retained

- The calendar component and existing tournament service replace the old spreadsheet-only journey.
- Recent HBCC news replaces football-theme demo articles.
- V2 package enquiries replace unconfirmed sponsor prices and Sold Out claims. The current comparison version retains the captured four tiers and amounts in native fee cards.
- Contact uses a working email link. A WordPress Contact Form 7 form cannot send mail on static GitHub Pages without a separate backend. No simulated successful submission was added.
- Source Contact buttons used `#` and linked a club shop. Event Tickets now reaches the existing portal, Visitor Information reaches Play, and the unverified shop journey is omitted until the club supplies its actual destination.
- Contact's repeated beginner/experience paragraph is shown once and scoped to competitive tournaments. Social chess and junior coaching remain options for beginners.
- Contact points families to their current coaching group/term listing instead of choosing one conflicting start time. WordPress's duplicate logo and form/plugin control text are not migrated as editorial content.
- V2 navigation, new routes and calendar corrections remain a proposal. Shared content repairs do not switch the WordPress production domain.

## Club input still needed

| Item | Evidence / decision needed |
| --- | --- |
| Opening and coaching times | About says Tuesday 7pm–11:59pm and Saturday 4pm–11pm. Contact says Tuesday 7:30pm–11:30pm and Saturday 4pm–9pm. Homepage coaching says 5–6pm, while Contact says 4pm; current term times vary by coach/group. Confirm one shared schedule and closing-time policy. |
| Earlier champions and gaps | The original Champions page starts in 2012 and skips 2020/2021. Confirm earlier records and whether skipped years had a champion. Add any 2026 champion only from final results; the annual aggregate leaderboard is a different competition. |
| Other honour boards | Best in the West currently reaches 2025. Confirm later results and any missing historical winners. Confirm further Peter Caissa winners from club records. |
| Names and roles | Resolve the source's Dwyer/Drywer and Srikrishna/Sri Krishna spelling differences and the previously noted coaching-roster discrepancy. |
| Fees and sponsorship | Accept the existing membership fees and statistics. Confirm current sponsor names, tiers, prices, availability and any actual member offers before promoting the comparison-version package wording. |
| Club shop / contact form | Supply the actual shop destination if one is in use. Decide whether email is sufficient or provide an approved mail-form service. |
| Calendar | Resolve the three quarantined spreadsheet dates and approve the V2 Term 4 corrections against the booking pages. |
| New editorial material | Supply a later history chapter, newsletter editions and any subscription provider; create news category archives when sufficient stories have been classified. |

## CMS editing and verification

- **Club champion** is a new native Contentful type: year, player name, optional chess title, result, final standings URL and visibility. Add and publish a record, link it in the Champions page's Honour board section, and rebuild. The website sorts by year automatically.
- Sponsors use the existing **Sponsor / partner** type. Benefits, activations, steps, FAQs, session information and parent guidance are **Card** and **Section** records, with native Rich Text and media references.
- The current and V2 builds use published Contentful content. All existing media assets are reused; management credentials remain local/ignored.
- Before mutation, the targeted migration saves a private snapshot, checks entry versions and rejects unpublished editorial conflicts. It preserves the eight unrelated drafts. Existing published page backlinks are permitted; recursive section cycles are rejected.
- The automated checks cover exact missing source copy, native CMS edits, champion ordering/validation, all seven sponsor names, contact destinations, policy links, draft protection and V2 isolation.
- Desktop and phone inspection checks headings, images, embedded maps, tables and document overflow across all core pages, News and Coaching. Sponsor, Champion, Contact and other changed layouts receive visual inspection. Best in the West tables remain locally scrollable rather than widening the document.

Source inventory: [fresh before-comparison](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027/blob/main/reference/audit/full-page-review.json). Exact restoration copy and championship provenance: [page-restoration.json](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027/blob/main/reference/audit/page-restoration.json).

Champion source: [2025 HBCC Club Championship — final round-seven standings](https://tournament.hobsonsbaychess.com/www2025HobsonsBayClubChampionship/standings.html). Original pages are available under their matching routes at [hobsonsbaychess.com](https://hobsonsbaychess.com/).

Review the deployed changes at [V2](https://hobsons-bay-chess-club-au.github.io/website-2027/v2/) and its [team checklist](https://hobsons-bay-chess-club-au.github.io/website-2027/v2/review/). Reply to the person sharing the link with the page URL, device and proposed correction.
