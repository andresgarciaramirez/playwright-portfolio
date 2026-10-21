/**
 * Generates a one-page sample test report for the Fiverr gallery:
 *   gallery/sample-test-report.html
 *   gallery/sample-test-report.pdf
 *
 * Test names and results come from a real run (JSON reporter), not a hand-written list.
 *
 * Usage: node scripts/report-pdf.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'gallery');
const browserNames = { chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' };

function runSuite() {
  let stdout;
  try {
    stdout = execSync('npx playwright test --reporter=json', { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  } catch (err) {
    stdout = err.stdout;
  }
  return JSON.parse(stdout);
}

/** Flatten the JSON report into one row per test case, merging results across browsers. */
function collectCases(report) {
  const cases = new Map();
  const walk = (suite, parents) => {
    for (const spec of suite.specs || []) {
      const describe = parents[parents.length - 1] || '';
      const key = `${spec.file}::${spec.title}`;
      const row = cases.get(key) || { title: spec.title, flow: describe.replace(/^TodoMVC\s*—\s*/, ''), results: [] };
      for (const t of spec.tests) row.results.push({ project: t.projectName, status: t.status });
      cases.set(key, row);
    }
    for (const child of suite.suites || []) walk(child, [...parents, child.title]);
  };
  for (const suite of report.suites) walk(suite, []);
  return [...cases.values()];
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function reportHtml({ stats, cases, browsers, date }) {
  const total = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
  const rows = cases.map((c) => {
    const passed = c.results.every((r) => r.status === 'expected');
    const result = passed
      ? `<span class="pass">Passed</span>`
      : `<span class="fail">Failed</span>`;
    return `<tr><td>${escapeHtml(capitalize(c.title))}</td><td>${escapeHtml(capitalize(c.flow))}</td>
      <td>${result} <span class="muted">(${c.results.filter((r) => r.status === 'expected').length}/${c.results.length} browsers)</span></td></tr>`;
  }).join('\n');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sample E2E Test Report</title><style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 11pt; }
    .page { width: 210mm; height: 297mm; padding: 22mm 20mm 18mm; display: flex; flex-direction: column; }
    header { border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 22px; }
    h1 { margin: 0 0 6px; font-size: 22pt; font-weight: 600; letter-spacing: -0.3px; color: #111827; }
    .meta { color: #6b7280; font-size: 10pt; }
    .meta strong { color: #374151; font-weight: 600; }
    h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 10px; font-weight: 600; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 26px; }
    .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; }
    .card .label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
    .card .value { font-size: 20pt; font-weight: 600; margin-top: 4px; color: #111827; }
    .card .value.green { color: #15803d; }
    .card .value.small { font-size: 10.5pt; line-height: 1.5; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
    th { text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db; padding: 8px 10px; background: #f9fafb; }
    td { padding: 9px 10px; border-bottom: 1px solid #f0f0f0; }
    .pass { color: #15803d; font-weight: 600; }
    .fail { color: #b91c1c; font-weight: 600; }
    .muted { color: #9ca3af; font-size: 9pt; }
    footer { margin-top: auto; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #6b7280; font-size: 9pt; font-style: italic; }
  </style></head><body><div class="page">
    <header>
      <h1>Sample E2E Test Report</h1>
      <div class="meta"><strong>Project:</strong> Demo Web App &nbsp;·&nbsp; <strong>Date:</strong> ${escapeHtml(date)}
        &nbsp;·&nbsp; <strong>Framework:</strong> Playwright + TypeScript</div>
    </header>
    <h2>Summary</h2>
    <div class="summary">
      <div class="card"><div class="label">Total tests</div><div class="value">${total}</div></div>
      <div class="card"><div class="label">Passed</div><div class="value green">${stats.expected}</div></div>
      <div class="card"><div class="label">Failed</div><div class="value">${stats.unexpected}</div></div>
      <div class="card"><div class="label">Browsers</div><div class="value small">${browsers.map(escapeHtml).join('<br>')}</div></div>
    </div>
    <h2>Test cases</h2>
    <table><thead><tr><th>Test case</th><th>Flow</th><th>Result</th></tr></thead><tbody>
      ${rows}
    </tbody></table>
    <footer>Sample deliverable — real reports are tailored to your app.</footer>
  </div></body></html>`;
}

(async () => {
  const report = runSuite();
  const cases = collectCases(report);
  const projects = [...new Set(cases.flatMap((c) => c.results.map((r) => r.project)))];
  const browsers = projects.map((p) => browserNames[p] || p);
  const date = new Date(report.stats.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (report.stats.unexpected > 0) console.warn(`Warning: ${report.stats.unexpected} test(s) failed; the report will show them.`);

  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'sample-test-report.html');
  fs.writeFileSync(htmlPath, reportHtml({ stats: report.stats, cases, browsers, date }));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'));
  await page.pdf({ path: path.join(outDir, 'sample-test-report.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();

  console.log(`${report.stats.expected} passed, ${report.stats.unexpected} failed. PDF written to gallery/sample-test-report.pdf`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
