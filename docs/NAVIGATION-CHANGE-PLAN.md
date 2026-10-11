# HBCC navigation and content change plan

Reviewed 12 October 2026. Status: proposed implementation plan.

Keep the August audit's task-based navigation and stable page addresses. The next release should first repair the remaining visitor journeys and reconcile coaching dates, then introduce visible desktop navigation and a Coaching hub. Titled-player profiles, newsletters and subscription should follow when the club has supplied the material to maintain them.

The current Contentful website already provides real club news, an interactive calendar, editable menus and a policies hub. Those features need refinement rather than another rebuild.

## Current assessment

The [August navigation audit](<../Hobsons_Bay_Chess_Club_Navigation_Changes_14.08.2026 (1).docx>) contains the navigation map, persistent actions, 15 immediate link corrections and delivery sequence. Its cover says 8 August 2026; the supplied filename says 14 August. The recommendations below apply to the [deployed Contentful rebuild](https://hobsons-bay-chess-club-au.github.io/website-2027/).

The published CMS has 439 entries, including 14 information pages, three club articles and 150 calendar events. The header still uses a hamburger at desktop widths, and the main menu largely retains the old ten top-level items.

| Audit recommendation | Current position | Next action |
| --- | --- | --- |
| Logo links home | Complete; a separate Home menu item remains | Remove the redundant menu item during the navigation change |
| Play, Calendar, Tournaments, Coaching, Club and News navigation | Outstanding | Publish the new hierarchy and a visible desktop header |
| Join and Member Login buttons | Membership links exist; login is buried in the menu and opens the portal homepage | Add header actions and use the stable direct sign-in address |
| Persistent visitor actions | Hero/footer links cover some tasks, without a shared action area | Add shared shortcuts with the adaptations below |
| Homepage's four feature-card destinations | Complete | Preserve the four working destinations |
| Real news and the old blog redirect | Complete | Keep the current articles, News listing and redirects |
| Interactive calendar | Component and category filters complete | Reconcile dates, add linkable filter states and event destinations |
| Coaching hub | Missing; programs and coach information are currently on Juniors | Create a stable Coaching hub from verified existing material |
| Club history and honour boards | Pages exist; still grouped under About/Tournaments | Move their menu references into Club and repair Champions content |
| Sponsor visibility and member offers | Six homepage logos have names and link to Sponsors; detailed listings/offers are incomplete | Build useful sponsor profiles and publish confirmed offers |
| Policies hub | Complete, with four document links | Improve privacy destinations and document labels |
| Titled Players | Missing | Add only after current titles, affiliation and profiles are confirmed |
| Newsletters and subscription | Missing | Add an archive when editions exist; connect a real subscription service before showing Subscribe |
| Dedicated news categories | Missing; only three published stories, all marked Club news | Defer separate archives until there is useful content for them |

## Changes to make first

### Repair misleading links

These are semantic link problems: the destinations return valid pages, so ordinary broken-link checks do not detect them.

| Current location | Current destination | Proposed correction |
| --- | --- | --- |
| Play Chess, Register for Social Night | Membership | Use the verified event-registration directory with a general registration label. Offer a social-specific signup only when there is an actual listing |
| Play Chess, bottom View Calendar | Contact | Club Calendar at `/calendar/` |
| Membership, bottom View Calendar | Contact | Club Calendar at `/calendar/` |
| Homepage weekly schedule, View Calendar | Separate tournament calendar | Club Calendar at `/calendar/`, after its dates are reconciled |
| Calendar page, secondary View Calendar | Separate tournament calendar | Keep the destination and label it Tournament Calendar |
| Membership, Renew Now | Homepage | [Membership choices](https://portal.hobsonsbaychess.com/public/membership_levels) |
| Membership, View Juniors Program | Annual schedule PDF | Juniors at `/juniors/` |
| About, Join the Club | Contact | Membership at `/membership/` |
| All three Juniors enrolment buttons | Contact | `/coaching/#enrol` once the hub exists. Until then, label contact links as enquiries |
| Header/menu Member Login | Portal homepage | [Member sign-in](https://portal.hobsonsbaychess.com/users/sign_in), retaining the existing new-tab preference |
| Footer Results & Pairings | Overall Open leaderboard | [Tournament archive and results](https://tournament.hobsonsbaychess.com/v2/), labelled Pairings & Results |
| Footer Privacy and Privacy Policy | General Policies listing | Point to the existing privacy document initially, then the dedicated privacy page |
| Footer Cookie Policy | General Policies listing | Supply matching approved content or remove this label |
| DGT Link and Club Database labels | Existing broadcast and games pages | Rename to Live Boards and Games & PGNs; retain their addresses |

The homepage Full Table action should continue to open the Open leaderboard. Its purpose is standings, while Pairings & Results should lead to the tournament directory.

Three links under Upcoming & Register currently advertise events that have finished: Best in the West, Victorian Women's Championship and Victorian Junior Rapid/Blitz. Remove these from the upcoming navigation and retain their material in event/history pages. Keep Oceania Youth 2027 available through the relevant future-event destination.

The [public event directory](https://portal.hobsonsbaychess.com/public/schedule/events) is available. It currently lists championship and coaching activities; a specific future social-night registration was not present in its upcoming list on 12 October. A general event link is a better interim label than promising a social-night booking.

### Reconcile the calendar before promoting it

The imported spreadsheet and current booking pages have diverged. The [current Term 4 coaching listing](https://portal.hobsonsbaychess.com/public/schedule/events/89309-hobsons-bay-junior-coaching-2026-term-4) excludes coaching on 31 October and finishes on 5 December.

| Coaching session | Current CMS date | Booking-page date |
| --- | --- | --- |
| 1 to 3 | 10, 17 and 24 October | Same dates |
| 4 | 31 October | 7 November |
| 5 | 7 November | 14 November |
| 6 | 14 November | 21 November |
| 7 | 21 November | 28 November |
| 8 | 1 December | 5 December |

Update the affected coaching entries after the coordinator confirms the published booking schedule. Preserve their original imported date text and record the source used for the correction.

Junior tournament round 3 **does run on 31 October**, according to its [own event listing](https://portal.hobsonsbaychess.com/public/schedule/events/89505-hbcc-junior-club-championship-reserves-rookies-juniors-2026). Keep that round. Check the existing 28 November closure wording too: a junior competition break should not hide a coaching session or another club activity.

Use program-specific closure labels where activities differ. A notice for a junior tournament break should not be presented as the whole club being closed.

The three previously quarantined spreadsheet rows remain separate review items. The [Best in the West booking page](https://portal.hobsonsbaychess.com/public/schedule/events/80371-2026-best-in-the-west) confirms 29 to 30 August **2026**, providing a source for correcting the row that says 2025. Confirm the other two ranges against their organisers before including them.

The [annual PDF](https://hobsonsbaychess.com/wp-content/uploads/2026/01/Schedule-2026.pdf) and its Contentful copy are available. Keep an annual download as a secondary option, but reconcile its revision first: it also disagrees with the junior event listing about 31 October. The event organiser's current schedule should settle program-specific dates; the old CSV or PDF should not overwrite later CMS corrections automatically.

### Clean inherited content

Remove the exposed WordPress timeline shortcode on Champions. Retain confirmed historical winners and ask the club to supply missing/recent records; the current honour board ends at 2024.

Resolve the `[X]` minimum-age placeholder on Juniors and confirm parent/orientation guidance. The existing page names four coaches, while the current booking description refers to five; obtain the current roster before copying profiles into Coaching.

Review membership renewal wording, fees, sponsorship availability and old broadcast labels. Completed September/August broadcasts belong under an archive heading rather than Current Live Broadcasts.

## Proposed navigation

Use the audit's six task groups, with the logo as Home and Join/Member Login as separate actions. Keep the existing club URLs.

| Header item | Main destination | Dropdown destinations |
| --- | --- | --- |
| Logo | `/` | Home |
| Play | `/play-chess/` | First Visit; Adult and Social Chess; Junior Chess; Weekly Club Times; Venue and Getting Here |
| Calendar | `/calendar/` | All Club Dates; Senior Tournaments; Junior Tournaments; Coaching Dates; Event Registration; Annual Schedule |
| Tournaments | `/tournaments/` | Upcoming and Register; Pairings and Results; Live Boards; Games and PGNs; Flagship Events; Best in the West |
| Coaching | `/coaching/` | Programs and Levels; Meet the Coaches; Junior Coaching; Private Coaching; Enrol or Enquire |
| Club | `/about-us/` | About HBCC; History; Champions and Honour Boards; Peter Caissa Memorial; Committee and Volunteers; Arbiters; Sponsors; Membership; Policies; Contact and Venue |
| News | `/news/` | Latest News; Newsletters when available; category archives when populated |
| Join button | `/membership/` | Membership information and Join/Renew |
| Member Login button | Portal sign-in | Member account |

Add Titled Players to Club when the verified page is ready. Use Sponsors and Member Offers only once actual, current offers are published; Sponsors is a clearer interim label.

Junior Chess remains prominent through the homepage card and Play. Junior Coaching should lead into `/coaching/#programs`; the Juniors page can concentrate on participation, competitions and parent guidance while linking to shared coaching information.

Keep the Club dropdown grouped visually rather than adding another nesting level. Group links into About and People, History, and Membership and Support. Tournaments no longer needs the current three-level event/champions structure.

### Shared actions

On desktop, place Join and Member Login in the header. Add three short task links beneath it: What's On, Register for an Event, and Pairings & Results. This retains the audit's five actions without duplicating Join/Login in both rows.

On mobile, put all five tasks near the top of the menu. Keep the logo, Join action and menu control visible where space permits. Retain the black/gold styling, social links and keyboard-accessible menu behavior.

Make each desktop group label open its hub page, with a separate accessible control for its dropdown. The mobile menu should offer both the overview link and its child destinations.

### Stable section and calendar links

The following addresses require new anchor/filter support before they are added to navigation.

| Destination | Purpose |
| --- | --- |
| `/play-chess/#first-visit` | Beginner/returning-player entry point |
| `/play-chess/#social-chess` | Adult and social activities |
| `/play-chess/#weekly-schedule` | Normal session times, distinct from date-only calendar events |
| `/tournaments/#flagship` | Named flagship event cards |
| `/coaching/#programs` | Coaching levels |
| `/coaching/#coaches` | Verified coach profiles |
| `/coaching/#private-coaching` | Private-coaching availability and enquiries |
| `/coaching/#enrol` | Stable enrolment gateway linking to the current term |
| `/about-us/#committee` | Committee and volunteers |
| `/about-us/#arbiters` | Arbiters |
| `/sponsors/#become-a-sponsor` | Sponsorship enquiry |
| `/policies/#privacy` | Approved privacy document |
| `/calendar/?category=seniors` | Senior tournament dates |
| `/calendar/?category=juniors` | Junior tournament dates |
| `/calendar/?category=coaching` | Coaching dates |
| `/calendar/?category=social` | Social activities |

The calendar currently supports selection in its controls but does not read or update these URL parameters. Add that behavior, including reload and browser Back/Forward. Use labels matching the actual categories; an Adult Events label would imply a broader audience filter than the current Seniors category provides.

Add an upcoming-only agenda option for What's On so visitors can see remaining dates beyond the current month. Preserve month browsing, historical dates and the existing iCalendar download.

## Page changes

### Coaching

Create `/coaching/` using the current junior programs and approved coaching information. Include levels, current term dates, coaches, parent guidance, private-coaching availability, policies, and an enrolment section.

The enrolment section should serve returning families and first-time enquiries. Store the current term's registration destination in Contentful, with a general event-directory fallback when no term is open. Confirm whether initial contact and orientation remain required before offering direct registration to a new family.

Private-coaching tickets are currently shown as sold out on the Term 4 page. Explain how to enquire about availability rather than advertising an immediately bookable place. Actual class times vary by group and coach; retain that qualification.

Reuse the same coach cards on Coaching and Juniors, avoiding two independent rosters.

### Play and Tournaments

Add a concise First Visit section covering who can attend, choosing an appropriate activity, normal times, venue, equipment and the next action. Use confirmed club guidance for eligibility and fees.

Turn Tournaments into a clear routing hub with actions for upcoming events, registration, pairings/results, live boards and games. Improve the existing flagship cards with names and useful destinations. Keep event-specific booking pages and results in the existing services.

Keep Champions and Peter Caissa Memorial accessible through Club history. The Peter Caissa history page can also be linked from a relevant event card; placing history under Club does not remove the tournament pathway.

### Sponsors and policies

Use the existing Sponsor entries for named, linked profiles with logos, descriptions and current websites. Reuse them on the homepage and Sponsors page. Put the sponsor enquiry under a stable anchor.

Keep package prices and Sold Out states only after the sponsor lead has confirmed them. Publish offer details, redemption instructions and expiry where the club has a real member benefit.

The Policies hub already exists. Retain its approved documents and add a clearer privacy destination. A `/privacy-policy/` page can provide the approved summary and document link; it does not require recreating the full policies hub. Keep footer labels aligned with the content actually available.

### Profiles and newsletters

Create Titled Players when the club provides current affiliation, verified titles, source links, biographies and suitable photographs. Historical champion titles are insufficient evidence for a current player profile.

Create Newsletters when editions and publication dates are available. Start with a chronological archive of PDFs or public issue links. Add Subscribe only after a real sending/subscription service and its confirmation/unsubscribe flow are connected.

Separate Tournament Reports and Club Announcements archives can follow when there are published articles assigned to those categories. With only three current stories, an empty set of new archive pages would add navigation without helping visitors.

## Contentful and frontend work

### Extend existing models

| Model | Proposed addition | Reason |
| --- | --- | --- |
| Website settings | Optional header-actions and quick-actions menu references | Editors manage Join/Login and shared tasks independently of the main menu |
| Section | Optional validated anchor ID | Stable First Visit, coaches, committee and other section links |
| Navigation item | Optional fragment appended to a selected page reference | Anchors follow future page slug changes |
| Calendar event | Optional registration/details link, closure scope, verified source and last-checked date | Useful next actions, precise notices and traceable schedule corrections |
| Club calendar | Optional annual PDF asset and revision text | Editable secondary download |
| Sponsor | Offer details, redemption information and expiry, when needed | Maintain actual member benefits |
| News section | Optional category selection | Reuse normal CMS pages for later category archives |

Keep new fields optional while migrating so existing published content still builds. Validate anchor uniqueness per page, safe URLs, supported filter values, and duplicate routes. Continue using native controls.

New Coaching and privacy pages fit the existing page/section/card models. A separate Newsletter type is justified once there is an archive to manage, with title, issue date, summary, PDF or public URL, cover and visibility. Consider a shared Person profile type if coaches, titled players, committee and arbiters need frequent reuse; include verified roles/titles and source dates. Any new type also needs the corresponding section references, reader normalization and frontend rendering.

### Frontend changes

The existing recursive menu supports the hierarchy, but changing Contentful entries alone will not produce the audit's visible desktop header. Add the responsive desktop navigation and shared action area in `src/components/Header.astro` and `src/styles/global.css`, keeping a usable mobile dialog.

Add section IDs in `src/components/Sections.astro`. Resolve page-plus-fragment links in `src/lib/content-source.mjs` and the rich-text link renderer. Extend `src/lib/calendar-client.mjs` to support URL state and an upcoming agenda; extend the Calendar component for optional event and download links.

Use native reference/media fields throughout. GitHub Pages remains static; subscription should hand off to a real service or a deliberately added backend. No new payment, membership or tournament-registration system is needed.

## Delivery sequence

| Phase | Deliverable | Dependency | Indicative developer effort |
| --- | --- | --- | --- |
| 1 | Repair existing links, clean shortcode/placeholder issues, reconcile coaching dates | Current club/organiser confirmation for unresolved facts | 0.5 to 1 day |
| 2 | Add anchors, calendar links and the minimum Coaching gateway | Approved program, enrolment and parent information | 1.5 to 2.5 days |
| 3 | Publish the new header, task menus and routing hubs | Phase 2 destinations available and tested | 1.5 to 2.5 days |
| 4 | Sponsor detail, profiles, newsletters and optional news categories | Club material and any subscription provider | 2 to 4 additional days |
| 5 | Editorial preview, visitor-journey testing and release checks | Completed scope and club review | 0.5 to 1 day |

Phases 1 to 3 and their checks form the recommended first release, roughly **4 to 6 developer days** once the core content is ready. Phase 4 can ship incrementally. Estimates exclude time waiting for club material, a new mailing provider, or a production-domain cutover.

Build the new menu and pages as drafts while the current menu remains available. Publish destination pages/media first, then menu references and settings, and rebuild the site. Use targeted, version-checked content updates; re-running the whole migration importer would risk resetting editorial changes.

Record a CMS snapshot before changes and retain the previous frontend deployment. Rollback should restore the affected content references and deploy the previous release. Domain launch can follow club acceptance separately.

## Club inputs

| Input | Suggested owner | Needed for |
| --- | --- | --- |
| Current coaching roster, levels, age guidance, enrolment/orientation requirements and dates | Coaching coordinator | Coaching hub and safe enrolment journey |
| Membership fees, renewal destination and participation requirements | Membership/treasurer role | Join/Renew and parent guidance |
| Confirmed honour-board records and current player titles/affiliation | Committee or tournament organiser | Champions and Titled Players |
| Active sponsors, package availability and verified member offers | Sponsor lead | Sponsor detail and offers |
| Newsletter editions, dates, editor and subscription service | Newsletter editor/committee | Archive and Subscribe |
| Approved privacy wording and policy revisions | Committee | Accurate footer destinations |
| Organiser confirmation for unresolved calendar ranges | Tournament/calendar coordinator | Reviewed calendar entries |

Technical preparation for navigation can proceed while optional profiles/newsletter material is collected. Enable menu items as their actual destinations become ready.

## Acceptance checks

1. An adult visitor reaches First Visit, session times, venue and a suitable event without being sent to an unrelated page.
2. A parent reaches coaching levels, correct term dates and the appropriate enquiry or registration path from Juniors.
3. A member reaches the sign-in flow directly; Join/Renew reaches membership choices.
4. A competitor reaches individual tournament pairings/results, live or archived boards and the games service from Tournaments.
5. A prospective sponsor reaches named sponsors, real offers and the sponsorship enquiry.
6. Calendar category links open with the selected state, survive reload and Back/Forward, and the upcoming agenda excludes completed events appropriately.
7. Coaching is absent on 31 October if the confirmed booking schedule remains current, while junior round 3 remains visible. Closure wording does not conceal other programs.
8. Every new anchor exists. Original page URLs and the News/blog redirects continue working under both the GitHub project path and the future root domain.
9. The desktop header fits without crowding; mobile/tablet menus work at 390, 768 and normal desktop widths, with keyboard navigation, focus return and usable touch targets.
10. No raw WordPress shortcode, minimum-age placeholder, empty enabled archive or misleading policy label remains in the agreed release scope.
11. CMS edits to menus, actions, page sections, coaching destinations and calendar links appear in preview and the published build.
12. Existing tests, strict published-content build and link/asset verification pass. Add meaningful checks for fragment resolution, filter URL state and the corrected journey destinations; preserve the original audit snapshot and document intentional copy changes.

## Primary references

- [Current rebuilt website](https://hobsons-bay-chess-club-au.github.io/website-2027/)
- [Current club events and registration](https://portal.hobsonsbaychess.com/public/schedule/events)
- [Current coaching term and schedule](https://portal.hobsonsbaychess.com/public/schedule/events/89309-hobsons-bay-junior-coaching-2026-term-4)
- [Junior championship schedule](https://portal.hobsonsbaychess.com/public/schedule/events/89505-hbcc-junior-club-championship-reserves-rookies-juniors-2026)
- [Best in the West dates](https://portal.hobsonsbaychess.com/public/schedule/events/80371-2026-best-in-the-west)
- [Annual schedule PDF](https://hobsonsbaychess.com/wp-content/uploads/2026/01/Schedule-2026.pdf)
- [Existing tournament application](https://tournament.hobsonsbaychess.com/v2/)
- [Contentful editor guide](CMS-GUIDE.md)
