import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../assets/html-report-shell.html", import.meta.url), "utf8");
const reference = readFileSync(
  new URL("../skills/visualize-data/references/recharts-html.md", import.meta.url),
  "utf8",
);

function cssRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected HTML report shell to define ${selector}`);
  return match[1];
}

test("HTML report table cards share the narrative reading width", () => {
  assert.match(cssRule(":root"), /--report-reading-width:\s*800px;/);
  assert.match(cssRule(".reading"), /width:\s*min\(var\(--report-reading-width\),\s*100%\);/);

  const tableCard = cssRule(".table-card");
  assert.match(tableCard, /width:\s*min\(var\(--report-reading-width\),\s*100%\);/);
  assert.match(tableCard, /max-width:\s*100%;/);
  assert.match(tableCard, /margin:\s*12px auto 46px;/);
});

test("HTML report tables fill their card and contain horizontal overflow", () => {
  const tableScroll = cssRule(".table-scroll");
  assert.match(tableScroll, /width:\s*100%;/);
  assert.match(tableScroll, /max-width:\s*100%;/);
  assert.match(tableScroll, /overflow-x:\s*auto;/);

  const table = cssRule(".table-scroll > table");
  assert.match(table, /width:\s*max-content;/);
  assert.match(table, /min-width:\s*100%;/);
  assert.match(html, /<div class="table-scroll">\{\{SEMANTIC_TABLE\}\}<\/div>/);
});

test("HTML report guidance preserves contained table sizing", () => {
  assert.match(reference, /Keep table cards on the shell's shared reading width; reserve `\.wide` for chart cards\./);
  assert.match(reference, /narrow tables fill their card, wide tables scroll inside it/);
  assert.match(reference, /the document itself never gains horizontal overflow/);
});
