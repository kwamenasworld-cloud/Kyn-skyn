#!/usr/bin/env node
// Reads FAQs from Supabase and rewrites the FAQ section of consultation.liquid
// and ingredient-checker.liquid between the <!-- FAQ:START --> and <!-- FAQ:END -->
// markers. Run from the repo root. SUPABASE_ANON_KEY env var required.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pbriwsgraemyqhkymneq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_KEY) {
  console.error('SUPABASE_ANON_KEY environment variable is required.');
  process.exit(1);
}

const PAGES = [
  {
    name: 'consultation',
    file: 'sections/consultation.liquid',
    render(rows) {
      return rows.map(row => {
        const dataAttr = row.dynamic_pricing ? ' data-price="faq_pricing"' : '';
        return [
          '    <div class="th-faq__item fade-in">',
          `      <button class="th-faq__q" type="button">${escapeHtml(row.question)}</button>`,
          `      <div class="th-faq__a"${dataAttr}>${row.answer}</div>`,
          '    </div>',
        ].join('\n');
      }).join('\n\n');
    },
    indentAfter: '    ',
  },
  {
    name: 'ingredient_checker',
    file: 'sections/ingredient-checker.liquid',
    render(rows) {
      return rows.map(row => {
        return [
          '      <div class="faq__item">',
          `        <button class="faq__question" type="button">${escapeHtml(row.question)}</button>`,
          '        <div class="faq__answer">',
          `          ${row.answer}`,
          '        </div>',
          '      </div>',
        ].join('\n');
      }).join('\n\n');
    },
    indentAfter: '      ',
  },
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPage(name) {
  const url = `${SUPABASE_URL}/rest/v1/faqs?page=eq.${name}&is_active=eq.true&order=position.asc&select=question,answer,dynamic_pricing`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${name} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const START = '<!-- FAQ:START -->';
const END = '<!-- FAQ:END -->';

async function main() {
  let touched = 0;
  for (const page of PAGES) {
    const rows = await fetchPage(page.name);
    if (rows.length === 0) {
      console.log(`No active FAQs for ${page.name} — skipping`);
      continue;
    }

    const filePath = resolve(repoRoot, page.file);
    const original = readFileSync(filePath, 'utf8');

    const start = original.indexOf(START);
    const end = original.indexOf(END);
    if (start < 0 || end < 0) {
      throw new Error(`Markers <!-- FAQ:START --> / <!-- FAQ:END --> not found in ${page.file}`);
    }

    const before = original.slice(0, start + START.length);
    const after = original.slice(end);
    const block = `\n${page.render(rows)}\n${page.indentAfter}`;
    const updated = before + block + after;

    if (updated !== original) {
      writeFileSync(filePath, updated, 'utf8');
      console.log(`Rewrote ${page.file} (${rows.length} FAQs)`);
      touched++;
    } else {
      console.log(`${page.file} already up to date`);
    }
  }
  if (!touched) console.log('No files changed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
