import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

function read(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("preserves desktop data-context and MCP UI capabilities", () => {
  for (const relativePath of [
    "../.mcp.json",
    "../mcp/server.cjs",
    "../src/analytics-app/App.tsx",
    "../skills/create-data-context/SKILL.md",
    "../skills/build-dashboard/specifications/mcp-artifact-dashboard.md",
    "../skills/build-report/specifications/mcp-app-report.md",
  ]) {
    assert.equal(existsSync(new URL(relativePath, import.meta.url)), true, relativePath);
  }
});

test("classifies surface and mode independently from positive signals", () => {
  const index = read("../skills/index/SKILL.md");

  assert.match(index, /Classify `surface` and `mode` separately/);
  assert.match(index, /`surface = codex_desktop`/);
  assert.match(index, /`surface = chatgpt_web`/);
  assert.match(index, /`mode = work_mode`/);
  assert.match(index, /`mode = chat`/);
  assert.match(index, /Otherwise set the relevant value to `unknown`/);
  assert.match(index, /Never infer mode from surface, missing tools, tool failure/);
  assert.match(index, /only when `surface = chatgpt_web` and `mode = work_mode` are both positively identified/);
  assert.match(index, /Treat `mode = work_mode` with `surface = unknown` as a partial web Work Mode signal for delivery safety/);
  assert.match(index, /unless `surface = codex_desktop` is positively identified/);
});

test("ChatGPT web Chat mode recommends Work Mode before doing analytics work", () => {
  const index = read("../skills/index/SKILL.md");

  assert.match(index, /ChatGPT web Chat mode stop gate \(read first\)/);
  assert.match(index, /both `surface = chatgpt_web` and `mode = chat`/);
  assert.match(index, /respond only with a concise recommendation to switch to Work Mode/);
  assert.match(index, /Do not load focused analytics skills, inspect data or sources, call tools, ask intake questions, perform analysis, or create an artifact/);
  assert.match(index, /only after the recommendation has been shown and the user explicitly says to continue, proceed, or stay in Chat mode/);
  assert.match(index, /Repeating the original request, adding data, or answering an earlier question does not count as an override/);
  assert.match(index, /resume the original analytics request without making them restate it/);
  assert.match(index, /follow the ChatGPT web Work Mode runtime branch below for intake, persistence, and outputs/);
  assert.match(index, /Keep that override for the current analytics request/);
  assert.match(index, /ChatGPT web Chat mode \(`surface = chatgpt_web`, `mode = chat`\)/);
  assert.match(index, /After an explicit override, follow the ChatGPT web Work Mode intake guidance below/);
  assert.match(index, /After an override, follow the ChatGPT web Work Mode persistence guidance below/);
  assert.match(index, /After an override, follow the ChatGPT web Work Mode output guidance below/);
  assert.match(index, /Do not create outputs before an explicit override/);
});

test("runtime routing uses answers-ask-user-input except on Codex desktop", () => {
  const index = read("../skills/index/SKILL.md");

  assert.match(index, /After classifying `surface` and `mode`, select the most specific matching runtime branch/);
  assert.match(index, /Codex desktop \(`surface = codex_desktop`\)/);
  assert.match(index, /ChatGPT web Work Mode \(`web_work_mode = true`\)/);
  assert.match(index, /Work Mode with unknown surface \(`mode = work_mode`, `surface = unknown`\)/);
  assert.match(index, /Else: all other or unknown runtimes/);
  assert.ok(index.includes("| Codex desktop (`surface = codex_desktop`) | Use `request_user_input` for structured intake when available."));
  assert.ok(index.includes("| ChatGPT web Work Mode (`web_work_mode = true`) | Use `$answers-ask-user-input` or an equivalent native structured intake action for structured intake when available."));
  assert.ok(index.includes("| Work Mode with unknown surface (`mode = work_mode`, `surface = unknown`) | Use `$answers-ask-user-input` or an equivalent native structured intake action for structured intake when available."));
  assert.match(index, /On Codex desktop, call `request_user_input` whenever it is available/);
  assert.match(index, /On every other surface or mode, invoke `\$answers-ask-user-input` whenever it is available/);
  assert.match(index, /If the surface-appropriate structured intake action is unavailable but the runtime exposes an equivalent native structured intake action, use that action/);
  assert.match(index, /Do not fall back to conversational choices merely because the runtime is `chatgpt_web`, `work_mode`, or an unknown environment/);
  assert.match(index, /present the same task or fallback choices compactly in normal conversation/);
  assert.doesNotMatch(index, /Use the structured form contract below only when `surface = codex_desktop`/);
  assert.doesNotMatch(index, /including in `web_work_mode`/);
});

test("web Work Mode routes explicit semantic-layer setup to persistent skill creation", () => {
  const index = read("../skills/index/SKILL.md");
  const dataContext = read("../skills/create-data-context/SKILL.md");

  assert.match(index, /local creations use that skill's existing `\$CODEX_HOME\/skills\/<area>-semantic-layer` default/);
  assert.match(index, /Use ChatGPT personal Skills persistence when the Skills install surface is available in the run/);
  assert.match(index, /That skill chooses an exposed ChatGPT Skills, local Codex, or portable package destination/);
  assert.match(index, /For ordinary analytics work using supplied context for the current answer, keep the context current-session only/);
  assert.match(index, /it uses the current runtime's classified `surface` and `mode` values/);
  assert.match(index, /ChatGPT personal Skills, local Codex, or portable package persistence/);
  assert.match(dataContext, /Use the current runtime's classified `surface` and `mode` values/);
  assert.match(dataContext, /Use structured intake when a supported form action is available/);
  assert.match(dataContext, /Build and validate the same canonical semantic-layer skill package before writing it to any destination/);
  assert.match(dataContext, /Choose one persistence destination by default/);
  assert.match(dataContext, /Destination branch/);
  assert.match(dataContext, /Select this branch when/);
  assert.match(dataContext, /product-backed personal Skills install surface/);
  assert.match(dataContext, /Install the generated skill into the user's personal Skills library/);
  assert.match(dataContext, /include it as a Markdown link in the chat response/);
  assert.match(dataContext, /For ChatGPT personal Skills creations, include the installed skill link in the response/);
  assert.ok(dataContext.includes("`$CODEX_HOME/skills/<area>-semantic-layer`"));
  assert.ok(dataContext.includes("`~/.codex/skills/<area>-semantic-layer`"));
  assert.doesNotMatch(dataContext, /\.agents\/skills/);
  assert.match(dataContext, /For dual ChatGPT web and local Codex availability/);
  assert.match(dataContext, /portable skill package or source plan/);
});

test("semantic-layer create and update results include a weekly refresh automation offer", () => {
  const dataContext = read("../skills/create-data-context/SKILL.md");
  const weeklyPolling = read("../skills/create-data-context/references/semantic-layer/weekly-polling-automation.md");
  const automation = read("../skills/create-data-context/references/automation.md");

  assert.match(dataContext, /After creating or updating a semantic-layer skill/);
  assert.match(dataContext, /always offer weekly refresh/);
  assert.match(dataContext, /do not create it without explicit user approval/);
  assert.match(dataContext, /weekly refresh automation offer or prerequisite blocker/);
  assert.match(dataContext, /iteration guidance/);
  assert.match(dataContext, /refine definitions, add sources, update caveats/);
  assert.match(dataContext, /let the user know they can iterate on the semantic layer/);
  assert.doesNotMatch(dataContext, /validation result/);
  assert.doesNotMatch(dataContext, /validation results/);
  assert.match(weeklyPolling, /Offer weekly polling after semantic-layer creation or refresh/);
  assert.match(automation, /offers exactly one refresh automation/);
});

test("web Work Mode selects web output surfaces while retaining MCP data sources", () => {
  const index = read("../skills/index/SKILL.md");
  const dashboard = read("../skills/build-dashboard/SKILL.md");
  const report = read("../skills/build-report/SKILL.md");
  const visualize = read("../skills/visualize-data/SKILL.md");
  const nativeInline = read("../skills/visualize-data/references/native-inline-visualizations.md");
  const core = read("../src/analytics-app-core.md");
  const dashboardSpec = read("../skills/build-dashboard/specifications/mcp-artifact-dashboard.md");
  const reportSpec = read("../skills/build-report/specifications/mcp-app-report.md");

  assert.match(index, /Default durable reports and dashboards to HTML; use connected BI or another non-MCP destination when the user selects it/);
  assert.match(index, /MCP servers and other callable tools remain valid data sources/);
  assert.match(index, /Only after inline delivery is already selected, use native Work Mode rendering/);
  assert.match(index, /treat `charts_widget_v2` as directly surfaced and emit its live `genui` content reference before fallback/);
  assert.match(index, /do not self-declare it unavailable, search for it, or print its payload as bare JSON/);
  assert.match(index, /Do not call Data Analytics MCP UI tools for delivery in web Work Mode/);
  assert.match(index, /Do not use an unknown surface classification as permission to render an MCP app artifact/);
  assert.match(dashboard, /do not select the Data Analytics MCP artifact app/);
  assert.match(dashboard, /positive Work Mode signal without a positive Codex desktop surface/);
  assert.match(dashboard, /otherwise build portable HTML/);
  assert.match(report, /ChatGPT web Work Mode: use `html`/);
  assert.match(report, /Work Mode signal with unknown or non-desktop surface: use `html`/);
  assert.match(report, /do not treat an unknown surface classification as permission to render an MCP app report/);
  assert.match(visualize, /only after another workflow has already selected inline delivery/);
  assert.match(visualize, /only after the active workflow has already selected inline or chat-visible delivery/);
  assert.match(visualize, /prefer native Work Mode rendering/);
  assert.match(visualize, /native-inline-visualizations\.md/);
  assert.ok(visualize.includes('genui{"charts_widget_v2":{"content":{...}}}'));
  assert.match(visualize, /The inner chart spec alone is not a response/);
  assert.match(visualize, /do not print bare JSON, plain HTML, or a code fence/);
  assert.match(visualize, /treat `charts_widget_v2` as directly surfaced in this runtime/);
  assert.match(visualize, /do not self-declare it unavailable or search for it/);
  assert.match(visualize, /If the Visualize plugin is installed, also consult and follow its current visualization guidance/);
  assert.match(visualize, /do not call `render_chart` or `render_table` for inline delivery/);
  assert.match(visualize, /Use static or Matplotlib charting for this native-render failure fallback/);
  assert.match(visualize, /use a compact table only if no visual renderer can be delivered/);
  assert.match(visualize, /Outside the web Work Mode native-render failure fallback, use static Python charting only when/);
  assert.match(visualize, /successful Data Analytics MCP tool result is not delivery confirmation/);
  assert.match(nativeInline, /only after the active workflow has already selected an inline, chat-visible visual/);
  assert.match(nativeInline, /it does not choose inline delivery/);
  assert.match(nativeInline, /`charts_widget_v2`/);
  assert.match(nativeInline, /`app_block`/);
  assert.match(nativeInline, /Never emit a renderer payload as bare JSON/);
  assert.match(nativeInline, /`charts_widget_v2` is the directly surfaced native UI element/);
  assert.match(nativeInline, /do not search for it, self-declare it unavailable/);
  assert.ok(nativeInline.includes('genui{"charts_widget_v2":{"content":{...}}}'));
  assert.ok(nativeInline.includes('genui{"app_block":{"content":"<section>...</section>"}}'));
  assert.match(nativeInline, /do not classify `charts_widget_v2` as unsurfaced before attempting it/);
  assert.match(nativeInline, /ordinary fixed-size `scatter`/);
  assert.match(nativeInline, /true bubble chart is therefore not a `charts_widget_v2` scatter chart/);
  assert.match(nativeInline, /For bubble charts, funnel charts, and any other inline chart family outside that JSON surface, use `app_block` custom interactive HTML/);
  assert.match(nativeInline, /Do not decline the request, ask the user to repeat it, emit an unsupported JSON shape, or fall back to Matplotlib merely because `charts_widget_v2` does not support the family/);
  assert.match(nativeInline, /Mermaid is not a quantitative data-chart renderer/);
  assert.match(nativeInline, /Reproducible static\/Matplotlib chart/);
  assert.match(nativeInline, /prefer a static visual before a compact table/);
  assert.doesNotMatch(index, /native-inline-visualizations/);
  assert.match(core, /Data Analytics MCP widget surface is not available for delivery/);
  assert.match(core, /without a positive `surface = codex_desktop` signal/);
  assert.match(core, /preserve the delivery mode already selected/);
  assert.match(core, /treat `charts_widget_v2` as directly surfaced/);
  assert.match(core, /emit its live `genui` content reference in the outer shape/);
  assert.ok(core.includes('genui{"charts_widget_v2":{"content":{...}}}'));
  assert.match(core, /do not self-declare it unavailable or search for it/);
  assert.match(core, /Keep `app_block` conditional on the host surfacing it/);
  assert.match(core, /Use image-based\/static charting only after an emitted native reference is rejected or fails to render/);
  assert.match(core, /compact table\/non-MCP output only when no visual renderer can be delivered/);
  assert.match(core, /Do not treat an `ok:true` MCP tool result as proof/);
  assert.match(dashboardSpec, /Do not select this specification when `surface = chatgpt_web` and `mode = work_mode`/);
  assert.match(dashboardSpec, /`mode = work_mode` is positive and `surface` is unknown/);
  assert.match(reportSpec, /Do not select this specification when `surface = chatgpt_web` and `mode = work_mode`/);
  assert.match(reportSpec, /`mode = work_mode` is positive and `surface` is unknown/);
});

test("all HTML reports and dashboards use packaged Recharts with readable fallbacks", () => {
  const index = read("../skills/index/SKILL.md");
  const report = read("../skills/build-report/SKILL.md");
  const visualize = read("../skills/visualize-data/SKILL.md");
  const dashboardHtml = read("../skills/build-dashboard/specifications/html-dashboard.md");
  const rechartsReference = read("../skills/visualize-data/references/recharts-html.md");
  const htmlShell = read("../assets/html-report-shell.html");
  const runtime = read("../src/html-report-runtime.jsx");
  const helper = read("../skills/build-report/scripts/embed_html_report_runtime.py");
  const core = read("../src/analytics-app-core.md");

  assert.match(report, /For every selected HTML report path.*precompiled Recharts-in-HTML path/s);
  assert.match(report, /Codex desktop explicit HTML.*Google Slides conversion/s);
  assert.match(report, /For every HTML report path.*recharts-html\.md/s);
  assert.match(visualize, /Whenever the selected report or dashboard delivery surface is HTML.*packaged Recharts-in-HTML path/s);
  assert.match(visualize, /For every HTML report or dashboard.*references\/recharts-html\.md/s);
  assert.match(dashboardHtml, /For every portable HTML dashboard.*packaged Recharts runtime plus same-data static fallbacks/s);
  assert.match(rechartsReference, /including Codex explicit HTML.*ChatGPT web Work Mode.*Google Slides conversion/s);
  assert.match(rechartsReference, /do not install npm packages, run Vite, use a CDN/);
  assert.match(rechartsReference, /same reviewed rows as the Recharts payload/);
  assert.match(rechartsReference, /Keep fallback labels inside the SVG viewBox with edge padding/);
  assert.match(rechartsReference, /bar value labels do not intersect category-axis labels/);
  assert.match(rechartsReference, /\.\.\/\.\.\/\.\.\/assets\/html-report-shell\.html/);
  assert.match(rechartsReference, /\.\.\/\.\.\/build-report\/scripts\/embed_html_report_runtime\.py/);
  assert.match(rechartsReference, /technical-summary.*scope-data-and-metric-definitions.*methodology.*limitations-uncertainty-and-robustness-checks/s);
  assert.match(htmlShell, /data-report-audience="\{\{REPORT_AUDIENCE\}\}"/);
  assert.match(htmlShell, /data-recharts-chart="chart-1"/);
  assert.match(htmlShell, /data-recharts-fallback/);
  assert.match(htmlShell, /figure\.card \{ margin: 0; \}/);
  assert.match(htmlShell, /\.chart-wrap \{ padding: 16px 24px 16px 96px; \}/);
  assert.match(htmlShell, /\.chart-wrap \{ overflow-x: auto; padding: 16px 18px; \}/);
  assert.match(rechartsReference, /On wide layouts.*96px.*On narrow layouts.*compact symmetric chart padding/);
  assert.match(htmlShell, /data-contract-section="further-questions"/);
  assert.match(htmlShell, /DATA_ANALYTICS_HTML_REPORT_RUNTIME/);
  assert.match(runtime, /renderRechartsChart/);
  assert.match(runtime, /data-recharts-live/);
  assert.doesNotMatch(runtime, /mcp-host|localStorage|fetch\(/);
  assert.match(helper, /html-report-runtime\.html/);
  assert.match(helper, /safe_json_script_text/);
  assert.match(helper, /data-recharts-fallback/);
  assert.match(index, /Every selected HTML report path.*packaged Recharts runtime contract/s);
  assert.match(core, /HTML report charts should use the packaged standalone Recharts runtime/);
  assert.match(core, /same-data static SVG\/table fallbacks/);
});

test("desktop reports default to MCP and require a concrete HTML fallback", () => {
  const index = read("../skills/index/SKILL.md");
  const report = read("../skills/build-report/SKILL.md");

  assert.match(report, /Codex desktop: use `mcp-app` by default/);
  assert.match(report, /ChatGPT web Work Mode: use `html`/);
  assert.match(report, /Work Mode signal with unknown or non-desktop surface: use `html`/);
  assert.match(report, /On Codex desktop, use `html` only when the user explicitly asks/);
  assert.match(report, /an MCP app report was actually attempted and failed/);
  assert.match(index, /Codex desktop defaults to `mcp-app`/);
  assert.match(index, /partial Work Mode signals without a positive Codex desktop surface/);
  assert.match(index, /after a concrete failed MCP attempt/);
});

test("conversion handoffs keep routine verification details out of user-facing responses", () => {
  const createDataContext = read("../skills/create-data-context/SKILL.md");
  const dashboard = read("../skills/build-dashboard/SKILL.md");
  const doc = read("../skills/build-report/report-to-google-doc/SKILL.md");
  const jupyter = read("../skills/jupyter-notebooks/SKILL.md");
  const pdf = read("../skills/build-report/report-to-pdf/SKILL.md");
  const slides = read("../skills/build-report/report-to-google-slides/SKILL.md");

  for (const skill of [dashboard, doc, pdf, slides]) {
    assert.match(skill, /Keep routine check.*support artifacts/);
    assert.match(skill, /Do not list internal checks in the user-facing handoff/);
  }
  assert.match(createDataContext, /Keep routine validation details in support artifacts/);
  assert.match(jupyter, /do not add a separate routine validation section for a clean run/);
  assert.doesNotMatch(slides, /verification performed/);
  assert.doesNotMatch(pdf, /verification performed/);
  assert.doesNotMatch(doc, /validation performed/);
  assert.doesNotMatch(dashboard, /what validation was performed/);
  assert.doesNotMatch(createDataContext, /validation result/);
  assert.doesNotMatch(createDataContext, /validation results/);
  assert.doesNotMatch(jupyter, /Include validation status in the final response/);
});
