# News and calendar update ` 10 October 2026

The authorized Contentful import is complete. Fifteen native types/editor interfaces, 447 entries and 99 assets are present in the actual account; 439 entries and all 99 assets are published.

## Published club news

| Date in Melbourne | Article | Club source |
| --- | --- | --- |
| 2 October 2026 | Venue ready for the Victorian Junior Rapid and Blitz Championship | [Venue announcement/photos](https://www.facebook.com/hobsonsbaychess/posts/pfbid02cRywzg9S7LtjKg2DaLjNdn3EmzvU2iiuwvtivGvjNGavqqWj3BFXxHN1ZEdc16w4l) |
| 22 September 2026 | Record turnout for women's chess in Altona | [Club announcement](https://www.facebook.com/hobsonsbaychess/posts/pfbid0wDgYXMRvenHTuWGyBgqyqKrXWnhKh78BJEnpzx5pzAfusiSb8rhz4nhknQuRTugql), [original Star Weekly report](https://maribyrnonghobsonsbay.starweekly.com.au/news/chess-championed/) |
| 20 September 2026 | Victorian Women's Championship awards and photo gallery | [Club awards album](https://www.facebook.com/hobsonsbaychess/posts/pfbid0KKvHW6fz55ebyitpiJMUhct1L5c9bMALocHXeDQUQrBZCZfgzHr397it5kyJrkkDl) |

Articles use short attributed summaries and original club photographs, preserving credits/watermarks. The linked newspaper's full article and paid photograph were not republished. Source dates, links and image references are in `reference/facebook/selected-news.json`. Captured originals are in `reference/facebook/media/`, with optimized fixture images in `public/news-assets/`; production reads the uploaded Contentful media.

The homepage and Tournaments page now select real club articles. The five old football demos remain disabled drafts and their old routes redirect to News. The three curated articles are under manual editorial control, with **Allow Facebook updates** off.

## Facebook sync behavior and limitation

Future imports are **drafts for review**, as requested. The importer deduplicates by source ID/permalink, skips unchanged posts and protects editor-modified articles. It never publishes imported articles or media.

The signed-in browser exposed the club's dated posts for the initial capture. A direct anonymous public-page request returned a profile without dated posts. `npm run news:scrape` therefore reports that limitation and exits without changing news. A schedule cannot currently retrieve a reliable feed; `FACEBOOK_SCRAPE_ENABLED=false` keeps the prepared GitHub workflow disabled. No Meta developer token or Facebook login cookies were uploaded.

A normalized browser capture can still be imported:

```powershell
npm run news:scrape -- --file=reference/facebook/captured-posts.json
npm run news:scrape -- --file=reference/facebook/captured-posts.json --apply
```

The capture format has a `posts` array with `id`, `message`, `created_time` (ISO timestamp), `permalink_url` and optional project-relative `imagePath` or public Facebook-CDN `imageUrl`. These are observed club posts, not profile text/comments. The existing capture contains the three curated posts; applying it skips them as editor-controlled.

If the public feed becomes usable, configure a club-controlled Management secret and enable the draft workflow. Until then, source new posts through the browser or create News articles directly in Contentful.

## Spreadsheet calendar

Source: the original Calendar page's [published Schedule 2026.xlsx sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vRIr-eFPQCMvn-TbOfLNzHheAVduNUKX2wOTsYjJOM8zf_uhqe3B3H8Z01bofnCPg/pubhtml`widget=true&headers=false).

The CSV has 119 rows. The parser uses MM/DD/YYYY for single dates and DD/MM/YYYY for explicit ranges, validating weekdays and years. It creates separate senior/junior/coaching events, merges duplicate shared events, and retains source rows, date text, school schedule, event type and arbiter. No session times were supplied or invented.

There are 153 event entries: **150 published** and **three hidden drafts**. The Calendar page now offers month/agenda views, category filtering, month navigation and an iCalendar download. Multi-day events include both endpoint dates; the download correctly uses an exclusive end date. Mobile starts in agenda view.

| Sheet row | Original date / weekday | Why it needs club confirmation |
| --- | --- | --- |
| 56 | `5/8/2026- 8/06/2026`, Fri`Mon | Parsed range ends before it starts; weekdays also disagree |
| 63 | `27/6/2026-30/6/2026`, Thurs`Sunday | The written dates are Saturday`Tuesday |
| 83 | `29/8/2025- 30/8/2025`, Sat`Sun; Best in the West 2026 | Written year is 2025 and weekdays disagree with those dates |

These events retain their original source text, have **Date needs confirmation** enabled and are absent from the published calendar's references. Confirm dates, correct them, turn off review, choose Show, add the event reference and publish.

The tournament application remains the source of scores, upcoming tournament listings and registration, and retains its own calendar. The main website's club schedule is now independently editable through Contentful.

## Verification and launch status

The actual published API graph verifies without missing seed entries. All 21 tests pass. The strict root build generates 20 content pages and nine legacy redirects, with 958 local links/assets checked. Desktop calendar filtering/navigation/agenda and a 390 px mobile agenda were exercised against published Contentful content. [CMS-LIVE-VERIFICATION.json](CMS-LIVE-VERIFICATION.json) records account counts and exclusions.

GitHub is configured to build from Contentful with hourly CMS rebuilds. The production domain remains on WordPress. Club review of historical fees, counts, policies and the three calendar conflicts remains part of domain-launch acceptance.
