#!/usr/bin/env node
// Task 4: run a Google Lighthouse audit against a URL and print the result
// as JSON on stdout. Invoked as a subprocess from the Flask backend
// (see backend/wdsl/services/lighthouse.py) so Python doesn't need a
// Lighthouse binding of its own.
const lighthouse = require('lighthouse').default ?? require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function run(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const lhr = result.lhr;
    const summary = {
      categories: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, cat]) => [key, Math.round((cat.score ?? 0) * 100)])
      ),
      fetch_time: lhr.fetchTime,
      final_url: lhr.finalUrl,
    };
    process.stdout.write(JSON.stringify(summary));
  } finally {
    try {
      await chrome.kill();
    } catch (killErr) {
      // Windows sometimes can't remove the Chrome temp profile dir right
      // away; the audit already succeeded above, so this is not fatal.
      console.error('chrome.kill() cleanup warning:', killErr.message);
    }
  }
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: node run_lighthouse.js <url>');
  process.exit(1);
}

run(url).catch((err) => {
  console.error(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
  process.exit(1);
});
