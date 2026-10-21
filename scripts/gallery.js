/**
 * Generates the Fiverr gallery images in ./gallery:
 *   01-report.png  - the HTML report from a fresh test run
 *   02-app.png     - the TodoMVC demo with a few todos added
 *   03-summary.png - the terminal summary of that same run
 *
 * Usage: node scripts/gallery.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'gallery');
const viewport = { width: 1280, height: 800 };

function runSuite() {
  let output;
  try {
    output = execSync('npx playwright test', { cwd: root, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
  } catch (err) {
    console.error(err.stdout || err.message);
    throw new Error('Test run failed; not generating gallery images from a red run.');
  }
  return output.replace(/\x1b\[[0-9;]*m/g, '').trim();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function terminalHtml(output) {
  const lines = output.split(/\r?\n/).map((line) => {
    const html = escapeHtml(line);
    if (/^\s*✓/.test(line)) return `<span class="ok">${html}</span>`;
    if (/\d+ passed/.test(line)) return `<span class="summary">${html}</span>`;
    return html;
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
           background: linear-gradient(135deg, #1e293b, #0f172a); font-family: 'Cascadia Code', Consolas, monospace; }
    .window { width: 1180px; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); background: #0b1020; }
    .bar { height: 34px; background: #1f2937; display: flex; align-items: center; gap: 8px; padding: 0 14px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .title { color: #9ca3af; font-size: 13px; margin-left: 12px; }
    pre { margin: 0; padding: 18px 22px; color: #d1d5db; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
    .prompt { color: #60a5fa; } .ok { color: #4ade80; } .summary { color: #4ade80; font-weight: bold; font-size: 16px; }
  </style></head><body><div class="window">
    <div class="bar"><span class="dot" style="background:#ef4444"></span><span class="dot" style="background:#f59e0b"></span>
      <span class="dot" style="background:#22c55e"></span><span class="title">playwright-portfolio — terminal</span></div>
    <pre><span class="prompt">$</span> npx playwright test\n\n${lines.join('\n')}</pre>
  </div></body></html>`;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const output = runSuite();
  fs.writeFileSync(path.join(outDir, '03-summary.txt'), output + '\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });

  // 01 - HTML report
  await page.goto(pathToFileURL(path.join(root, 'playwright-report', 'index.html')).href);
  await page.getByText('Passed').first().waitFor();
  await page.screenshot({ path: path.join(outDir, '01-report.png') });

  // 02 - the app under test with a few todos
  await page.goto('https://demo.playwright.dev/todomvc/');
  const input = page.getByPlaceholder('What needs to be done?');
  for (const text of ['Write Playwright tests', 'Set up CI pipeline', 'Share the HTML report']) {
    await input.fill(text);
    await input.press('Enter');
  }
  await page.getByTestId('todo-item').filter({ hasText: 'Write Playwright tests' }).getByRole('checkbox').check();
  await page.screenshot({ path: path.join(outDir, '02-app.png') });

  // 03 - terminal summary
  await page.setContent(terminalHtml(output));
  await page.screenshot({ path: path.join(outDir, '03-summary.png') });

  await browser.close();
  console.log(`Gallery images written to ${outDir}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
