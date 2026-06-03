# Local theme preview

How to test Shopify theme changes locally before they hit live kynskyn.com.

## TL;DR

```powershell
# From repo root (first run opens a browser for OAuth, subsequent runs go straight to localhost):
.\scripts\dev-preview.ps1
```

Open http://127.0.0.1:9292 in your browser. Edit any `.liquid`, `.json`, or asset file and the page hot-reloads.

There is no separate `shopify auth login` step in CLI 3.x — `shopify theme dev` handles authentication on its first run.

## What's running

`shopify theme dev` boots a local Node server that:
- Reads theme files from your current working tree (whatever branch you're on)
- Proxies your store's live catalog (products, customers, settings) through Shopify's CDN
- Watches the filesystem and hot-reloads the browser on any change

You get a real Shopify rendering of your theme with real products, but pulling theme code from your local files. No deploy required.

## Branch model

- **`master`** is the only branch. It auto-deploys to live kynskyn.com on every push. The old `test` branch was retired 2026-06-01 (the streamlined flow it held was merged into `master`), and `dev-preview.ps1` no longer switches or creates branches.
- The dev server picks up whatever's in your working tree, **including uncommitted edits** — so what you have checked out IS what you're previewing.
- Optional: branch off `master` for a larger change, preview locally, then merge back to `master` to ship.

## Going live

```powershell
git add -A
git commit -m "..."
git push origin master
```

Shopify auto-deploys from the `master` push. There is no staging theme.

## Things to know

- **Customer data is real.** The preview hits your real store catalog. Don't place test orders unless you mean it.
- **Sessions and cart state** in the preview are tied to your logged-in admin session.
- **Asset URLs** work transparently. `{{ "filename" | asset_url }}` resolves locally during dev.
- **Schema settings** (section settings, theme settings) come from the live theme's published settings_data.json. If you change a section's schema, edits in the dev preview admin panel won't persist until you push.
- **Hot reload** doesn't catch every change. If something isn't showing, hard-refresh (Ctrl+Shift+R).

## Auth troubleshooting

If the cached session goes stale or you get permission errors:
```powershell
shopify auth logout
.\scripts\dev-preview.ps1
```

Logging out clears the cached token; the next run of the script re-triggers the browser OAuth flow.

You need to be an admin (or staff with theme-edit permission) on the 1mehi7-fb.myshopify.com store.
