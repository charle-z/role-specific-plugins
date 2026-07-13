import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function executableHtmlReportRuntime(source) {
  return source
    .replace('import "./html-report-source-tooltips.js";\n', "")
    .replace(
      'import { renderRechartsChart } from "./recharts-renderer.jsx";',
      "const renderRechartsChart = globalThis.__renderRechartsChart;",
    );
}

function executeHtmlReportRuntime(source, {
  document,
  HTMLElement,
  MutationObserver,
  ResizeObserver,
  renderRechartsChart,
  window,
}) {
  new Function(
    "document",
    "window",
    "HTMLElement",
    "CSS",
    "MutationObserver",
    "ResizeObserver",
    "globalThis",
    executableHtmlReportRuntime(source),
  )(
    document,
    window,
    HTMLElement,
    undefined,
    MutationObserver,
    ResizeObserver,
    { __renderRechartsChart: renderRechartsChart },
  );
}

function fakeSvg(viewBox) {
  return {
    getAttribute(name) {
      if (name === "viewBox") return viewBox;
      return null;
    },
  };
}

function serializedChartFixture({
  hostHeight = 320,
  hostWidth = 316,
  mountHeight = 320,
  mountWidth = hostWidth,
  renderedSelector = "svg",
  viewBox = "0 0 316 320",
}) {
  class FakeElement {}
  let rendered = false;
  let removedAriaHidden = false;
  const attributes = new Map();
  const serializedSvg = fakeSvg(viewBox);
  const liveMount = new FakeElement();
  liveMount.getBoundingClientRect = () => ({ height: mountHeight, width: mountWidth });
  liveMount.querySelector = (selector) => {
    if (!selector.includes(renderedSelector)) return null;
    if (renderedSelector === "svg") {
      return rendered ? fakeSvg(`0 0 ${mountWidth || 316} 320`) : serializedSvg;
    }
    return {};
  };
  liveMount.removeAttribute = (name) => {
    attributes.delete(name);
    if (name === "aria-hidden") removedAriaHidden = true;
  };
  liveMount.setAttribute = (name, value) => {
    attributes.set(name, value);
  };
  const host = new FakeElement();
  host.dataset = {};
  host.getBoundingClientRect = () => ({ height: hostHeight, width: hostWidth });
  host.querySelector = (selector) => selector === "[data-recharts-live]" ? liveMount : null;
  const payload = {
    textContent: JSON.stringify({
      charts: [{ id: "chart-1", dataset: { chart_spec: {}, data: [] }, type: "line" }],
    }),
  };
  const document = {
    getElementById: (id) => id === "analytics-payload" ? payload : null,
    querySelector: () => host,
    readyState: "complete",
  };
  return {
    attributes,
    document,
    FakeElement,
    host,
    liveMount,
    markRendered() {
      rendered = true;
    },
    removedAriaHidden() {
      return removedAriaHidden;
    },
    setHostWidth(width) {
      hostWidth = width;
    },
    setMountWidth(width) {
      mountWidth = width;
    },
    setMountHeight(height) {
      mountHeight = height;
    },
  };
}

class FakeMutationObserver {
  observe() {}
  disconnect() {}
}

function immediatelyReadyWindow() {
  return {
    requestAnimationFrame: (callback) => callback(),
    setTimeout: () => {},
  };
}

test("inline Recharts bridge normalizes word percent units into valueFormat", async () => {
  const source = await readFile(new URL("../src/recharts-renderer.jsx", import.meta.url), "utf8");

  assert.match(source, /const percentWordUnit = isPercentWordUnit\(rawUnit\);/);
  assert.match(source, /const unit = percentWordUnit \? "" : rawUnit;/);
  assert.match(source, /valueFormat: existing\.valueFormat \|\| \(percentWordUnit \? "percent" : unit === "\$" \? "currency" : "compact"\)/);
});

test("inline Recharts bridge clears serialized live markup before remounting", async () => {
  const source = await readFile(new URL("../src/recharts-renderer.jsx", import.meta.url), "utf8");
  const destroyer = source
    .split("export function destroyRechartsChart", 2)[1]
    .split("export function renderRechartsChart", 1)[0];
  const destroyRechartsChart = new Function(
    `return function destroyRechartsChart${destroyer}`,
  )();
  const serializedContainer = {
    childNodes: [{}, {}],
    replaceChildren() {
      this.childNodes = [];
    },
  };

  assert.match(destroyer, /if \(!container\) return;/);
  assert.match(destroyer, /container\.replaceChildren\(\);/);
  assert.match(source, /destroyRechartsChart\(container\);\n  const mount = document\.createElement/);
  destroyRechartsChart(serializedContainer);
  assert.deepEqual(serializedContainer.childNodes, []);
});

test("HTML report runtime reuses a matching serialized SVG chart", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const fixture = serializedChartFixture({ hostWidth: 316, mountWidth: 316, viewBox: "0 0 316 320" });
  let renderCalls = 0;

  assert.match(source, /const RENDERED_CHART_SELECTOR = "svg, \.leaderboard, \.heatmap-grid-panel";/);
  executeHtmlReportRuntime(source, {
    document: fixture.document,
    HTMLElement: fixture.FakeElement,
    MutationObserver: undefined,
    ResizeObserver: undefined,
    renderRechartsChart: () => { renderCalls += 1; },
    window: {
      requestAnimationFrame: () => {
        throw new Error("matching serialized charts should not schedule a remount");
      },
      setTimeout: () => {
        throw new Error("matching serialized charts should not schedule a remount");
      },
    },
  });

  assert.equal(renderCalls, 0);
  assert.equal(fixture.removedAriaHidden(), true);
  assert.equal(fixture.host.dataset.rechartsReady, "true");
});

for (const renderedSelector of [".leaderboard", ".heatmap-grid-panel"]) {
  test("HTML report runtime reuses a serialized " + renderedSelector + " chart", async () => {
    const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
    const fixture = serializedChartFixture({ renderedSelector });
    let renderCalls = 0;

    executeHtmlReportRuntime(source, {
      document: fixture.document,
      HTMLElement: fixture.FakeElement,
      MutationObserver: undefined,
      ResizeObserver: undefined,
      renderRechartsChart: () => { renderCalls += 1; },
      window: {
        requestAnimationFrame: () => {
          throw new Error("ready serialized panels should not schedule a remount");
        },
        setTimeout: () => {
          throw new Error("ready serialized panels should not schedule a remount");
        },
      },
    });

    assert.equal(renderCalls, 0);
    assert.equal(fixture.removedAriaHidden(), true);
    assert.equal(fixture.host.dataset.rechartsReady, "true");
  });
}

test("HTML report runtime remounts a desktop SVG serialized into a mobile card", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const fixture = serializedChartFixture({ hostWidth: 316, mountWidth: 316, viewBox: "0 0 888 320" });
  fixture.host.dataset.rechartsReady = "true";
  let renderCalls = 0;
  let resetBeforeRender = false;

  executeHtmlReportRuntime(source, {
    document: fixture.document,
    HTMLElement: fixture.FakeElement,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: undefined,
    renderRechartsChart: () => {
      renderCalls += 1;
      resetBeforeRender =
        fixture.host.dataset.rechartsReady === undefined &&
        fixture.attributes.get("aria-hidden") === "true";
      fixture.markRendered();
    },
    window: immediatelyReadyWindow(),
  });

  assert.equal(renderCalls, 1);
  assert.equal(resetBeforeRender, true);
  assert.equal(fixture.host.dataset.rechartsReady, "true");
});

test("HTML report runtime remounts a serialized SVG with stale height", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const fixture = serializedChartFixture({
    hostWidth: 316,
    mountHeight: 320,
    mountWidth: 316,
    viewBox: "0 0 316 640",
  });
  let renderCalls = 0;

  executeHtmlReportRuntime(source, {
    document: fixture.document,
    HTMLElement: fixture.FakeElement,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: undefined,
    renderRechartsChart: () => {
      renderCalls += 1;
      fixture.markRendered();
    },
    window: immediatelyReadyWindow(),
  });

  assert.equal(renderCalls, 1);
  assert.equal(fixture.host.dataset.rechartsReady, "true");
});

test("HTML report runtime remounts a reused SVG after its card narrows", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const fixture = serializedChartFixture({ hostWidth: 888, mountWidth: 888, viewBox: "0 0 888 320" });
  let renderCalls = 0;
  let resizeCallback;
  let disconnectCalls = 0;
  class FakeResizeObserver {
    constructor(callback) {
      resizeCallback = callback;
    }
    observe() {}
    disconnect() {
      disconnectCalls += 1;
    }
  }

  executeHtmlReportRuntime(source, {
    document: fixture.document,
    HTMLElement: fixture.FakeElement,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: FakeResizeObserver,
    renderRechartsChart: () => {
      renderCalls += 1;
      fixture.markRendered();
    },
    window: immediatelyReadyWindow(),
  });

  assert.equal(renderCalls, 0);
  fixture.setHostWidth(316);
  fixture.setMountWidth(316);
  resizeCallback();
  assert.equal(renderCalls, 1);
  resizeCallback();
  assert.equal(renderCalls, 1);
  assert.ok(disconnectCalls >= 1);
  assert.equal(fixture.host.dataset.rechartsReady, "true");
});

test("HTML report runtime remounts serialized SVGs when current geometry is unknown", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const fixture = serializedChartFixture({ hostWidth: 0, mountWidth: 0, viewBox: "0 0 888 320" });
  let renderCalls = 0;

  executeHtmlReportRuntime(source, {
    document: fixture.document,
    HTMLElement: fixture.FakeElement,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: undefined,
    renderRechartsChart: () => {
      renderCalls += 1;
      fixture.markRendered();
    },
    window: immediatelyReadyWindow(),
  });

  assert.equal(renderCalls, 1);
});

test("HTML report runtime marks a freshly rendered non-SVG panel ready", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  let renderCalls = 0;
  let rendered = false;
  let removedAriaHidden = false;
  class FakeElement {}
  const liveMount = new FakeElement();
  liveMount.querySelector = (selector) => rendered && selector.includes(".leaderboard") ? {} : null;
  liveMount.removeAttribute = (name) => {
    if (name === "aria-hidden") removedAriaHidden = true;
  };
  liveMount.setAttribute = () => {};
  const host = new FakeElement();
  host.dataset = {};
  host.querySelector = (selector) => selector === "[data-recharts-live]" ? liveMount : null;
  const payload = {
    textContent: JSON.stringify({
      charts: [{ id: "chart-1", dataset: { chart_spec: {}, data: [] }, type: "leaderboard" }],
    }),
  };
  const document = {
    getElementById: (id) => id === "analytics-payload" ? payload : null,
    querySelector: () => host,
    readyState: "complete",
  };
  const window = immediatelyReadyWindow();

  executeHtmlReportRuntime(source, {
    document,
    HTMLElement: FakeElement,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: undefined,
    renderRechartsChart: () => {
      renderCalls += 1;
      rendered = true;
    },
    window,
  });

  assert.equal(renderCalls, 1);
  assert.equal(removedAriaHidden, true);
  assert.equal(host.dataset.rechartsReady, "true");
});

test("HTML report runtime opts into report-only chart spacing", async () => {
  const source = await readFile(new URL("../src/html-report-runtime.jsx", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../src/recharts-renderer.jsx", import.meta.url), "utf8");
  const chartRenderer = await readFile(new URL("../src/analytics-app/charting/ChartRenderer.tsx", import.meta.url), "utf8");

  assert.match(source, /htmlReport: true,/);
  assert.match(renderer, /htmlReport=\{options\.htmlReport\}/);
  assert.match(chartRenderer, /htmlReport = false,/);
  assert.match(chartRenderer, /const HTML_REPORT_NUMERIC_Y_AXIS_WIDTH = 96;/);
  assert.equal(
    (
      chartRenderer.match(
        /width=\{htmlReport \? HTML_REPORT_NUMERIC_Y_AXIS_WIDTH : "auto"\}/g,
      ) ?? []
    ).length,
    2,
  );
});

test("inline chart widget projection preserves selected measure value formats", async () => {
  const source = await readFile(new URL("../src/datascience-chart-widget.js", import.meta.url), "utf8");

  assert.match(source, /function selectedMeasureColumn\(dataset\)/);
  assert.match(source, /function valueFormatFor\(dataset, existing = chartSpecFor\(dataset\)\)/);
  assert.match(source, /const valueFormat = valueFormatFor\(dataset, existing\);/);
  assert.match(source, /\.\.\.\(valueFormat \? \{ format: valueFormat \} : \{\}\),/);
  assert.match(source, /valueFormat,\nsettings: \{/);
});
