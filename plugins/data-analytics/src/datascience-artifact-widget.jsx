import React, { StrictMode, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { connectMcpWidgetHost } from "./mcp-host.js";
import AnalyticsApp from "./analytics-app/App";
import "./styles/codex-theme.css";
import "./analytics-app/tokens.css";
import "./analytics-app/charting/chart-tokens.css";
import "./analytics-app/styles.css";

const CHART_WIDGET_RESOURCE_URI = "ui://widget/datascience-chart.html";
const ARTIFACT_BLOCK_TYPES = new Set(["markdown", "metric-strip", "chart", "table", "html"]);
let chartWidgetHtmlPromise = null;

const artifactApp = connectMcpWidgetHost({
  name: "Data Analytics Artifact App",
  version: "0.1.8",
  availableDisplayModes: ["inline", "fullscreen"],
  initialDisplayMode: "fullscreen",
});

const fallbackPayload = {
  ok: true,
  widget_type: "artifact",
  surface: "report",
  manifest: {
    version: 1,
    surface: "report",
    title: "Weekly Revenue Performance",
    description: "Local regression showcase for metric cards, chart tooltips, and responsive tables.",
    generatedAt: "2026-07-08T00:00:00Z",
    blocks: [
      {
        id: "report_title",
        type: "markdown",
        layout: "full",
        body: "# Weekly Revenue Performance",
      },
      {
        id: "summary_text",
        type: "markdown",
        layout: "full",
        body:
          "## Executive Summary\n\nNet revenue reached **$1.05M** in the latest week, **3.8% above** the prior week and **4.8% above target**. Orders also reached a period high while refund rate stayed within its recent range.",
      },
      {
        id: "revenue_metrics",
        type: "metric-strip",
        layout: "full",
        cardIds: ["net_revenue_card", "target_attainment_card", "refund_rate_card", "completed_orders_card"],
      },
      {
        id: "trend_context",
        type: "markdown",
        layout: "full",
        body:
          "## Revenue stayed ahead of plan\n\nThe latest week extended the upward trend and preserved a positive gap to target. The chart separates actual revenue from the weekly plan so the comparison remains explicit.",
      },
      {
        id: "revenue_chart_block",
        type: "chart",
        layout: "full",
        chartId: "revenue_chart",
      },
      {
        id: "summary_table_context",
        type: "markdown",
        layout: "full",
        body:
          "## Weekly summary\n\nThis compact table intentionally has fewer columns than the report viewport. It should stretch to the available width instead of ending at its intrinsic content width.",
      },
      {
        id: "revenue_summary_table_block",
        type: "table",
        layout: "full",
        tableId: "revenue_summary_table",
      },
      {
        id: "detail_table_context",
        type: "markdown",
        layout: "full",
        body:
          "## Weekly audit detail\n\nThe detailed table keeps every reconciliation field. On narrower screens it should preserve readable columns and use contained horizontal scrolling.",
      },
      {
        id: "revenue_detail_table_block",
        type: "table",
        layout: "full",
        tableId: "revenue_detail_table",
      },
    ],
    cards: [
      {
        id: "net_revenue_card",
        description: "Settled revenue after discounts and refunds for the week starting June 29, 2026.",
        dataset: "latest_week",
        sourceId: "snapshot",
        metrics: [
          { label: "Net revenue · latest week", field: "net_revenue", format: "currency" },
          { label: "WoW", field: "revenue_wow", format: "percent", signed: true },
        ],
      },
      {
        id: "target_attainment_card",
        description: "Net revenue divided by the approved weekly target; the chip shows the dollar variance to that same target.",
        dataset: "latest_week",
        sourceId: "snapshot",
        metrics: [
          { label: "Target attainment", field: "attainment", format: "percent" },
          { label: "Variance", field: "variance", format: "currency", signed: true },
        ],
      },
      {
        id: "refund_rate_card",
        description: "Settled refund dollars divided by gross billings for the latest week.",
        dataset: "latest_week",
        sourceId: "snapshot",
        metrics: [
          { label: "Refund rate", field: "refund_rate", format: "percent" },
        ],
      },
      {
        id: "completed_orders_card",
        description: "Orders completed during the latest reporting week; the chip compares the same measure with the prior week.",
        dataset: "latest_week",
        sourceId: "snapshot",
        metrics: [
          { label: "Completed orders", field: "orders", format: "number" },
          { label: "WoW", field: "orders_wow", format: "percent", signed: true },
        ],
      },
    ],
    charts: [
      {
        id: "revenue_chart",
        title: "Net revenue vs target",
        subtitle: "Weekly net revenue remained above plan throughout the period",
        type: "line",
        dataset: "weekly_revenue_trend",
        sourceId: "snapshot",
        encodings: {
          x: { field: "week", type: "temporal" },
          y: { field: "revenue", type: "quantitative", label: "Revenue", format: "currency" },
          color: { field: "series", type: "nominal" },
        },
        valueFormat: "currency",
        layout: "full",
      },
    ],
    tables: [
      {
        id: "revenue_summary_table",
        title: "Weekly revenue summary",
        dataset: "weekly_detail",
        sourceId: "snapshot",
        defaultSort: { field: "week", direction: "desc" },
        columns: [
          { field: "week", label: "Week starting", type: "date" },
          { field: "net_revenue", label: "Net revenue", format: "currency" },
          { field: "attainment", label: "Attainment", format: "percent" },
          { field: "refund_rate", label: "Refund rate", format: "percent" },
        ],
      },
      {
        id: "revenue_detail_table",
        title: "Weekly revenue detail",
        dataset: "weekly_detail",
        sourceId: "snapshot",
        defaultSort: { field: "week", direction: "desc" },
        columns: [
          { field: "week", label: "Week starting", type: "date" },
          { field: "gross_billings", label: "Gross billings", format: "currency" },
          { field: "discounts", label: "Discounts", format: "currency" },
          { field: "settled_refunds", label: "Settled refunds", format: "currency" },
          { field: "net_revenue", label: "Net revenue", format: "currency" },
          { field: "target", label: "Target", format: "currency" },
          { field: "variance", label: "Variance", format: "currency", movement: true },
          { field: "attainment", label: "Attainment", format: "percent" },
          { field: "orders", label: "Orders", format: "number" },
          { field: "revenue_per_order", label: "Revenue / order", format: "currency" },
          { field: "refund_rate", label: "Refund rate", format: "percent" },
          { field: "revenue_wow", label: "WoW growth", format: "percent", movement: true },
        ],
      },
    ],
    sources: [{ id: "snapshot", label: "Synthetic weekly revenue fixture", path: "data/weekly-revenue.json" }],
  },
  snapshot: {
    version: 1,
    generatedAt: "2026-07-08T00:00:00Z",
    status: "fixture",
    datasets: {
      latest_week: [
        {
          attainment: 1.048,
          net_revenue: 1048000,
          orders: 5120,
          orders_wow: 0.0396,
          refund_rate: 0.032,
          revenue_wow: 0.038,
          variance: 48000,
          week: "2026-06-29",
        },
      ],
      weekly_revenue_trend: [
        { week: "2026-04-13", series: "Actual", revenue: 790000 },
        { week: "2026-04-20", series: "Actual", revenue: 820000 },
        { week: "2026-04-27", series: "Actual", revenue: 845000 },
        { week: "2026-05-04", series: "Actual", revenue: 862000 },
        { week: "2026-05-11", series: "Actual", revenue: 890000 },
        { week: "2026-05-18", series: "Actual", revenue: 905000 },
        { week: "2026-05-25", series: "Actual", revenue: 918000 },
        { week: "2026-06-01", series: "Actual", revenue: 940000 },
        { week: "2026-06-08", series: "Actual", revenue: 955000 },
        { week: "2026-06-15", series: "Actual", revenue: 972000 },
        { week: "2026-06-22", series: "Actual", revenue: 1010000 },
        { week: "2026-06-29", series: "Actual", revenue: 1048000 },
        { week: "2026-04-13", series: "Target", revenue: 780000 },
        { week: "2026-04-20", series: "Target", revenue: 800000 },
        { week: "2026-04-27", series: "Target", revenue: 820000 },
        { week: "2026-05-04", series: "Target", revenue: 840000 },
        { week: "2026-05-11", series: "Target", revenue: 860000 },
        { week: "2026-05-18", series: "Target", revenue: 880000 },
        { week: "2026-05-25", series: "Target", revenue: 900000 },
        { week: "2026-06-01", series: "Target", revenue: 920000 },
        { week: "2026-06-08", series: "Target", revenue: 940000 },
        { week: "2026-06-15", series: "Target", revenue: 960000 },
        { week: "2026-06-22", series: "Target", revenue: 980000 },
        { week: "2026-06-29", series: "Target", revenue: 1000000 },
      ],
      weekly_detail: [
        { week: "2026-06-29", gross_billings: 1112000, discounts: 29000, settled_refunds: 35000, net_revenue: 1048000, target: 1000000, variance: 48000, attainment: 1.048, orders: 5120, revenue_per_order: 204.69, refund_rate: 0.032, revenue_wow: 0.038 },
        { week: "2026-06-22", gross_billings: 1068000, discounts: 28000, settled_refunds: 30000, net_revenue: 1010000, target: 980000, variance: 30000, attainment: 1.031, orders: 4925, revenue_per_order: 205.08, refund_rate: 0.029, revenue_wow: 0.039 },
        { week: "2026-06-15", gross_billings: 1029000, discounts: 27000, settled_refunds: 30000, net_revenue: 972000, target: 960000, variance: 12000, attainment: 1.013, orders: 4740, revenue_per_order: 205.06, refund_rate: 0.03, revenue_wow: 0.018 },
        { week: "2026-06-08", gross_billings: 1012000, discounts: 26000, settled_refunds: 31000, net_revenue: 955000, target: 940000, variance: 15000, attainment: 1.016, orders: 4660, revenue_per_order: 204.94, refund_rate: 0.031, revenue_wow: 0.016 },
        { week: "2026-06-01", gross_billings: 995000, discounts: 26000, settled_refunds: 29000, net_revenue: 940000, target: 920000, variance: 20000, attainment: 1.022, orders: 4575, revenue_per_order: 205.46, refund_rate: 0.03, revenue_wow: 0.024 },
        { week: "2026-05-25", gross_billings: 970000, discounts: 25000, settled_refunds: 27000, net_revenue: 918000, target: 900000, variance: 18000, attainment: 1.02, orders: 4460, revenue_per_order: 205.83, refund_rate: 0.029, revenue_wow: 0.014 },
        { week: "2026-05-18", gross_billings: 958000, discounts: 24000, settled_refunds: 29000, net_revenue: 905000, target: 880000, variance: 25000, attainment: 1.028, orders: 4380, revenue_per_order: 206.62, refund_rate: 0.031, revenue_wow: 0.017 },
        { week: "2026-05-11", gross_billings: 941000, discounts: 24000, settled_refunds: 27000, net_revenue: 890000, target: 860000, variance: 30000, attainment: 1.035, orders: 4315, revenue_per_order: 206.26, refund_rate: 0.029, revenue_wow: 0.032 },
        { week: "2026-05-04", gross_billings: 909000, discounts: 23000, settled_refunds: 24000, net_revenue: 862000, target: 840000, variance: 22000, attainment: 1.026, orders: 4210, revenue_per_order: 204.75, refund_rate: 0.027, revenue_wow: 0.02 },
        { week: "2026-04-27", gross_billings: 891000, discounts: 23000, settled_refunds: 23000, net_revenue: 845000, target: 820000, variance: 25000, attainment: 1.03, orders: 4140, revenue_per_order: 204.11, refund_rate: 0.026, revenue_wow: 0.03 },
        { week: "2026-04-20", gross_billings: 867000, discounts: 22000, settled_refunds: 25000, net_revenue: 820000, target: 800000, variance: 20000, attainment: 1.025, orders: 4050, revenue_per_order: 202.47, refund_rate: 0.03, revenue_wow: 0.038 },
        { week: "2026-04-13", gross_billings: 836000, discounts: 21000, settled_refunds: 25000, net_revenue: 790000, target: 780000, variance: 10000, attainment: 1.013, orders: 3970, revenue_per_order: 198.99, refund_rate: 0.031, revenue_wow: null },
      ],
    },
  },
  package_info: {
    manifestPath: "tool payload",
    root: "mcp://datascience-artifact",
    snapshotPath: "tool payload",
  },
};

const hostedEmptyPayload = {
  ok: false,
  widget_type: "artifact",
  surface: "report",
  manifest: {
    version: 1,
    surface: "report",
    title: "Data Analytics artifact",
    description: "Waiting for an artifact payload.",
    blocks: [
      {
        id: "empty_state",
        type: "markdown",
        layout: "full",
        body:
          "## Waiting for Data\n\nThis hosted artifact has not received a manifest and bounded snapshot yet.",
      },
    ],
    sources: [],
  },
  snapshot: {
    version: 1,
    status: "blocked",
    datasets: {},
    accessIssues: [
      {
        id: "missing_artifact_payload",
        message: "The hosted widget has not received a Data Analytics artifact payload yet.",
      },
    ],
  },
  sources: [],
  package_info: {
    manifestPath: "tool payload",
    root: "mcp://datascience-artifact",
    snapshotPath: "tool payload",
  },
};

function createMemoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      const normalizedKey = String(key);
      return values.has(normalizedKey) ? values.get(normalizedKey) : null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

function storageWorks(storage) {
  if (!storage) return false;
  const key = "__datascience_artifact_storage_probe__";
  try {
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function installStorageFallback() {
  if (typeof window === "undefined") return;
  try {
    if (storageWorks(window.localStorage)) return;
  } catch {
    // Accessing localStorage can throw in sandboxed MCP iframes.
  }

  const storage = window.__datascienceArtifactMemoryStorage || createMemoryStorage();
  window.__datascienceArtifactMemoryStorage = storage;
  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
  } catch {
    // If the host prevents overriding localStorage, the fallback is still
    // available for future wrapper code through __datascienceArtifactMemoryStorage.
  }
}

function isArtifactPayload(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.widget_type === "artifact" &&
      value.manifest &&
      value.snapshot,
  );
}

function decodePayload(raw) {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickPayload(raw) {
  raw = decodePayload(raw);
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw.content)) {
    for (const item of raw.content) {
      const found = pickPayload(item && (item.text || item));
      if (found) return found;
    }
  }
  if (isArtifactPayload(raw)) return raw;
  if (raw.structuredContent && typeof raw.structuredContent === "object") {
    return pickPayload(raw.structuredContent);
  }
  if (raw.payload && typeof raw.payload === "object") {
    return pickPayload(raw.payload);
  }
  if (raw.toolOutput && typeof raw.toolOutput === "object") {
    return pickPayload(raw.toolOutput);
  }
  if (raw.toolResponseMetadata && typeof raw.toolResponseMetadata === "object") {
    return pickPayload(raw.toolResponseMetadata);
  }
  if (raw.detail && typeof raw.detail === "object") return pickPayload(raw.detail);
  if (raw.globals && typeof raw.globals === "object") return pickPayload(raw.globals);
  return null;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwn(value, key) {
  return isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function validateDatasetRows(rows, path, issues) {
  if (!Array.isArray(rows)) {
    issues.push(`${path} must be an array of row objects.`);
    return [];
  }
  rows.forEach((row, index) => {
    if (!isPlainObject(row)) {
      issues.push(`${path}[${index}] must be an object.`);
    }
  });
  return rows.filter(isPlainObject);
}

function validateFieldReference(rows, field, path, issues) {
  if (typeof field !== "string" || !field.trim()) {
    issues.push(`${path} must be a non-empty field name.`);
    return;
  }
  if (!rows.length) return;
  if (!rows.some((row) => hasOwn(row, field))) {
    issues.push(`${path} references "${field}", but no sampled row contains that field.`);
  }
}

function chartEncoding(chart, role) {
  return isPlainObject(chart.encodings) && isPlainObject(chart.encodings[role]) ? chart.encodings[role] : {};
}

function chartEncodingField(chart, role) {
  const field = chartEncoding(chart, role).field;
  return typeof field === "string" && field.trim() ? field : null;
}

function chartEncodingFields(chart, role) {
  const fields = chartEncoding(chart, role).fields;
  return Array.isArray(fields) ? fields.filter((field) => typeof field === "string" && field.trim()) : [];
}

function hasChartEncodingSpec(chart) {
  return Boolean(
    isPlainObject(chart.encodings) &&
      chartEncodingField(chart, "x") &&
      (chartEncodingField(chart, "y") || chartEncodingFields(chart, "y").length),
  );
}

function validateEncodedChartFields(rows, chart, path, issues) {
  if (chart.xField != null) {
    issues.push(`${path}.xField is not supported for artifact charts; use encodings.`);
  }
  if (chart.series != null) {
    issues.push(`${path}.series is not supported for artifact charts; use encodings.`);
  }
  if (!hasChartEncodingSpec(chart)) {
    issues.push(`${path}.encodings must declare x and y fields before rendering.`);
    return;
  }
  validateFieldReference(rows, chartEncodingField(chart, "x"), `${path}.encodings.x.field`, issues);
  const yField = chartEncodingField(chart, "y");
  if (yField) validateFieldReference(rows, yField, `${path}.encodings.y.field`, issues);
  chartEncodingFields(chart, "y").forEach((field, fieldIndex) => {
    validateFieldReference(rows, field, `${path}.encodings.y.fields[${fieldIndex}]`, issues);
  });
  ["color", "size", "facet", "label"].forEach((role) => {
    const field = chartEncodingField(chart, role);
    if (field) validateFieldReference(rows, field, `${path}.encodings.${role}.field`, issues);
  });
}

function validateArtifactPayload(payload) {
  const issues = [];
  if (!isPlainObject(payload)) {
    return ["Artifact payload must be an object."];
  }

  const manifest = payload.manifest;
  const snapshot = payload.snapshot;
  if (!isPlainObject(manifest)) issues.push("manifest must be an object.");
  if (!isPlainObject(snapshot)) issues.push("snapshot must be an object.");
  if (!isPlainObject(manifest) || !isPlainObject(snapshot)) return issues;
  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    issues.push("manifest.title is required for artifact rendering.");
  }

  const datasets = snapshot.datasets;
  if (!isPlainObject(datasets)) {
    issues.push("snapshot.datasets must be an object keyed by dataset id.");
  }
  const datasetRows = new Map();
  if (isPlainObject(datasets)) {
    Object.entries(datasets).forEach(([datasetId, rows]) => {
      datasetRows.set(datasetId, validateDatasetRows(rows, `snapshot.datasets.${datasetId}`, issues));
    });
  }

  const blocks = manifest.blocks;
  if (!Array.isArray(blocks)) issues.push("manifest.blocks must be an array.");

  if (Array.isArray(blocks)) {
    blocks.forEach((block, index) => {
      if (!isPlainObject(block)) {
        issues.push(`manifest.blocks[${index}] must be an object.`);
        return;
      }
      if (typeof block.id !== "string" || !block.id.trim()) {
        issues.push(`manifest.blocks[${index}].id must be a non-empty string.`);
      }
      if (typeof block.type !== "string" || !block.type.trim()) {
        issues.push(`manifest.blocks[${index}].type must be a non-empty string.`);
      } else if (!ARTIFACT_BLOCK_TYPES.has(block.type)) {
        issues.push(`manifest.blocks[${index}].type is not supported.`);
      }
      if (block.type === "markdown" && (typeof block.body !== "string" || !block.body.trim())) {
        issues.push(`manifest.blocks[${index}].body must be a non-empty Markdown string.`);
      }
      if (block.type === "html" && (typeof block.body !== "string" || !block.body.trim())) {
        issues.push(`manifest.blocks[${index}].body must be a non-empty HTML string.`);
      }
    });
  }

  const charts = Array.isArray(manifest.charts) ? manifest.charts : [];
  const chartIds = new Set();
  if (manifest.charts != null && !Array.isArray(manifest.charts)) {
    issues.push("manifest.charts must be an array when provided.");
  }
  charts.forEach((chart, index) => {
    const path = `manifest.charts[${index}]`;
    if (!isPlainObject(chart)) {
      issues.push(`${path} must be an object.`);
      return;
    }
    if (typeof chart.id !== "string" || !chart.id.trim()) {
      issues.push(`${path}.id must be a non-empty string.`);
    } else {
      chartIds.add(chart.id);
    }
    if (typeof chart.dataset !== "string" || !chart.dataset.trim()) {
      issues.push(`${path}.dataset must be a non-empty string.`);
      return;
    }
    const rows = datasetRows.get(chart.dataset);
    if (!rows) {
      issues.push(`${path}.dataset references missing dataset "${chart.dataset}".`);
      return;
    }
    validateEncodedChartFields(rows, chart, path, issues);
  });

  const cards = Array.isArray(manifest.cards) ? manifest.cards : [];
  const cardIds = new Set();
  if (manifest.cards != null && !Array.isArray(manifest.cards)) {
    issues.push("manifest.cards must be an array when provided.");
  }
  cards.forEach((card, index) => {
    const path = `manifest.cards[${index}]`;
    if (!isPlainObject(card)) {
      issues.push(`${path} must be an object.`);
      return;
    }
    if (typeof card.id !== "string" || !card.id.trim()) {
      issues.push(`${path}.id must be a non-empty string.`);
    } else {
      cardIds.add(card.id);
    }
    if (typeof card.dataset !== "string" || !card.dataset.trim()) {
      issues.push(`${path}.dataset must be a non-empty string.`);
      return;
    }
    const rows = datasetRows.get(card.dataset);
    if (!rows) {
      issues.push(`${path}.dataset references missing dataset "${card.dataset}".`);
      return;
    }
    ["valueField", "format", "label", "title", "indicators", "deltaField", "deltaLabel"].forEach((removedField) => {
      if (hasOwn(card, removedField)) {
        issues.push(`${path}.${removedField} is not supported; use metrics[].`);
      }
    });
    if (!Array.isArray(card.metrics) || !card.metrics.length) {
      issues.push(`${path}.metrics must contain at least one metric.`);
    }
    const metrics = Array.isArray(card.metrics) ? card.metrics : [];
    metrics.forEach((metric, metricIndex) => {
      const metricPath = `${path}.metrics[${metricIndex}]`;
      if (!isPlainObject(metric)) {
        issues.push(`${metricPath} must be an object.`);
        return;
      }
      if (typeof metric.label !== "string" || !metric.label.trim()) {
        issues.push(`${metricPath}.label must be a non-empty string.`);
      }
      validateFieldReference(rows, metric.field, `${metricPath}.field`, issues);
      if (metric.format != null && typeof metric.format !== "string") {
        issues.push(`${metricPath}.format must be a string when provided.`);
      }
      if (metric.signed != null && typeof metric.signed !== "boolean") {
        issues.push(`${metricPath}.signed must be a boolean when provided.`);
      }
      if (hasOwn(metric, "movement")) {
        issues.push(`${metricPath}.movement is not supported; use signed.`);
      }
    });
  });

  const tables = Array.isArray(manifest.tables) ? manifest.tables : [];
  const tableIds = new Set();
  if (manifest.tables != null && !Array.isArray(manifest.tables)) {
    issues.push("manifest.tables must be an array when provided.");
  }
  tables.forEach((table, index) => {
    const path = `manifest.tables[${index}]`;
    if (!isPlainObject(table)) {
      issues.push(`${path} must be an object.`);
      return;
    }
    if (typeof table.id !== "string" || !table.id.trim()) {
      issues.push(`${path}.id must be a non-empty string.`);
    } else {
      tableIds.add(table.id);
    }
    if (typeof table.dataset !== "string" || !table.dataset.trim()) {
      issues.push(`${path}.dataset must be a non-empty string.`);
      return;
    }
    const rows = datasetRows.get(table.dataset);
    if (!rows) {
      issues.push(`${path}.dataset references missing dataset "${table.dataset}".`);
      return;
    }
    if (!Array.isArray(table.columns) || !table.columns.length) {
      issues.push(`${path}.columns must be a non-empty array.`);
      return;
    }
    const columnFields = new Set();
    table.columns.forEach((column, columnIndex) => {
      if (!isPlainObject(column)) {
        issues.push(`${path}.columns[${columnIndex}] must be an object.`);
        return;
      }
      validateFieldReference(rows, column.field, `${path}.columns[${columnIndex}].field`, issues);
      if (typeof column.field === "string" && column.field) {
        columnFields.add(column.field);
      }
    });
    if (table.defaultSort != null) {
      if (!isPlainObject(table.defaultSort)) {
        issues.push(`${path}.defaultSort must be an object.`);
      } else {
        if (!columnFields.has(table.defaultSort.field)) {
          issues.push(`${path}.defaultSort.field must reference a declared table column.`);
        }
        if (!["asc", "desc"].includes(table.defaultSort.direction)) {
          issues.push(`${path}.defaultSort.direction must be asc or desc.`);
        }
      }
    }
  });

  if (Array.isArray(blocks)) {
    blocks.forEach((block, index) => {
      if (!isPlainObject(block)) return;
      if (block.type === "chart" && !chartIds.has(block.chartId)) {
        issues.push(`manifest.blocks[${index}].chartId references a missing chart.`);
      }
      if (block.type === "metric-strip") {
        if (!Array.isArray(block.cardIds) || !block.cardIds.length) {
          issues.push(`manifest.blocks[${index}].cardIds must reference at least one metric card.`);
        } else {
          block.cardIds.forEach((cardId, cardIndex) => {
            if (!cardIds.has(cardId)) {
              issues.push(`manifest.blocks[${index}].cardIds[${cardIndex}] references a missing metric card.`);
            }
          });
        }
      }
      if (block.type === "table" && !tableIds.has(block.tableId)) {
        issues.push(`manifest.blocks[${index}].tableId references a missing table.`);
      }
    });
  }

  return issues;
}

function InvalidArtifactPayload({ issues, surface }) {
  const visibleIssues = Array.isArray(issues) ? issues.slice(0, 8) : [];
  const issueCount = Array.isArray(issues) ? issues.length : visibleIssues.length;
  const artifactLabel =
    surface === "dashboard" || surface === "report" ? surface : "artifact";
  return (
    <main
      style={{
        background: "#fff",
        color: "#111827",
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          maxWidth: 760,
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 18, lineHeight: "24px", margin: "0 0 8px" }}>
          Artifact validation failed
        </h1>
        <p style={{ color: "#4b5563", fontSize: 14, lineHeight: "20px", margin: "0 0 16px" }}>
          The {artifactLabel} was blocked before rendering because its manifest or snapshot does not match
          the Data Analytics artifact contract.
        </p>
        <ul style={{ color: "#374151", fontSize: 13, lineHeight: "20px", margin: 0, paddingLeft: 20 }}>
          {visibleIssues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
        {issueCount > visibleIssues.length ? (
          <p style={{ color: "#6b7280", fontSize: 12, margin: "12px 0 0" }}>
            {issueCount - visibleIssues.length} more validation issue
            {issueCount - visibleIssues.length === 1 ? "" : "s"} hidden.
          </p>
        ) : null}
      </section>
    </main>
  );
}

function currentHostPayload() {
  if (typeof window === "undefined") return null;
  return (
    pickPayload(window.openai?.toolOutput) ||
    pickPayload(window.openai?.toolResponseMetadata) ||
    pickPayload(window.openai)
  );
}

function fallbackForEnvironment() {
  if (typeof window !== "undefined" && window.openai) return hostedEmptyPayload;
  return fallbackPayload;
}

function artifactIdentity(payload) {
  const manifest = payload?.manifest || {};
  const snapshot = payload?.snapshot || {};
  return [
    manifest.title || "artifact",
    manifest.generatedAt || "",
    snapshot.generatedAt || "",
    payload?.surface || manifest.surface || "artifact",
  ].join(":");
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function textResponse(body, init = {}) {
  return new Response(String(body ?? ""), {
    status: init.status || 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function htmlResponse(body, init = {}) {
  return new Response(String(body ?? ""), {
    status: init.status || 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function readChartWidgetHtml() {
  if (!chartWidgetHtmlPromise) {
    chartWidgetHtmlPromise = (async () => {
      await artifactApp.ready;
      const resource = await artifactApp.readServerResource({
        uri: CHART_WIDGET_RESOURCE_URI,
      });
      const content = Array.isArray(resource?.contents)
        ? resource.contents.find((entry) => typeof entry?.text === "string")
        : null;
      if (!content?.text) {
        throw new Error("The shared chart detail resource did not include HTML.");
      }
      return content.text;
    })();
  }
  return chartWidgetHtmlPromise;
}

function sourceTextForPath(payload, sourcePath) {
  const manifestSources = Array.isArray(payload?.manifest?.sources)
    ? payload.manifest.sources
    : [];
  const inlineSources = Array.isArray(payload?.sources) ? payload.sources : [];
  const declared = [...manifestSources, ...inlineSources].find((source) => {
    if (!source || typeof source !== "object") return false;
    return source.path === sourcePath || source.id === sourcePath || source.href === sourcePath;
  });
  if (typeof declared?.query?.sql === "string") return declared.query.sql;
  return null;
}

function installMcpFetchShim(payload) {
  window.__datascienceArtifactPayload = payload;
  if (window.__datascienceArtifactFetchShimInstalled) return;

  const nativeFetch = window.fetch.bind(window);
  window.__datascienceArtifactFetchShimInstalled = true;
  window.fetch = async (input, init) => {
    const requestUrl = typeof input === "string" ? input : input?.url;
    const url = new URL(requestUrl || "", window.location.origin);
    const currentPayload = window.__datascienceArtifactPayload || fallbackForEnvironment();

    if (url.origin === window.location.origin && url.pathname === "/api/manifest") {
      return jsonResponse(currentPayload.manifest || {});
    }
    if (url.origin === window.location.origin && url.pathname === "/api/snapshot") {
      return jsonResponse(currentPayload.snapshot || {});
    }
    if (url.origin === window.location.origin && url.pathname === "/api/package") {
      return jsonResponse(
        currentPayload.package_info ||
          currentPayload.packageInfo || {
            manifestPath: "tool payload",
            root: "mcp://datascience-artifact",
            snapshotPath: "tool payload",
          },
      );
    }
    if (url.origin === window.location.origin && url.pathname === "/api/inline-chart-widget") {
      try {
        return htmlResponse(await readChartWidgetHtml());
      } catch (error) {
        return textResponse(error instanceof Error ? error.message : "Inline chart widget asset is unavailable.", {
          status: 503,
        });
      }
    }
    if (
      url.origin === window.location.origin &&
      (url.pathname === "/api/source-file" || url.pathname === "/api/source")
    ) {
      const sourcePath = url.searchParams.get("path") || "";
      const text = sourceTextForPath(currentPayload, sourcePath);
      if (text != null) return textResponse(text);
      return textResponse("Source text was not included in this hosted artifact.", {
        status: 404,
      });
    }

    return nativeFetch(input, init);
  };
}

function displayModeFromPayload(payload) {
  return (
    normalizeDisplayMode(
      payload?.displayMode ||
        payload?.display_mode ||
        payload?.manifest?.displayMode ||
        payload?.manifest?.display_mode,
    ) || "inline"
  );
}

function normalizeDisplayMode(mode) {
  return mode === "inline" || mode === "fullscreen" || mode === "pip" ? mode : "";
}

function readUrlDisplayMode() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const raw = (
      params.get("displayMode") ||
      params.get("display_mode") ||
      params.get("preview") ||
      hashParams.get("displayMode") ||
      hashParams.get("display_mode") ||
      hashParams.get("preview") ||
      ""
    ).toLowerCase();
    if (raw === "fullscreen" || raw === "full" || raw === "expanded") return "fullscreen";
    if (raw === "inline" || raw === "compact") return "inline";
  } catch {
    // Ignore malformed URLs from host previews.
  }
  return "";
}

function pickDisplayMode(raw) {
  const value = decodePayload(raw);
  if (!value || typeof value !== "object") return "";
  if (value.type === "datascience-chart-widget-display-mode") return "";
  return normalizeDisplayMode(
    value.displayMode ||
      value.display_mode ||
      value.mode ||
      value.view?.displayMode ||
      value.hostContext?.displayMode ||
      value.host?.displayMode ||
      value.globals?.displayMode ||
      value.globals?.view?.displayMode ||
      value.globals?.hostContext?.displayMode,
  );
}

function currentHostDisplayMode() {
  if (typeof window === "undefined") return "inline";
  const hostApi = window.openai || {};
  return (
    readUrlDisplayMode() ||
    normalizeDisplayMode(
      hostApi.displayMode ||
        hostApi.view?.displayMode ||
        hostApi.hostContext?.displayMode ||
        hostApi.host?.displayMode,
    ) ||
    "inline"
  );
}

function hostSupportsDisplayMode() {
  if (typeof window === "undefined") return false;
  const hostApi = window.openai || {};
  const availableDisplayModes =
    hostApi.availableDisplayModes ||
    hostApi.hostContext?.availableDisplayModes ||
    hostApi.view?.availableDisplayModes;
  if (Array.isArray(availableDisplayModes) && availableDisplayModes.includes("fullscreen")) {
    return true;
  }
  return Boolean(window.openai) || typeof hostApi.requestDisplayMode === "function";
}

function applyDocumentDisplayMode(mode) {
  if (typeof document === "undefined") return;
  const normalized = normalizeDisplayMode(mode) || "inline";
  document.documentElement.dataset.displayMode = normalized;
  document.body.dataset.displayMode = normalized;
}

function useHostPayload() {
  const [payload, setPayload] = useState(() => currentHostPayload() || fallbackForEnvironment());

  useEffect(() => {
    function apply(raw) {
      const next = pickPayload(raw);
      if (next) setPayload(next);
    }
    function handleMessage(event) {
      apply(event.data);
    }
    function handleToolResult(event) {
      apply(event.detail);
    }
    function handleGlobals(event) {
      apply(event.detail?.globals);
    }

    apply(currentHostPayload());
    window.addEventListener("message", handleMessage);
    window.addEventListener("datascience-widget-tool-result", handleToolResult);
    window.addEventListener("openai:set_globals", handleGlobals);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("datascience-widget-tool-result", handleToolResult);
      window.removeEventListener("openai:set_globals", handleGlobals);
    };
  }, []);

  return payload;
}

function useHostDisplayMode() {
  const [displayMode, setDisplayMode] = useState(() => currentHostDisplayMode());

  useEffect(() => {
    function apply(raw) {
      const next = pickDisplayMode(raw);
      if (next) setDisplayMode(next);
    }
    function handleMessage(event) {
      apply(event.data);
    }
    function handleGlobals(event) {
      apply(event.detail?.globals || event.detail);
    }

    setDisplayMode(currentHostDisplayMode());
    applyDocumentDisplayMode(currentHostDisplayMode());
    window.addEventListener("message", handleMessage);
    window.addEventListener("openai:set_globals", handleGlobals);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("openai:set_globals", handleGlobals);
    };
  }, []);

  useEffect(() => {
    applyDocumentDisplayMode(displayMode);
  }, [displayMode]);

  return { displayMode, setDisplayMode };
}

async function requestArtifactDisplayMode(mode, setDisplayMode) {
  const requestDisplayMode = window.openai?.requestDisplayMode;
  if (typeof requestDisplayMode !== "function") return { mode: currentHostDisplayMode() };

  try {
    const result = await Promise.resolve(requestDisplayMode({ mode }));
    const resultMode = normalizeDisplayMode(result?.mode || result?.displayMode);
    if (resultMode) {
      setDisplayMode(resultMode);
      applyDocumentDisplayMode(resultMode);
      return result;
    }
  } catch {
    const currentMode = currentHostDisplayMode();
    setDisplayMode(currentMode);
    applyDocumentDisplayMode(currentMode);
  }
  return { mode: currentHostDisplayMode() };
}

function ArtifactApp() {
  const payload = useHostPayload();
  const surface = payload?.surface || payload?.manifest?.surface;
  const identity = useMemo(() => artifactIdentity(payload), [payload]);
  const validationIssues = useMemo(() => validateArtifactPayload(payload), [identity, payload]);
  const { displayMode, setDisplayMode } = useHostDisplayMode();
  const requestedDisplayMode = useMemo(() => displayModeFromPayload(payload), [identity, payload]);
  const hasFullscreenArtifactSurface = surface === "report" || surface === "dashboard";
  const canRequestFullscreen =
    hasFullscreenArtifactSurface && hostSupportsDisplayMode() && displayMode !== "fullscreen";
  const requestFullscreen = canRequestFullscreen
    ? () => {
        void requestArtifactDisplayMode("fullscreen", setDisplayMode);
      }
    : undefined;

  useLayoutEffect(() => {
    installMcpFetchShim(payload);
  }, [payload]);

  useEffect(() => {
    const mode = requestedDisplayMode;
    if (mode === "inline") return;
    const requestDisplayMode = window.openai?.requestDisplayMode;
    if (typeof requestDisplayMode !== "function") return;
    try {
      void Promise.resolve(requestDisplayMode({ mode }))
        .then((result) => {
          const resultMode = normalizeDisplayMode(result?.mode || result?.displayMode);
          if (resultMode) {
            setDisplayMode(resultMode);
            applyDocumentDisplayMode(resultMode);
          }
        })
        .catch(() => {
          // Hosts may decline fullscreen/pip; the compact artifact launcher remains inline.
        });
    } catch {
      // Some hosts expose requestDisplayMode as a fire-and-forget function.
    }
  }, [identity, requestedDisplayMode, setDisplayMode]);

  if (validationIssues.length) {
    return <InvalidArtifactPayload issues={validationIssues} surface={surface} />;
  }

  return (
    <ArtifactErrorBoundary surface={surface}>
      <div className="datascience-artifact-shell" data-display-mode={displayMode}>
        <AnalyticsApp
          key={identity}
          displayMode={displayMode === "fullscreen" ? "fullscreen" : "inline"}
          onRequestFullscreen={requestFullscreen}
        />
      </div>
    </ArtifactErrorBoundary>
  );
}

class ArtifactErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message =
        this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
      return (
        <InvalidArtifactPayload
          issues={[`Unexpected render failure: ${message}`]}
          surface={this.props.surface}
        />
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

installStorageFallback();

createRoot(root).render(
  <StrictMode>
    <ArtifactErrorBoundary>
      <ArtifactApp />
    </ArtifactErrorBoundary>
  </StrictMode>,
);
