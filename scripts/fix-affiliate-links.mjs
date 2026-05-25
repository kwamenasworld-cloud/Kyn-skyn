#!/usr/bin/env node
// Backfills the ?via=<token> param onto AffiliateBase per-affiliate links.
//
// AffiliateBase creates affiliate Links with a `url` field that holds the
// campaign destination, and a separate `token`. The affiliate-facing portal's
// "Copy link" button copies `url` verbatim, so without ?via=<token> embedded
// the click can't be attributed back to the affiliate. We bake the token into
// the url field, sending {url, token} together so AB doesn't rotate the token
// on update.
//
// Idempotent: skips links that already contain ?via=<token>.
// Required env: AFFILIATEBASE_API_KEY.

const API_KEY = process.env.AFFILIATEBASE_API_KEY;
if (!API_KEY) {
  console.error('AFFILIATEBASE_API_KEY environment variable is required.');
  process.exit(1);
}

const ACCOUNT_ID = 'd970299a-5388-4756-8a6d-fc33c4d99ffa';
const BASE = 'https://app.affiliatebase.io/api/v1';

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

async function api(path, init = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}account_id=${ACCOUNT_ID}`;
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

function buildShareUrl(campaignUrl, token) {
  const u = new URL(campaignUrl);
  u.searchParams.set('via', token);
  return u.toString();
}

const campaigns = (await api('/campaigns')).data || [];
const links = (await api('/links')).data || [];
const campaignById = new Map(campaigns.map(c => [c.id, c]));

let fixed = 0;
let skipped = 0;
let errors = 0;

for (const link of links) {
  const campaign = campaignById.get(link.campaign_id);
  if (!campaign || !campaign.url) {
    console.warn(`link ${link.id}: campaign ${link.campaign_id} missing or has no url, skipping`);
    skipped++;
    continue;
  }

  const expected = buildShareUrl(campaign.url, link.token);
  if (link.url === expected) {
    skipped++;
    continue;
  }

  try {
    const updated = await api(`/links/${link.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ url: expected, token: link.token }),
    });
    if (updated.token !== link.token) {
      console.warn(`link ${link.id}: token rotated (${link.token} -> ${updated.token}); url now ${updated.url}`);
    } else {
      console.log(`link ${link.id}: ${link.url || '(empty)'} -> ${updated.url}`);
    }
    fixed++;
  } catch (err) {
    console.error(`link ${link.id}: ${err.message}`);
    errors++;
  }
}

console.log(`done: ${fixed} fixed, ${skipped} already correct, ${errors} errors`);
if (errors > 0) process.exit(1);
