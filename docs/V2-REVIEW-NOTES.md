# HBCC V2 — Team Review

Prepared 12 October 2026

Review website: https://hobsons-bay-chess-club-au.github.io/website-2027/v2/

Changes and checklist: https://hobsons-bay-chess-club-au.github.io/website-2027/v2/review/

## Changes in this version

1. **Visible desktop navigation** — Six clear groups — Play, Calendar, Tournaments, Coaching, Club and News — replace the desktop-only hamburger journey. Group names open their overview pages; separate controls open the dropdowns. The arrows now align with the menu labels.

2. **Membership layout restored in both versions** — Five fee cards, four benefits, shared club statistics, joining steps, etiquette/policy links, junior information and five expandable FAQs replace the flattened text. Existing fee amounts and public payment instructions are retained. Fees, cards, steps and actions are native Contentful entries.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/membership/

3. **About Us content and layout restored in both versions** — The original introduction, five committee portraits, ten volunteers, three affiliation logos, sixteen arbiter names, governance links, venue map, opening hours and joining actions are restored. Names and roles are editable cards in Contentful; the existing source’s spelling differences still need club confirmation.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/about-us/

4. **Policies managed as a Contentful type** — Seven existing approved club documents are published as reusable Club policy entries. Membership etiquette, privacy and tournament-rule links open the relevant section of the Policies hub. About, Juniors and Tournaments also use these references. Editors can replace documents, change titles, reorder policies or hide an entry without changing code.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/policies/

5. **Join, login and quick tasks** — Join / Renew and Member Login sit in the desktop header. What's On, Register for an Event and Pairings & Results sit below it. All five tasks are near the top of the mobile menu.

6. **Simpler navigation groups** — Junior Chess is under Play. Coaching has its own group. History, champions, Peter Caissa, committee, arbiters, sponsors, membership, policies and contact are grouped under Club. Finished 2026 event bookings are removed from the upcoming menu; their historical pages remain.

7. **A First Visit section** — Play now opens with choosing an activity, arriving early, equipment and venue guidance. It includes the existing weekly session times and direct links to the club calendar, junior chess and enquiries.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/play-chess/#first-visit

8. **A dedicated Coaching page** — Programs and levels, the existing four named coaches, Term 4 dates, parent policies, private coaching and an enquiry/term-details gateway are collected in one place. Juniors and Coaching use the same program and coach cards.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/coaching/

9. **Accurate coaching availability wording** — The review says current group ticket sales have ended and one-on-one tickets are sold out. New families can enquire and follow the existing registration/orientation process. Actual class times depend on the group and coach.

10. **A Tournaments routing hub** — One section connects upcoming competitions, event registration, pairings/results, live boards, games/PGNs and Oceania Youth 2027. Recurring flagship events now have readable names and cards. The inherited, unsupported Grandmaster description of Igor Koshnitsky is omitted.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/tournaments/

11. **Calendar links you can share** — Senior, junior, coaching and social filters open directly from navigation and page links. The chosen category, view and month stay in the URL, survive reload, and follow browser Back/Forward.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/calendar/?category=coaching

12. **An upcoming agenda** — What's On shows remaining dates across future months rather than only the current month. Month and monthly agenda views are retained, together with an iCalendar download.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/calendar/?view=upcoming

13. **Term 4 calendar corrections** — Coaching sessions 4–8 move to 7, 14, 21 and 28 November and 5 December, following the current booking page. A clearly named coaching break appears on 31 October. The junior championship round on 31 October remains, and 28 November is labelled as a junior tournament break rather than a whole-club closure.

14. **Clear calendar sources and next steps** — Affected coaching and junior championship dates link to their event details. The original annual PDF is available as a secondary download and is labelled as an older source with later corrections in the review calendar.

15. **Six named sponsor profiles** — The Sponsors page reuses the six existing homepage sponsor names and logos. Homepage logos link to those profiles. Sponsorship enquiries have their own section link. Unconfirmed package prices and Sold Out labels are replaced with an enquiry for current availability.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/sponsors/

16. **Useful privacy and policy destinations** — A Privacy & Photography page links to the existing approved document. Footer privacy links open it. The misleading Cookie Policy link is removed; the Policies hub retains its documents.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/privacy-policy/

17. **Inherited content cleanup** — Exposed WordPress timeline shortcodes are removed from History, Champions, Best in the West and Peter Caissa. The junior age placeholder is replaced with an enquiry. Obvious capitalisation/address-label errors are corrected. Ended live broadcasts are clearly labelled Broadcast Archive.
   https://hobsons-bay-chess-club-au.github.io/website-2027/v2/dgt-link/

18. **A separate review version** — Navigation and calendar proposals stay inside /v2/. Membership, About Us and policy repairs are shared fixes published in Contentful and shown in both rebuilt versions. Every review page has a banner linking to this change list and is excluded from search indexing. The original WordPress domain remains unchanged.

## Action links: before and after

| Action | Before this review work | Destination in V2 |
| --- | --- | --- |
| Play: Register for Social Night | Membership page | Find Social Nights → filtered upcoming calendar |
| Play: View Seniors Calendar | Annual PDF | Senior calendar filter |
| Play: View Calendar | Contact page | Club calendar |
| Membership: View Calendar | Contact page | Club calendar |
| Membership: Renew Now | Homepage | Portal membership choices |
| Membership: View Juniors Program | Annual PDF | Junior Chess page |
| About: Join the Club / Join HBCC Today | Contact page | Membership page |
| Juniors: enrol actions | Contact page | Coaching enrol/enquiry section |
| Juniors: View Juniors Calendar | Annual PDF | Junior calendar filter |
| Homepage weekly schedule: View Calendar | Tournament calendar | Main club calendar |
| Calendar: external View Calendar | Unclear label | Renamed Tournament Calendar; destination retained |
| Footer: Results & Pairings | Open leaderboard | Pairings & Results → tournament directory |
| Footer: Privacy / Privacy Policy | General policies list | Privacy & Photography page and approved document |
| Footer: Cookie Policy | General policies list | Removed until matching approved content exists |

## Club input still needed

- **Coaches and parent guidance** (Coaching coordinator): Confirm the current roster, program levels, minimum-age guidance and the first-time enquiry/orientation process. The existing site names four coaches; the booking description refers to five.

- **Calendar sign-off** (Calendar / tournament coordinator): Confirm the program-specific Term 4 corrections and volunteer-night wording. Two ambiguous imported date ranges remain excluded. The quarantined Best in the West year typo still needs a targeted correction in the CMS; its published organiser page confirms 29–30 August 2026.

- **Membership information** (Membership / treasurer): Review the retained fee amounts, annual renewal wording and participation conditions against the current membership portal.

- **Committee, volunteers and arbiters** (Committee / secretary): Confirm the current names, roles and titles restored from WordPress. The source spells Lachlan’s surname Dwyer in Volunteers and Drywer in Arbiters, and uses Srikrishna / Sri Krishna Yendru. These source differences are preserved for review. Supply an approved constitution separately if it should accompany the existing By-Law.

- **Honour boards and titled players** (Committee / tournament organiser): Supply recent winners and verified current player titles, club affiliation, biographies and photographs. No new winners or empty player page have been invented.

- **Sponsors and offers** (Sponsor lead): Confirm the six sponsors are current and supply current websites, package availability and any real member offers, including expiry and redemption details. New offers are not advertised yet.

- **Newsletters and subscriptions** (Newsletter editor / committee): Provide editions, dates and the chosen subscription service before enabling a newsletter archive or Subscribe action. The three published club stories remain available.

- **News categories** (News editor): Add Tournament Reports and Club Announcements archives once sufficient stories have actually been categorised.

- **CMS promotion and domain launch** (Website maintainer): After review, apply the remaining accepted navigation/date changes as targeted Contentful updates, including the optional action-menu, section-anchor and calendar-source fields. Membership, About Us and the policy type are already published shared CMS fixes. The remaining V2 proposal is an overlay on that content; the production WordPress domain is unchanged.

## Review checklist

- [ ] On desktop, open each navigation group using the separate arrow; check that its label also opens the overview page.

- [ ] As a first-time adult visitor, find session times, equipment guidance, the venue and a suitable activity from Play.

- [ ] As a parent, reach programs, term dates, coach information, policies and the enquiry/registration guidance from Juniors.

- [ ] As a member, find Join / Renew and Member Login; check the destinations without completing a purchase.

- [ ] Compare Membership and About Us with WordPress. Check all five fee cards, joining steps, policy links, committee portraits, volunteer names, arbiter titles and the venue map.

- [ ] As a competitor, reach upcoming events, registration, individual pairings/results, broadcasts and PGNs from Tournaments.

- [ ] Filter the calendar, switch between month, agenda and upcoming, reload the page, then use Back/Forward. Check October, November and December coaching dates.

- [ ] On a phone or tablet, open the menu, use the five quick tasks and each group, and close it using the close button or Escape.

- [ ] Check sponsor names/logos, the sponsorship enquiry, privacy document, historical winners and existing news photographs.

## Feedback

Reply to the person who shared the link. Include the page URL, device, expected behaviour and suggested change. Checkboxes on the website do not submit feedback.

Membership, About Us and policy repairs are published shared CMS fixes shown in both rebuilt versions. The remaining navigation/calendar proposals can be promoted after club review. The WordPress production domain is unchanged.
