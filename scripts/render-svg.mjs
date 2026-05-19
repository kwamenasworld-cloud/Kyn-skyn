#!/usr/bin/env node
// render-svg.mjs <in.svg> [out.png]
// Renders an SVG to PNG using headless Chrome via puppeteer.
// Viewport is taken from the SVG's viewBox. 2x deviceScaleFactor for crisp text.

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const [, , svgPath, outPathArg] = process.argv;
if (!svgPath) {
  console.error('usage: render-svg.mjs <in.svg> [out.png]');
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, 'utf8');
const vbMatch = svg.match(/viewBox\s*=\s*["']([-\d.\s]+)["']/);
let w = 800;
let h = 600;
if (vbMatch) {
  const parts = vbMatch[1].trim().split(/\s+/).map(Number);
  if (parts.length === 4) {
    w = Math.ceil(parts[2]);
    h = Math.ceil(parts[3]);
  }
}

const absSvg = path.resolve(svgPath);
const outPath = outPathArg ? path.resolve(outPathArg) : absSvg.replace(/\.svg$/i, '.png');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:transparent}
  svg{display:block}
</style></head><body>${svg}</body></html>`;

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outPath, omitBackground: false, type: 'png' });
} finally {
  await browser.close();
}
console.log('wrote', outPath);
