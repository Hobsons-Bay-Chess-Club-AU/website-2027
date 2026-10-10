# GitHub Pages and Contentful

Contentful holds editable content. GitHub Actions reads the published Delivery API, builds Astro, verifies links/assets and deploys to [the GitHub Pages site](https://hobsons-bay-chess-club-au.github.io/website-2027/). The frontend is hosted by GitHub, not Contentful.

## Current configuration

[Hobsons-Bay-Chess-Club-AU/website-2027](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027) is public, with the owner's authorization. Pages uses GitHub Actions.

| Repository setting | Value |
| --- | --- |
| `PAGES_ENABLED` | `true` |
| `CONTENT_SOURCE` | `contentful` |
| `CONTENTFUL_ENVIRONMENT` | `master` |
| `CONTENTFUL_REBUILD_ENABLED` | `true` |
| `FACEBOOK_SCRAPE_ENABLED` | `false` |

Build secrets `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN` are configured. Management and Preview tokens stay local. The initial reference preview was replaced as the default source after the actual CMS graph was imported and published. The published-content [deployment passed](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027/actions/runs/38031214457); [GITHUB-RELEASE-VERIFICATION.json](GITHUB-RELEASE-VERIFICATION.json) records live news, photos, calendar/download and browser checks.

## Publish an editorial change

1. Save and publish the changed Contentful entry, its linked entries and media.
2. Allow the hourly rebuild, or open **Actions ` Build and deploy HBCC ` Run workflow** and select `contentful`.
3. Confirm validation, build **and deploy** succeed before checking the live site. A failed build preserves the previous deployment.

Main pushes also deploy. Pull requests validate tests/reference output without deploying. The scheduled rebuild runs at minute 17 each UTC hour, subject to GitHub scheduling delays. Tournament results and upcoming cards refresh directly from their service when visitors open the homepage.

An optional `repository_dispatch` event `contentful-published` supports a future authenticated publish/unpublish webhook bridge. No bridge is connected and no GitHub credential was added to Contentful.

## Local project-path check

```powershell
$env:SITE_URL='https://hobsons-bay-chess-club-au.github.io'
$env:SITE_BASE_PATH='/website-2027/'
$env:CONTENT_SOURCE='contentful'
npm run build:pages
npm run verify
```

Use a fresh shell for ordinary local development, or clear these variables. CMS links, rich text, images, fonts, scripts, calendar downloads, canonical URLs, sitemap and nine legacy redirects support the repository prefix. Twenty-one tests pass; [github-pages-verification.json](github-pages-verification.json) records the latest project-path output check.

Reference-only deployments are available for recovery/review on a GitHub preview URL and are marked noindex. Custom-domain builds require published Contentful content; empty/incomplete content and Preview drafts fail the build.

## Facebook draft workflow

`.github/workflows/facebook-news.yml` contains manual and six-hourly draft imports, guarded by `FACEBOOK_SCRAPE_ENABLED`. It is disabled because the public page currently contains no dated post feed. Enabling a schedule cannot remove this Facebook limitation.

If a usable public feed becomes available, configure a club-controlled `CONTENTFUL_NEWS_MANAGEMENT_TOKEN` secret before enabling the workflow. Never add Facebook browser cookies or the Preview token. The importer creates drafts only, and manual article edits are protected. [EDITORIAL-UPDATE.md](EDITORIAL-UPDATE.md) describes the working browser-capture path.

## Future domain move

The production domain remains on WordPress. Once the club accepts the release, configure `hobsonsbaychess.com` in Pages and plan DNS, certificates and rollback while preserving email and tournament subdomains. Pages metadata supplies the origin and root path; published Contentful remains required.

GitHub Pages serves static files. Legacy aliases are HTML refresh redirects with canonical destinations, not HTTP 301 responses. Contact uses email. Tournament registration and the tournament site's own calendar remain on that service; the main website's calendar is a native component backed by Contentful.

See [Astro's Pages guide](https://docs.astro.build/en/guides/deploy/github/) and [the CMS guide](CMS-GUIDE.md).
