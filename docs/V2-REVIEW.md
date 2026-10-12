# V2 team review

Review website: https://hobsons-bay-chess-club-au.github.io/website-2027/v2/

Changes, before/after links, club decisions and visitor checklist: https://hobsons-bay-chess-club-au.github.io/website-2027/v2/review/

Downloadable change list: https://hobsons-bay-chess-club-au.github.io/website-2027/v2/review-notes.md

Current rebuilt version: https://hobsons-bay-chess-club-au.github.io/website-2027/

The proposal implements the core navigation and visitor-journey work in [the navigation audit plan](NAVIGATION-CHANGE-PLAN.md). It includes six navigation groups, desktop dropdowns, mobile quick tasks, First Visit and Coaching, a tournament hub, repaired action links, shareable calendar state and an upcoming agenda, Term 4 corrections, named sponsor profiles, privacy destinations and inherited-content cleanup. The team review page is the complete change list. Its checklist does not submit or persist responses; reviewers reply to the person who shared the link.

## Isolation and content

The current version reads published Contentful entries without the proposal. V2 reads published Contentful entries and applies the explicitly versioned proposal in `src/lib/review-content.mjs` to a deep copy before normalization. That overlay performs no management API writes. Both versions now share the targeted Membership/About layout repairs and native policy model published in Contentful; they retain separate menus, additional pages and reviewed calendar dates.

V2 has three additional pages: Coaching, Privacy & Photography and the team review. It also has its own calendar download. Internal links, redirects, fonts and build assets are scoped to `/website-2027/v2/`. The comparison links explicitly return to the current version. Existing tournament, registration, games, membership and login services retain their external destinations.

Review pages are marked `noindex, nofollow`. This is a public review URL, not an authenticated preview. The WordPress production domain is unchanged. The shared Membership/About/policy repairs are published CMS changes; the remaining navigation/calendar proposal stays isolated.

The reviewed dates follow the publicly available term and junior championship listings checked on 12 October 2026. The original imported date text remains on each corrected entry. The team page highlights the dates and the club sign-off still required. It also records the coaching roster discrepancy, membership and sponsor checks, missing honour-board records, unresolved imported dates, newsletter editions and the subscription provider.

## Builds and local review

`npm run build:pages` builds and verifies the current version first, then builds V2 into `dist/v2/` and verifies it separately. GitHub Actions uploads the combined `dist/` artifact. Both versions are rebuilt for pushes, published-content dispatches and the existing hourly schedule. The two versions have separate Astro build processes so URL prefixing and rich-text rendering use the correct base path.

For a local fixture build on PowerShell:

```powershell
$env:CONTENT_SOURCE = 'reference'
$env:SITE_URL = 'https://hobsons-bay-chess-club-au.github.io'
$env:SITE_BASE_PATH = '/website-2027/'
npm run build:pages
npm exec -- astro preview --host 127.0.0.1 --port 4331
```

Open `http://127.0.0.1:4331/website-2027/v2/`. Set `CONTENT_SOURCE=contentful` to use the published CMS with the existing ignored local credentials. Do not use Contentful Preview or Management credentials in a deployed build.

`npm run build:review` builds only the review into `dist/v2/`, taking the **current version's** base path as input and appending `/v2/`. A current-version build must exist first for the comparison link verification. Direct `npm run build` and `npm run build:production` retain the current-version behavior.

## Validation

The meaningful new tests check proposal isolation, repaired link destinations, page references plus fragments, unique anchors, reuse of the published coach source, program-specific calendar corrections, safe URL state and an agenda spanning future months. Existing CMS, calendar, news, standings and deployment tests remain in place.

The build verifier scans each version independently for missing local paths/assets and section fragments, WordPress asset dependencies and leaked server credentials. It also checks search-exclusion metadata. The deliberate current-version comparison links are checked against the parent build; other internal links must remain within the variant's base path.

## After the team review

Apply accepted content changes as targeted, version-checked Contentful updates, preserving editorial changes and original import metadata. Add the optional native model fields described in the navigation plan: header/quick-action menus, section/card anchors, page-link fragments, annual PDF/revision, and calendar verification/closure fields. Configure the enhanced header and calendar from those CMS fields and remove the proposal overlay when it is promoted. Do not re-run the complete migration import over edited entries.

Roster, fees, sponsor offers, new winners, titled players and newsletter subscriptions require the club material listed on the review page. They are intentionally recorded as pending content decisions rather than presented as completed functionality. Domain cutover can follow a separate accepted release.
