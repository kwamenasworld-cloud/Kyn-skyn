# Local theme preview

How to test Shopify theme changes locally before they hit live kynskyn.com.

## TL;DR

```powershell
# One-time auth (browser opens, log in to kynskyn admin):
shopify auth login --store=kynskyn.myshopify.com

# Daily use, from repo root:
.\scripts\dev-preview.ps1
```

Open http://127.0.0.1:9292 in your browser. Edit any `.liquid`, `.json`, or asset file and the page hot-reloads.

## What's running

`shopify theme dev` boots a local Node server that:
- Reads theme files from your current working tree (whatever branch you're on)
- Proxies your store's live catalog (products, customers, settings) through Shopify's CDN
- Watches the filesystem and hot-reloads the browser on any change

You get a real Shopify rendering of your theme with real products, but pulling theme code from your local files. No deploy required.

## Branch model

- **`master`** — auto-deploys to live kynskyn.com on push. Never edit here directly.
- **`test`** — long-lived testing branch. The dev-preview script auto-switches you here.
- **Feature branches** — optional. Branch from `test`, merge into `test` for preview, then `test` -> `master` to ship live.

The dev server picks up whatever's in the working tree, so the branch you've checked out IS what you're previewing.

## Promoting test -> master (going live)

```powershell
git checkout master
git pull
git merge test
git push origin master
```

Shopify auto-deploys from master push.

## Things to know

- **Customer data is real.** The preview hits your real store catalog. Don't place test orders unless you mean it.
- **Sessions and cart state** in the preview are tied to your logged-in admin session.
- **Asset URLs** work transparently. `{{ "filename" | asset_url }}` resolves locally during dev.
- **Schema settings** (section settings, theme settings) come from the live theme's published settings_data.json. If you change a section's schema, edits in the dev preview admin panel won't persist until you push.
- **Hot reload** doesn't catch every change. If something isn't showing, hard-refresh (Ctrl+Shift+R).

## Auth troubleshooting

If `shopify auth login` opens a stale session or you get permission errors:
```powershell
shopify auth logout
shopify auth login --store=kynskyn.myshopify.com
```

You need to be an admin (or staff with theme-edit permission) on the kynskyn.myshopify.com store.
