import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("HTML reports attach exact source provenance to quantitative values", () => {
  const reportSkill = read("../skills/build-report/SKILL.md");

  assert.match(reportSkill, /every source-backed quantitative value in an HTML report a directly associated source tooltip/);
  assert.match(reportSkill, /Source: <source system, connector, or artifact>/);
  assert.match(reportSkill, /Table: <fully qualified table or view>/);
  assert.match(reportSkill, /list every material contributing source and table/);
  assert.match(reportSkill, /Never invent provenance/);
  assert.match(reportSkill, /real hover and keyboard-focus affordances/);
  assert.match(reportSkill, /Live Recharts charts and their same-data static fallbacks cannot expose source provenance for every mark through HTML alone/);
  assert.match(reportSkill, /every chart figure has a visible source affordance plus tooltip content/);
  assert.match(reportSkill, /the actual interactive `report\.html` file is the primary deliverable/);
  assert.match(reportSkill, /never use `image\.png`, a screenshot, or another flattened image as the only report handoff/);
  assert.match(reportSkill, /inspect the generated `report\.html` itself, not only the shell or a screenshot/);
  assert.match(reportSkill, /each tooltip contains real non-placeholder provenance/);
  assert.match(reportSkill, /visible source affordance/);
  assert.match(reportSkill, /hover and focus trigger on the visible `Source` affordance only/);
  assert.match(reportSkill, /rather than the whole chart image/);
  assert.match(reportSkill, /same shared `source-tooltip-content` style/);
  assert.match(reportSkill, /Do not create card-, narrative-, table-, or chart-specific tooltip variants/);
  assert.match(reportSkill, /same computed foreground, background, typography, padding, radius, and shadow/);
});

test("the Recharts HTML report shell provides the accessible source-tooltip pattern", () => {
  const html = read("../assets/html-report-shell.html");

  assert.match(html, /\.source-tooltip/);
  assert.match(html, /\.source-tooltip \{[^\n]+appearance: none;[^\n]+font: inherit;/);
  assert.match(html, /\.source-tooltip:focus-visible/);
  assert.match(html, /class="source-tooltip" tabindex="0" aria-describedby="number-source-tooltip-1"/);
  assert.match(html, /class="source-tooltip-content" id="number-source-tooltip-1" role="tooltip"/);
  assert.match(html, /<figure class="card source-figure">/);
  assert.match(html, /<button type="button" class="source-tooltip" aria-describedby="chart-source-tooltip-1">Source<span class="source-tooltip-content" id="chart-source-tooltip-1" role="tooltip">/);
  assert.match(html, /class="source-tooltip-content" id="chart-source-tooltip-1" role="tooltip"/);
  assert.match(html, /\.source-figure > \.source-tooltip \{/);
  assert.match(html, /\.shell \{[^\n]+overflow: hidden;/);
  assert.match(html, /\.card \{ overflow: hidden;/);
  assert.match(html, /\.source-figure \{ position: relative; \}/);
  assert.doesNotMatch(html, /\.source-figure \{[^\n]+overflow: visible;/);
  assert.match(html, /html, body \{ max-width: 100%; overflow-x: clip; \}/);
  assert.match(html, /\.source-tooltip-content \{ position: fixed;[^\n]+display: none;[^\n]+max-width: min\(360px, calc\(100vw - 16px\)\);/);
  assert.match(html, /\.source-tooltip-content \{[^\n]+overflow-wrap: anywhere; white-space: normal;/);
  assert.match(html, /html:not\(\[data-source-tooltips-ready\]\) \.source-tooltip-content \{ position: absolute;/);
  assert.match(html, /\.source-tooltip:hover \.source-tooltip-content[^\n]+\{ display: block;/);
  assert.match(html, /@media \(max-width: 600px\)/);
  assert.match(html, /\.source-tooltip\[data-source-tooltip-open\] \.source-tooltip-content, html:not\(\[data-source-tooltips-ready\]\) \.source-tooltip:focus \.source-tooltip-content \{[^\n]+bottom: calc\(16px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(html, /\.source-tooltip-heading \{ display: block;/);
  assert.doesNotMatch(html, /\.source-tooltip:hover \+ \.source-tooltip-content/);
  assert.doesNotMatch(html, /figure\.source-tooltip/);
  assert.match(html, /A screenshot\/image preview is non-interactive and cannot replace report\.html/);
  assert.match(html, /Wrap every source-backed visible number in this source-tooltip pattern/);
  assert.match(html, /Source: \{\{source system or connector\}\}/);
  assert.match(html, /Table: \{\{fully qualified table or view; list all material tables\}\}/);
  assert.match(html, /\.source-tooltip-content, \.source-tooltip-content \* \{ color: #fff !important; font-style: normal !important; text-decoration: none !important; \}/);
  assert.match(html, /    \.source-tooltip-content \{[^\n]+\}/);
});

test("the HTML report runtime clamps desktop tooltips and toggles a mobile source tray", () => {
  const runtime = read("../src/html-report-source-tooltips.js");

  assert.match(runtime, /__dataAnalyticsSourceTooltipsInitialized/);
  assert.match(runtime, /data-source-tooltips-ready/);
  assert.match(runtime, /function viewportBounds\(\)/);
  assert.match(runtime, /window\.visualViewport/);
  assert.match(runtime, /function clampAxis\(/);
  assert.match(runtime, /tooltip\.style\.setProperty\("--source-tooltip-left"/);
  assert.match(runtime, /tooltip\.style\.setProperty\("--source-tooltip-top"/);
  assert.match(runtime, /function prepareMobileTray\(/);
  assert.match(runtime, /function upgradeFigureSourceButtons\(/);
  assert.match(runtime, /originalTrigger instanceof HTMLButtonElement/);
  assert.match(runtime, /originalTrigger\.replaceWith\(button\)/);
  assert.match(runtime, /function installFigureSourceStyles\(/);
  assert.match(runtime, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(runtime, /upgradeFigureSourceButtons\(\);\n    installFigureSourceStyles\(\);\n    syncSemantics\(\);/);
  assert.match(runtime, /`Source for \$\{value\}`/);
  assert.match(runtime, /function toggleMobileTray\(/);
  assert.match(runtime, /function syncSemantics\(/);
  assert.match(runtime, /trigger\.setAttribute\("role", "button"\)/);
  assert.match(runtime, /trigger\.setAttribute\("aria-expanded"/);
  assert.match(runtime, /event\.stopPropagation\(\);\n      toggleMobileTray\(trigger\)/);
  assert.match(runtime, /document\.addEventListener\("click", handleClick, true\)/);
  assert.match(runtime, /document\.addEventListener\("keydown", handleKeydown\)/);
  assert.match(runtime, /document\.addEventListener\("scroll", handleScroll, true\)/);
  assert.match(runtime, /event\.key === "Escape"/);
  assert.match(runtime, /SCROLL_DISMISS_THRESHOLD/);
  assert.match(runtime, /window\.visualViewport\?\.addEventListener\("resize"/);
});
