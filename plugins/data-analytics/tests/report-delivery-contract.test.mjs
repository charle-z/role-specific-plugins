import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => fs.readFileSync(path.resolve(here, relativePath), "utf8");

test("Data Analytics defaults completed analytical findings to a durable report", () => {
  const index = read("../skills/index/SKILL.md");

  assert.match(index, /Default to `report` whenever a Data Analytics run analyzes real or sample data and produces findings/);
  assert.match(index, /The user does not need to say "report"/);
  assert.match(index, /When uncertain between `inline` and `report`, choose `report`/);
  assert.match(index, /Use `inline` only when the user explicitly asks for a quick chat answer/);
  assert.match(index, /the run is incomplete until a rendered MCP app report or HTML report exists/);
});

test("report delivery always resolves to MCP app or HTML from the runtime", () => {
  const report = read("../skills/build-report/SKILL.md");
  const reportSpec = read("../skills/build-report/specifications/mcp-app-report.md");
  const core = read("../src/analytics-app-core.md");
  const index = read("../skills/index/SKILL.md");

  assert.match(report, /Codex desktop: use `mcp-app` by default/);
  assert.match(report, /Positively identified ChatGPT web Work Mode: use `html`/);
  assert.match(report, /Work Mode signal with unknown or non-desktop surface: use `html`/);
  assert.match(report, /Only a positive `surface = codex_desktop` signal may take the Codex desktop MCP default/);
  assert.match(report, /Any other runtime where MCP app report rendering is unavailable: use `html`/);
  assert.match(report, /Unknown or unclassified runtime: default to portable `html` rather than omitting the report/);
  assert.match(report, /If an MCP app report was already rendered and the current context later identifies Work Mode without a positive Codex desktop surface/);
  assert.match(report, /fall back to `html` in the same run/);
  assert.match(report, /A renderer failure changes the delivery mode; it does not waive the report/);
  assert.match(report, /When this skill is selected directly and the user explicitly asks to "use sample data" or create a report "using the sample data"/);
  assert.match(report, /\[demo-product-growth\.csv\]\(\.\.\/\.\.\/assets\/demo-product-growth\.csv\)/);
  assert.match(report, /do not search the workspace for a substitute or invent replacement data/);
  for (const guidance of [report, reportSpec, core]) {
    assert.match(guidance, /independently laid out or editable major report (segment|section)/);
    assert.match(guidance, /multiple peer `##`/);
    assert.match(guidance, /one headline does not mean one `metrics\[\]` entry/i);
    assert.match(guidance, /executive summary or findings/);
  }
  assert.match(index, /Report-mode work routes through `\$build-report`, which uses `mcp-app` by default/);
});

test("HTML reports preserve automatic light and dark system appearances", () => {
  const report = read("../skills/build-report/SKILL.md");
  const shell = read("../assets/html-report-shell.html");

  assert.match(report, /automatic system appearance support/);
  assert.match(report, /<meta name="color-scheme" content="light dark">/);
  assert.match(report, /@media \(prefers-color-scheme: dark\)/);
  assert.match(report, /both light and dark system modes/);
  assert.match(shell, /<meta name="color-scheme" content="light dark">/);
  assert.match(shell, /@media \(prefers-color-scheme: dark\)/);
  assert.match(shell, /--surface: #212121;/);
  assert.match(shell, /--text: #fff;/);
});

test("primary analytical workflows honor their report delivery contracts", () => {
  const index = read("../skills/index/SKILL.md");
  const report = read("../skills/build-report/SKILL.md");
  const product = read("../skills/product-business-analysis/SKILL.md");
  const diagnostics = read("../skills/metric-diagnostics/SKILL.md");
  const kpi = read("../skills/kpi-reporting/SKILL.md");
  const market = read("../skills/market-sizing/SKILL.md");
  const design = read("../skills/design-kpis/SKILL.md");
  const quality = read("../skills/analyze-data-quality/SKILL.md");
  const reportImplications = index.split("Every `report` route includes", 2)[1].split("\n\n", 1)[0];

  assert.match(report, /A user can explicitly waive report creation by requesting an inline, chat-only, brief\/no-artifact answer/);
  assert.match(report, /Do not infer a waiver from the absence of the word "report"/);
  assert.match(product, /This handoff is mandatory when no explicit human waiver was given/);
  assert.match(product, /do not infer a waiver because the user asked a direct question/);
  assert.match(diagnostics, /This handoff is mandatory when no explicit human waiver was given/);
  assert.match(diagnostics, /direct diagnostic question/);
  assert.match(kpi, /When no explicit human waiver was given, the report handoff is mandatory/);
  assert.doesNotMatch(kpi, /If they did not specify one, ask what format they want/);
  assert.match(market, /This handoff is mandatory when no explicit human waiver was given/);
  assert.match(design, /deliver it inline by default/);
  assert.match(design, /Do not load `\$build-report` merely because the KPI framework uses evidence, compares candidates, or contains several metrics/);
  assert.match(design, /Use `\$visualize-data` and `\$build-report` when a data visual would materially improve the answer/);
  assert.match(design, /showing how a proposed target compares with historical performance or benchmarks/);
  assert.doesNotMatch(design, /Default to \$build-report/);
  assert.doesNotMatch(reportImplications, /\$design-kpis/);
  assert.match(quality, /pass the completed findings to \$build-report by default/);
});

test("driver questions route to diagnostics while bounded lookups remain inline", () => {
  const index = read("../skills/index/SKILL.md");

  assert.match(index, /Do not classify a prompt as bounded merely because its evidence might fit in one table or chart/);
  assert.match(index, /which dimension, category, cohort, entity, segment, or driver drove a metric's growth, decline, change, gap, or variance is a diagnostic route/);
  assert.match(index, /Current-value lookups, totals, simple time series, and direct current-value rankings remain inline/);
  assert.match(index, /A quick KPI status update or brief KPI readout is an inline output choice/);
  assert.match(index, /Do not infer a waiver from the absence of the word "report"/);
});

test("KPI and market-sizing workflows pass complete report inputs forward", () => {
  const kpi = read("../skills/kpi-reporting/SKILL.md");
  const market = read("../skills/market-sizing/SKILL.md");
  const slides = read("../skills/build-report/report-to-google-slides/SKILL.md");

  assert.match(kpi, /When the primary KPI is top-line, composite, or otherwise not directly actionable, define its driver decomposition/);
  assert.match(kpi, /Tell \$build-report this is a KPI readout and pass the status, pacing, driver, uncertainty, audience, cadence, surface, and visual guidance above/);
  assert.match(kpi, /use \$build-report to create an HTML report first because `\$report-to-google-slides` consumes an existing local HTML analytics report/);
  assert.match(kpi, /top-line actual, component drivers, largest contributors or non-drivers, and residual or unresolved movement/);
  assert.match(slides, /This skill consumes an HTML report/);

  assert.match(market, /Before handoff, make the market-sizing conclusion explicit/);
  assert.match(market, /method and calculation chain/);
  assert.match(market, /Do not render charts directly from this skill/);
  assert.match(market, /\$visualize-data owns chart selection and QA/);
});

test("report-mode visualization ownership stays with visualize-data", () => {
  const index = read("../skills/index/SKILL.md");
  const report = read("../skills/build-report/SKILL.md");
  const kpi = read("../skills/kpi-reporting/SKILL.md");

  assert.match(index, /For report-mode runs, include `\$visualize-data` whenever charts or figures are needed/);
  assert.match(index, /primary analysis skills pass visual intent and evidence forward rather than rendering charts directly/);
  assert.match(report, /Route every report visualization through `\$visualize-data`/);
  assert.match(kpi, /Do not render charts directly from this skill/);
});

test("query provenance stays out of visible answers unless SQL is requested", () => {
  const index = read("../skills/index/SKILL.md");
  const core = read("../src/analytics-app-core.md");
  const report = read("../skills/build-report/SKILL.md");
  const semanticTemplate = read("../skills/create-data-context/references/semantic-layer/skill-template.md");

  assert.match(index, /A data question answered by executing SQL, including a query-backed answer, is not by itself a request for SQL/);
  assert.match(index, /Do not paste or reproduce source SQL in the final chat response or reader-facing report narrative unless the user explicitly asks/);
  assert.match(index, /Keep full SQL in `source\.query\.sql`, a source modal, a query permalink, a notebook or query file, or supporting notes/);
  assert.match(core, /Treat `source\.query\.sql` as provenance for the widget's source experience, not as visible answer content/);
  assert.match(core, /Do not duplicate that SQL in the surrounding final chat response or chart narrative unless the user explicitly asks/);
  assert.match(report, /Do not paste source SQL into the visible report body or final chat handoff unless the user explicitly asks/);
  assert.match(semanticTemplate, /a data question answered with SQL is not an SQL-delivery request/);
});
