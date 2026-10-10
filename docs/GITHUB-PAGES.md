# GitHub Pages and Contentful

The frontend repository is [Hobsons-Bay-Chess-Club-AU/website-2027](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027). Contentful stores editable pages, menus, sections and media. GitHub Actions reads published content, builds Astro, checks the output and deploys static files to GitHub Pages.

Contentful does not host the frontend. Import the local migration package into the Contentful space using its Management API. Delivery and Preview keys can only read content.

## Configured

- `.github/workflows/deploy.yml` runs tests and a reference build on main-branch pushes and pull requests.
- The deployment reads the origin and repository path from GitHub Pages, supporting a project URL and a later custom domain.
- CMS links, rich text, assets, fonts, canonical URLs, sitemap and legacy redirects support `/website-2027/`.
- Actions secrets `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN`, and variable `CONTENTFUL_ENVIRONMENT` are configured. Management and Preview tokens stay local.
- Custom-domain builds require published Contentful content. Empty content, missing references and Preview drafts fail the build.
- Manual reference deployments are allowed on GitHub's preview URL and marked `noindex`; custom domains cannot deploy the reference snapshot.

The repository was made public with the owner's explicit approval, because [Pages requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) require a public repository on the organization's Free plan. The reference preview is now [deployed on Pages](https://hobsons-bay-chess-club-au.github.io/website-2027/). Tests, build and deployment [passed on GitHub](https://github.com/Hobsons-Bay-Chess-Club-AU/website-2027/actions/runs/38024039502).

## First preview

Pages uses **GitHub Actions** as its build source. Repository variable `PAGES_ENABLED=true` enables deployments; `CONTENT_SOURCE=reference` selects the saved snapshot until CMS content is ready. Main-branch pushes update the preview. **Run workflow** can also select the source explicitly.

CLI setup already applied:

```powershell
gh api --method POST repos/Hobsons-Bay-Chess-Club-AU/website-2027/pages -f build_type=workflow
gh variable set PAGES_ENABLED --body true --repo Hobsons-Bay-Chess-Club-AU/website-2027
gh variable set CONTENT_SOURCE --body reference --repo Hobsons-Bay-Chess-Club-AU/website-2027
gh workflow run deploy.yml --ref main -f content_source=reference --repo Hobsons-Bay-Chess-Club-AU/website-2027
```

The Pages preview has been deployed. No production domain or DNS cutover was performed. A successful validation job alone does not imply deployment; the build and deploy jobs must also succeed.

## Contentful and updates

Add `CONTENTFUL_MANAGEMENT_TOKEN` to local `.env`, then import drafts:

```powershell
npm run contentful:import -- --apply
npm run contentful:verify
npm run cms:preview
```

Review the content, publish linked entries/assets and verify `npm run contentful:verify -- --published`. Run the deployment with `content_source=contentful`, then switch the repository default to `contentful`. Main-branch pushes will subsequently deploy published CMS content.

Switch the source and enable hourly rebuilds after the published graph works:

```powershell
gh variable set CONTENT_SOURCE --body contentful --repo Hobsons-Bay-Chess-Club-AU/website-2027
gh variable set CONTENTFUL_REBUILD_ENABLED --body true --repo Hobsons-Bay-Chess-Club-AU/website-2027
```

The schedule requests a rebuild at minute 17 of each UTC hour; GitHub may delay runs. For immediate updates, use **Run workflow** with `contentful`. An optional `repository_dispatch` event `contentful-published` supports a future authenticated publish/unpublish webhook bridge. That bridge is not connected, and no GitHub credential was added to Contentful.

Tournament standings and upcoming cards also refresh directly from the existing service when visitors open the homepage.

## Checks and future domain

```powershell
$env:SITE_URL='https://hobsons-bay-chess-club-au.github.io'
$env:SITE_BASE_PATH='/website-2027/'
$env:CONTENT_SOURCE='reference'
npm run build:pages
npm run verify
```

Clear those shell variables before normal local development. The project-path build passes 13 tests and 1,326 links/assets across 22 content pages and four redirects. Browser checks confirm loaded images/fonts, membership navigation and the blog redirect. Evidence is in `docs/github-pages-verification.json`.

After the Contentful version is accepted, configure `hobsonsbaychess.com` in Pages and plan its DNS/certificate cutover. Pages metadata will supply the custom origin and root path to subsequent builds. Published Contentful content is required.

GitHub Pages serves static files. Legacy aliases use HTML refresh redirects with canonical destinations, rather than HTTP 301 responses. Vercel/Netlify header and redirect files do not control Pages. Contact uses email; registration/calendar remain on the existing services.

See [Astro's Pages guide](https://docs.astro.build/en/guides/deploy/github/) and [the CMS guide](CMS-GUIDE.md).
