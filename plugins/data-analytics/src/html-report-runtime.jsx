import "./html-report-source-tooltips.js";
import { renderRechartsChart } from "./recharts-renderer.jsx";

const PAYLOAD_ID = "analytics-payload";
const READY_ATTRIBUTE = "rechartsReady";
const RENDERED_CHART_SELECTOR = "svg, .leaderboard, .heatmap-grid-panel";
const SERIALIZED_SVG_SIZE_TOLERANCE = 0.08;
const SERIALIZED_SVG_SIZE_TOLERANCE_PX = 4;
const SERIALIZED_SVG_WATCHER = "__dataAnalyticsSerializedSvgWatcher";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function selectorEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function measuredSize(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") return {};
  const rect = element.getBoundingClientRect();
  const height = Number(rect.height);
  const width = Number(rect.width);
  return {
    height: Number.isFinite(height) && height > 0 ? height : undefined,
    width: Number.isFinite(width) && width > 0 ? width : undefined,
  };
}

function serializedSvgSize(svg) {
  if (!svg || typeof svg.getAttribute !== "function") return {};
  const viewBox = String(svg.getAttribute("viewBox") ?? "").trim();
  if (viewBox) {
    const values = viewBox.split(/[\s,]+/).map(Number);
    if (
      values.length === 4 &&
      Number.isFinite(values[2]) &&
      values[2] > 0 &&
      Number.isFinite(values[3]) &&
      values[3] > 0
    ) {
      return { height: values[3], width: values[2] };
    }
  }
  return {
    height: asPositiveNumber(svg.getAttribute("height")),
    width: asPositiveNumber(svg.getAttribute("width")),
  };
}

function sizeIsStale(current, serialized) {
  if (!current || !serialized) return false;
  return (
    Math.abs(current - serialized) >
    Math.max(
      SERIALIZED_SVG_SIZE_TOLERANCE_PX,
      Math.max(current, serialized) * SERIALIZED_SVG_SIZE_TOLERANCE,
    )
  );
}

function serializedSvgIsStale(host, mount, svg) {
  const mountSize = measuredSize(mount);
  const hostSize = measuredSize(host);
  const currentWidth = mountSize.width ?? hostSize.width;
  const svgSize = serializedSvgSize(svg);
  if (!currentWidth || !svgSize.width) return true;
  if (sizeIsStale(currentWidth, svgSize.width)) return true;
  // The live mount is hidden before readiness, so only compare its height
  // after it is measurable. Host height can include the static fallback.
  return sizeIsStale(mountSize.height, svgSize.height);
}

function stopSerializedSvgWatcher(host) {
  host[SERIALIZED_SVG_WATCHER]?.disconnect?.();
  delete host[SERIALIZED_SVG_WATCHER];
}

function resetReady(host, mount) {
  stopSerializedSvgWatcher(host);
  delete host.dataset[READY_ATTRIBUTE];
  mount.setAttribute("aria-hidden", "true");
}

function markReady(host, mount) {
  if (!mount.querySelector(RENDERED_CHART_SELECTOR)) return false;
  host.dataset[READY_ATTRIBUTE] = "true";
  mount.removeAttribute("aria-hidden");
  return true;
}

function watchSerializedSvg(host, mount, svg, remount) {
  stopSerializedSvgWatcher(host);
  let finished = false;
  const verify = () => {
    if (finished || !serializedSvgIsStale(host, mount, svg)) return;
    finished = true;
    stopSerializedSvgWatcher(host);
    remount();
  };
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(verify);
    host[SERIALIZED_SVG_WATCHER] = observer;
    observer.observe(host);
    observer.observe(mount);
  }
  // markReady makes a previously hidden live mount measurable. Check once
  // immediately so a stale height is repaired even before a resize event.
  verify();
}

function mountChart(entry) {
  const id = String(entry.id ?? "").trim();
  if (!id) return;

  const host = document.querySelector('[data-recharts-chart="' + selectorEscape(id) + '"]');
  const mount = host?.querySelector("[data-recharts-live]");
  if (!(host instanceof HTMLElement) || !(mount instanceof HTMLElement)) return;

  const dataset = asObject(entry.dataset);
  const chartSpec = asObject(dataset.chart_spec);
  const type = String(entry.type ?? chartSpec.type ?? "bar");
  const options = {
    height: asPositiveNumber(entry.height) ?? 320,
    htmlReport: true,
    surface: "compact",
    width: asPositiveNumber(entry.width),
  };

  let remounted = false;
  const renderFresh = () => {
    if (remounted) return;
    remounted = true;
    resetReady(host, mount);
    try {
      renderRechartsChart(mount, dataset, type, options);
    } catch (error) {
      host.dataset.rechartsError = error instanceof Error ? error.message : "render failed";
      return;
    }

    let observer;
    const verify = () => {
      if (!markReady(host, mount)) return false;
      observer?.disconnect();
      return true;
    };
    if (typeof MutationObserver === "function") {
      observer = new MutationObserver(verify);
      observer.observe(mount, { childList: true, subtree: true });
      window.setTimeout(() => observer?.disconnect(), 5000);
    }
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        if (!verify()) window.setTimeout(verify, 0);
      });
    } else {
      window.setTimeout(verify, 0);
    }
  };

  // ChatGPT previews can serialize a completed live chart and execute this
  // module again. Reuse that work only while its SVG still matches this
  // viewport. A desktop-sized viewBox reused in a phone-width card gets
  // letterboxed into a tiny plot, so remount it once to restore Recharts'
  // normal resize path.
  const serializedSvg = mount.querySelector("svg");
  if (serializedSvg) {
    if (serializedSvgIsStale(host, mount, serializedSvg)) {
      renderFresh();
      return;
    } else if (markReady(host, mount)) {
      watchSerializedSvg(host, mount, serializedSvg, renderFresh);
      return;
    }
  } else if (markReady(host, mount)) {
    // Non-SVG renderers such as leaderboard and heatmap panels remain
    // responsive through their own CSS and do not need an SVG geometry check.
    return;
  }

  renderFresh();
}

function boot() {
  const payloadNode = document.getElementById(PAYLOAD_ID);
  if (!payloadNode) return;

  let payload;
  try {
    payload = JSON.parse(payloadNode.textContent || "{}");
  } catch {
    return;
  }

  for (const chart of asArray(asObject(payload).charts)) {
    mountChart(asObject(chart));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
