import { chromium } from 'playwright-core';
import { join } from 'node:path';

const out = join('D:/Akram_OS/apps/desktop/src-tauri', 'icon-source.png');

const svg = `
<svg viewBox="0 0 40 40" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3B82F6"/><stop offset="0.5" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="40" height="40" rx="9" fill="url(#g)"/>
  <path d="M20 8.5 L29.5 26 L24.6 26 L20 16.8 L15.4 26 L10.5 26 Z" fill="#fff"/>
  <path d="M20 19 L27 31.5 L23 31.5 L20 25.6 L17 31.5 L13 31.5 Z" fill="#fff" fill-opacity="0.78"/>
</svg>`;

const html = `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:1024px;height:1024px">${svg}</div></body></html>`;

let browser;
for (const channel of ['msedge', 'chrome']) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(html);
await page.waitForTimeout(200);
await page.locator('div').screenshot({ path: out, omitBackground: true });
await browser.close();
console.log('wrote', out);
