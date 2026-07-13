import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";

const helper = fileURLToPath(
  new URL("../skills/build-report/scripts/embed_html_report_runtime.py", import.meta.url),
);

function assertShellRejected(shell, charts, expectedError) {
  const directory = mkdtempSync(join(tmpdir(), "data-analytics-html-report-"));
  const shellPath = join(directory, "shell.html");
  const payloadPath = join(directory, "payload.json");
  const runtimePath = join(directory, "runtime.html");
  const outputPath = join(directory, "report.html");

  writeFileSync(shellPath, shell);
  writeFileSync(payloadPath, JSON.stringify({ charts }));
  writeFileSync(
    runtimePath,
    '<!doctype html><script type="module">document.body.dataset.runtime = "ok";</script>',
  );

  assert.throws(() => {
    execFileSync("python3", [
      helper,
      "--input",
      shellPath,
      "--payload",
      payloadPath,
      "--runtime-html",
      runtimePath,
      "--output",
      outputPath,
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  }, (error) => {
    assert.match(error.stderr, expectedError);
    return true;
  });
}

function loaderBootCount(loaderSource, {
  height = 320,
  ready = true,
  renderedPanel = false,
  viewBox = "0 0 316 320",
  width = 316,
} = {}) {
  class FakeElement {}
  class FakeTemplate {}
  class FakeDecompressionStream {}
  const source = new FakeTemplate();
  const svg = viewBox
    ? { getAttribute: (name) => name === "viewBox" ? viewBox : null }
    : null;
  const mount = new FakeElement();
  mount.getBoundingClientRect = () => ({ height, width });
  mount.querySelector = (selector) => {
    if (selector === "svg") return svg;
    if (selector === ".leaderboard, .heatmap-grid-panel") return renderedPanel ? {} : null;
    return null;
  };
  const host = new FakeElement();
  host.getAttribute = (name) => name === "data-recharts-ready" && ready ? "true" : null;
  host.querySelector = (selector) => selector === "[data-recharts-live]" ? mount : null;
  const document = {
    getElementById: () => source,
    querySelectorAll: () => [host],
    readyState: "complete",
  };
  const window = {
    requestIdleCallback: (callback) => callback(),
    setTimeout: () => {},
  };
  const globalThis = { boots: 0 };
  const executableSource = loaderSource.replace("void boot();", "globalThis.boots += 1;");

  new Function(
    "document",
    "window",
    "HTMLTemplateElement",
    "HTMLElement",
    "DecompressionStream",
    "globalThis",
    executableSource,
  )(
    document,
    window,
    FakeTemplate,
    FakeElement,
    FakeDecompressionStream,
    globalThis,
  );
  return globalThis.boots;
}

test("HTML report runtime helper owns fallback swap and live chart sizing", () => {
  const directory = mkdtempSync(join(tmpdir(), "data-analytics-html-report-"));
  const shellPath = join(directory, "shell.html");
  const payloadPath = join(directory, "payload.json");
  const runtimePath = join(directory, "runtime.html");
  const outputPath = join(directory, "report.html");

  writeFileSync(
    shellPath,
    [
      '<!doctype html><style>svg { height: auto !important; min-width: 700px !important; }</style><body>',
      '<div data-recharts-chart="chart-1">',
      '<div data-recharts-fallback><svg role="img"><path d="M0 0h1"></path></svg></div>',
      '<div data-recharts-live aria-hidden="true"></div>',
      "</div>",
      "<!-- DATA_ANALYTICS_HTML_REPORT_RUNTIME -->",
      "</body>",
    ].join("\n"),
  );
  writeFileSync(
    payloadPath,
    JSON.stringify({
      charts: [
        {
          id: "chart-1",
          dataset: {
            chart_spec: { type: "line" },
            data: [{ label: "</script><script>alert(1)</script>", x: "2026-01-01", y: 1 }],
          },
          type: "line",
        },
      ],
    }),
  );
  writeFileSync(
    runtimePath,
    [
      "<!doctype html><head>",
      "<style>.runtime-style { color: blue; }</style>",
      '<script type="module">document.body.dataset.runtime = "ok";</script>',
      "</head><body></body>",
    ].join("\n"),
  );

  execFileSync("python3", [
    helper,
    "--input",
    shellPath,
    "--payload",
    payloadPath,
    "--runtime-html",
    runtimePath,
    "--output",
    outputPath,
  ]);

  const output = readFileSync(outputPath, "utf8");
  const encodedRuntime = output
    .match(/<template id="data-analytics-html-report-runtime-source"[^>]*>([\s\S]*?)<\/template>/)?.[1]
    .replace(/\s/g, "");
  const loaderSource = output
    .match(/<script data-data-analytics-html-report-runtime-loader="true">([\s\S]*?)<\/script>/)?.[1];
  const runtimeSource = gunzipSync(Buffer.from(encodedRuntime, "base64")).toString("utf8");

  assert.match(output, /id="analytics-payload"/);
  assert.match(output, /data-data-analytics-html-report-runtime="true"/);
  assert.match(output, /data-data-analytics-html-report-source-tooltips="true"/);
  assert.match(output, /__dataAnalyticsSourceTooltipsInitialized/);
  assert.match(output, /data-data-analytics-html-report-runtime-source="true"/);
  assert.match(output, /data-data-analytics-html-report-runtime-loader="true"/);
  assert.match(
    output,
    /\[data-recharts-chart\] \[data-recharts-live\] \{ display: none !important; \}/,
  );
  assert.match(
    output,
    /\[data-recharts-chart\]\[data-recharts-ready="true"\] \[data-recharts-fallback\] \{ display: none !important; \}/,
  );
  assert.match(
    output,
    /\[data-recharts-chart\]\[data-recharts-ready="true"\] \[data-recharts-live\] \{ display: block !important; \}/,
  );
  assert.match(
    output,
    /\[data-recharts-chart\] \[data-recharts-live\] svg \{[\s\S]*height: 100% !important;[\s\S]*min-width: 0 !important;[\s\S]*width: 100% !important;/,
  );
  assert.ok(
    output.indexOf("svg { height: auto !important;") <
      output.indexOf("[data-recharts-chart] [data-recharts-live] svg {"),
    "runtime chart sizing guard should follow authored shell CSS",
  );
  assert.match(output, /DecompressionStream\("gzip"\)/);
  assert.match(output, /requestIdleCallback/);
  assert.doesNotMatch(
    output,
    /source\.remove\(\)/,
    "serialized previews need the compressed source to replay at a new viewport",
  );
  assert.doesNotMatch(
    output,
    /loader\?\.remove\(\)/,
    "serialized previews need the tiny loader to replay at a new viewport",
  );
  assert.equal(
    loaderBootCount(loaderSource, { viewBox: "0 0 316 320" }),
    0,
    "matching serialized charts should not unpack the full runtime again",
  );
  assert.equal(
    loaderBootCount(loaderSource, { viewBox: "0 0 888 320" }),
    1,
    "desktop SVGs serialized into mobile cards should replay the runtime",
  );
  assert.equal(
    loaderBootCount(loaderSource, { ready: false, viewBox: null }),
    1,
    "raw reports with empty live mounts should boot the runtime",
  );
  assert.match(output, /runtime\.remove\(\)/);
  assert.match(runtimeSource, /document\.body\.dataset\.runtime = "ok"/);
  assert.doesNotMatch(output, /<script[^>]*>document\.body\.dataset\.runtime = "ok"/);
  assert.match(output, /data-recharts-fallback/);
  assert.match(output, /\\u003c\/script\\u003e/);
  assert.doesNotMatch(output, /<\/script><script>alert/);
  assert.doesNotMatch(output, /DATA_ANALYTICS_HTML_REPORT_RUNTIME/);
});

test("packaged HTML report runtime stays compact for ChatGPT previews", () => {
  const directory = mkdtempSync(join(tmpdir(), "data-analytics-html-report-"));
  const shellPath = join(directory, "shell.html");
  const payloadPath = join(directory, "payload.json");
  const outputPath = join(directory, "report.html");

  writeFileSync(
    shellPath,
    [
      "<!doctype html><body>",
      '<div data-recharts-chart="chart-1">',
      '<div data-recharts-fallback><svg role="img"><path d="M0 0h1"></path></svg></div>',
      '<div data-recharts-live aria-hidden="true"></div>',
      "</div>",
      "<!-- DATA_ANALYTICS_HTML_REPORT_RUNTIME -->",
      "</body>",
    ].join("\n"),
  );
  writeFileSync(
    payloadPath,
    JSON.stringify({
      charts: [{ id: "chart-1", dataset: { chart_spec: { type: "line" }, data: [] }, type: "line" }],
    }),
  );

  execFileSync("python3", [
    helper,
    "--input",
    shellPath,
    "--payload",
    payloadPath,
    "--output",
    outputPath,
  ]);

  const output = readFileSync(outputPath, "utf8");
  const encodedRuntime = output
    .match(/<template id="data-analytics-html-report-runtime-source"[^>]*>([\s\S]*?)<\/template>/)?.[1]
    .replace(/\s/g, "");
  const runtimeSource = gunzipSync(Buffer.from(encodedRuntime, "base64")).toString("utf8");
  const maxLineLength = Math.max(...output.split("\n").map((line) => line.length));
  assert.match(output, /data-analytics-html-report-runtime-source/);
  assert.match(runtimeSource, /visualViewport/);
  assert.match(runtimeSource, /--source-tooltip-left/);
  assert.match(runtimeSource, /Source for /);
  assert.match(runtimeSource, /data-source-tooltip-open/);
  assert.match(runtimeSource, /data-source-tooltip-runtime-role/);
  assert.match(runtimeSource, /stopPropagation/);
  assert.ok(Buffer.byteLength(output) < 400_000, "packaged report should not inline the raw runtime");
  assert.ok(maxLineLength < 10_000, "packaged report should not contain giant minified JS lines");
});

test("HTML report runtime helper rejects a chart without its own readable fallback", () => {
  assertShellRejected(
    [
      "<!doctype html><body>",
      '<div data-recharts-chart="chart-1"><div data-recharts-fallback><svg><path d="M0 0h1"></path></svg></div><div data-recharts-live></div></div>',
      '<div data-recharts-chart="chart-2"><div data-recharts-live></div></div>',
      "<!-- DATA_ANALYTICS_HTML_REPORT_RUNTIME -->",
      "</body>",
    ].join("\n"),
    [
      { id: "chart-1", dataset: { data: [] }, type: "line" },
      { id: "chart-2", dataset: { data: [] }, type: "line" },
    ],
    /Chart chart-2 needs its own data-recharts-fallback content/,
  );
});

test("HTML report runtime helper rejects duplicate chart hosts", () => {
  assertShellRejected(
    [
      "<!doctype html><body>",
      '<div data-recharts-chart="chart-1"><div data-recharts-fallback><svg><path d="M0 0h1"></path></svg></div><div data-recharts-live></div></div>',
      '<div data-recharts-chart="chart-1"><div data-recharts-fallback><svg><path d="M0 0h1"></path></svg></div><div data-recharts-live></div></div>',
      "<!-- DATA_ANALYTICS_HTML_REPORT_RUNTIME -->",
      "</body>",
    ].join("\n"),
    [{ id: "chart-1", dataset: { data: [] }, type: "line" }],
    /exactly one chart host for chart-1/,
  );
});

test("HTML report runtime helper rejects chart hosts without payload entries", () => {
  assertShellRejected(
    [
      "<!doctype html><body>",
      '<div data-recharts-chart="chart-1"><div data-recharts-fallback><svg><path d="M0 0h1"></path></svg></div><div data-recharts-live></div></div>',
      '<div data-recharts-chart="chart-2"><div data-recharts-fallback><svg><path d="M0 0h1"></path></svg></div><div data-recharts-live></div></div>',
      "<!-- DATA_ANALYTICS_HTML_REPORT_RUNTIME -->",
      "</body>",
    ].join("\n"),
    [{ id: "chart-1", dataset: { data: [] }, type: "line" }],
    /chart hosts without payload entries: chart-2/,
  );
});
