# Kyn Skyn Agent Context

## Repository layout

- `C:\GitHub\Kyn-skyn` is the parent Shopify/marketing repository.
- `C:\GitHub\Kyn-skyn\telehealth` is a separate nested git repository for the Next.js telehealth app.
- Treat the telehealth app as its own git repo. Check `git status` inside `telehealth/` before reviewing or changing telehealth code.
- Do not assume parent-repo `git status` accurately describes telehealth source state.

## Verified local CLIs

The following CLIs were verified on this Windows machine on 2026-05-17:

- `git`
- `rg`
- `node`
- `npm`
- `npx`
- `python`
- `py`
- `yarn`
- `supabase`
- `shopify`
- `stripe`
- `railway`

Useful verified versions/paths:

- `stripe`: `C:\Users\admin\scoop\shims\stripe.exe`, version `1.40.8`
- `supabase`: `C:\Users\admin\scoop\shims\supabase.exe`, version `2.53.6`
- `shopify`: `C:\Users\admin\AppData\Roaming\npm\shopify.ps1`, version `3.94.2`
- `railway`: `C:\Users\admin\AppData\Roaming\npm\railway.ps1`, version `4.36.1`

If a task depends on a CLI, re-check with `Get-Command <name>` before using it.
