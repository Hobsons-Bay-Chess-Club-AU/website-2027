# HBCC Astro on Vercel

The approved V2 website runs at **https://hbcc-website-2027.vercel.app/**. Astro remains the frontend. It now renders on the server with Vercel ISR, rather than requiring a Next.js rewrite. The existing GitHub Pages current/V2 comparison remains available. WordPress still serves `hobsonsbaychess.com`; no DNS change has been made.

## Rendering and Contentful usage

- Published pages are cached by Vercel ISR for **one hour**. A stale page can be served while Vercel regenerates it.
- Server renders share a **one-hour published Contentful snapshot** in Vercel Runtime Cache, instead of fetching Contentful separately for every page or visitor. The current snapshot is about 890 KB, below Vercel's 2 MB item limit. At the current content count, loading it needs one Delivery API request; larger spaces are paginated.
- The Contentful webhook clears that snapshot, waits for the published revision to reach the Delivery API, then revalidates all known page URLs. Global navigation and shared sections therefore refresh together. Prior paths are retained for a day so renamed/deleted pages can also be refreshed after a retry.
- Draft previews use the Preview API separately and are **private, uncached and excluded from search indexing**. They never write to the published snapshot. An editor session lasts two hours.
- Tournament standings/upcoming integrations continue to use the existing tournament service and its own cache. The calendar's month/category URL filters are applied in the browser because ISR strips query parameters.

This is SSR on cache misses and for editor previews, with ISR for ordinary visitors. It avoids a Contentful API call on every public request.

## Edit the approved website

Open [V2 Website settings](https://app.contentful.com/spaces/7r7s5slcmer0/entries/v2-hbcc-site-settings). Follow its linked homepage, main menu, header membership actions, header quick tasks and footer menus. These are now native Contentful records, not a runtime proposal overlay.

The space has **17 content types, 887 entries (879 published, eight existing drafts), and 100 assets**. The original 642 entries were preserved. V2 uses 245 additional records where separate pages, navigation or proposed content are needed; unchanged reusable content can remain shared.

For existing pages, use the version marked **Website version: v2**. Imported V2 entry IDs start with `v2-`. V2 page slugs also use a `v2-` namespace in Contentful to preserve its global uniqueness rule: `v2-membership` serves `/membership/`. When creating a page, choose Website version `v2`, use a unique `v2-…` slug, select the template and link its sections. Menu references follow slug changes. News article slugs keep their normal, unprefixed form.

Publish linked entries and media before publishing a page that references them. Missing published references fail safely rather than displaying an incomplete page. Publish normally; Vercel updates through the webhook without a code deployment. GitHub Pages remains a static copy and uses its existing hourly rebuild/manual workflow.

## Preview saved drafts

1. Save the entry in Contentful without publishing it.
2. Open **Preview → HBCC Vercel — saved drafts** on a Website page or News article.
3. On first use, enter the HBCC preview access code. Its value is the local `.env` variable **`CONTENTFUL_PREVIEW_SECRET`**; distribute it privately to editors. It is a separate access code, not the Contentful API token.
4. The website shows a **Draft preview** banner. Save further changes in Contentful, then choose **Refresh saved changes**. This previews saved content; it does not stream unsaved keystrokes.
5. Choose **Exit preview** to return to the public version and clear both cookies.

Editors can also open `/editor/login/?next=/membership/` directly. Linked menu/section changes can be previewed through the relevant page. Unlinked entries have no website location. The preview URL contains only the entry ID and environment, never an API key or access code.

## Webhook and credentials

**HBCC Vercel published-content ISR** is active in Contentful's `master` environment. It posts to `/api/revalidate/` for Entry/Asset publish, unpublish and delete. A secret header authenticates the request, and the endpoint validates the space, environment and event type. Failed deliveries return an error for Contentful retry; view delivery results under Settings → Webhooks → Activity log.

Vercel holds server-only Delivery/Preview credentials, `ISR_REVALIDATE_TOKEN`, `CONTENTFUL_WEBHOOK_SECRET` and `CONTENTFUL_PREVIEW_SECRET`. The Contentful Management token and Vercel deployment token are excluded from the frontend runtime. `.env`, private exports, reference downloads and the navigation Word document are excluded from Vercel source uploads.

`npm run contentful:webhook` repairs this named webhook using the local Management token. `npm run contentful:promote-v2` is a one-time/resumable promotion and preserves the native V2 graph once published; it is not a routine editing command.

## Code releases

Pushes to `main` run tests and verify both static versions, then deploy the Astro source to Vercel using **GitHub Actions**. The private repository secret is `VERCEL_API_KEY`; repository variables hold the project/team IDs and `VERCEL_ENABLED=true`. Contentful events refresh ISR directly and do not trigger a new Vercel code deployment. The hourly Pages workflow does not redeploy Vercel.

Local fallback:

```powershell
npm run dev:server                  # http://127.0.0.1:4332/
npm run build:vercel
npm run deploy:vercel -- --dry       # Check upload contents without deploying
npm run deploy:vercel
node scripts/verify-server-live.mjs  # Read-only/public and preview security checks
```

The verification script's optional `--cms-probe` creates and removes its own private draft, exercises a harmless metadata publish, then restores the original content. It refuses to overwrite pending or concurrent editorial changes. See [live verification](VERCEL-VERIFICATION.json).

The temporary Vercel domain is currently `noindex`. For a future club-domain launch, add the approved domain in Vercel, update `SITE_URL`/the webhook/preview URLs, set `SITE_STAGING=false`, deploy and verify before changing DNS. Do not remove the WordPress backup/reference files as part of that cutover.

References: [Astro Vercel ISR](https://docs.astro.build/en/guides/integrations-guide/vercel/), [Vercel Runtime Cache](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#getcache), [Contentful preview](https://www.contentful.com/developers/docs/tutorials/preview/content-preview/), [Contentful webhooks](https://www.contentful.com/developers/docs/extensibility/webhooks/configure-webhook/).
