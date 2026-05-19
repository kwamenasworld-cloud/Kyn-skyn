import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1800, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000/output/annotated-render.html', { waitUntil: 'networkidle0', timeout: 15000 });
// Wait for font to load
await page.waitForFunction(() => document.fonts.ready, { timeout: 8000 });
await new Promise(r => setTimeout(r, 1500));
// Screenshot only the .wrap element
const el = await page.$('.wrap');
if (el) {
  await el.screenshot({ path: 'output/kyn-skyn-annotated.png', type: 'png' });
  console.log('Saved: output/kyn-skyn-annotated.png');
} else {
  console.error('Could not find .wrap element');
}
await browser.close();
