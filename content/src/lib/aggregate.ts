// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Pure, framework-free helpers that turn raw CSV rows into chart-ready
// shapes. Ported verbatim from the tf_btp_info Astro site; the row types are
// inlined here (instead of imported) so the module is self-contained and the
// tests in aggregate.test.ts run under tsx without path-alias resolution.

export type ProviderTotalsRow = {
  date_retrieval: string;
  this_week: number;
  this_month: number;
  this_year: number;
  all_time: number;
};

export type ProviderVersionsRow = {
  date_retrieval: string;
  version: string;
  this_week: number;
  this_month: number;
  this_year: number;
  all_time: number;
};

export type ExporterRow = {
  date_retrieval: string;
  release: string;
  binary: string;
  download_count: number;
};

export type ModuleRow = {
  date_retrieval: string;
  downloads: number;
};


const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const fullFmt = new Intl.NumberFormat("en");

export const fmt = {
  compact: (n: number) => compactFmt.format(n),
  full: (n: number) => fullFmt.format(n),
};

export type TimePoint = { x: number; y: number };

export function monthKey(iso: string): string {
  // Extracts "YYYY-MM" without going through Date so timezones never bite.
  return iso.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en", { month: "short", year: "2-digit" });
}

// Cumulative line: (x = epoch ms, y = all_time). Sorted ascending.
export function cumulativeFromTotals(rows: ProviderTotalsRow[]): TimePoint[] {
  return rows
    .filter((r) => r.date_retrieval && Number.isFinite(r.all_time))
    .map((r) => ({ x: Date.parse(r.date_retrieval), y: r.all_time }))
    .sort((a, b) => a.x - b.x);
}

// Per-month bar: take the last snapshot per month and use this_month.
export function monthlyFromTotals(rows: ProviderTotalsRow[]): { label: string; value: number }[] {
  const byMonth = new Map<string, { ts: number; value: number }>();
  for (const r of rows) {
    if (!r.date_retrieval || !Number.isFinite(r.this_month)) continue;
    const key = monthKey(r.date_retrieval);
    const ts = Date.parse(r.date_retrieval);
    const prev = byMonth.get(key);
    if (!prev || ts >= prev.ts) byMonth.set(key, { ts, value: r.this_month });
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ label: monthLabel(key), value: v.value }));
}

// Per-version pie: latest snapshot per version, Top-N + "Other".
export function versionsTopN(
  rows: ProviderVersionsRow[],
  field: "this_month" | "this_year" | "all_time",
  topN: number | "all",
): { labels: string[]; values: number[] } {
  const latest = new Map<string, { ts: number; value: number }>();
  for (const r of rows) {
    if (!r.version || !Number.isFinite(r[field])) continue;
    const ts = r.date_retrieval ? Date.parse(r.date_retrieval) : 0;
    const prev = latest.get(r.version);
    if (!prev || ts >= prev.ts) latest.set(r.version, { ts, value: r[field] });
  }
  const entries = [...latest.entries()]
    .map(([version, v]) => ({ version, value: v.value }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
  const n = topN === "all" ? entries.length : topN;
  const top = entries.slice(0, n);
  const rest = entries.slice(n);
  const labels = top.map((e) => e.version);
  const values = top.map((e) => e.value);
  if (rest.length) {
    labels.push(`Other (${rest.length})`);
    values.push(rest.reduce((s, e) => s + e.value, 0));
  }
  return { labels, values };
}

// Exporter: per (date, binary) keep latest, sum download_count per date.
export function exporterCumulative(rows: ExporterRow[]): TimePoint[] {
  const latestByKey = new Map<string, { ts: number; row: ExporterRow }>();
  for (const r of rows) {
    if (!r.date_retrieval || !r.binary) continue;
    const key = `${r.date_retrieval}|${r.binary}`;
    const ts = Date.parse(r.date_retrieval);
    const prev = latestByKey.get(key);
    // >= so same-timestamp re-runs overwrite; matches exporterByRelease.
    if (!prev || ts >= prev.ts) latestByKey.set(key, { ts, row: r });
  }
  const byDate = new Map<string, number>();
  for (const { row: r } of latestByKey.values()) {
    byDate.set(r.date_retrieval, (byDate.get(r.date_retrieval) ?? 0) + (r.download_count ?? 0));
  }
  return [...byDate.entries()]
    .map(([d, total]) => ({ x: Date.parse(d), y: total }))
    .sort((a, b) => a.x - b.x);
}

// Exporter: derive monthly deltas from the cumulative trend.
export function exporterMonthly(rows: ExporterRow[]): { label: string; value: number }[] {
  const cum = exporterCumulative(rows);
  // Last cumulative value per month.
  const byMonth = new Map<string, number>();
  for (const p of cum) {
    const key = monthKey(new Date(p.x).toISOString());
    byMonth.set(key, p.y);
  }
  const months = [...byMonth.keys()].sort();
  const out: { label: string; value: number }[] = [];
  let prev = 0;
  for (const k of months) {
    const cur = byMonth.get(k)!;
    out.push({ label: monthLabel(k), value: Math.max(0, cur - prev) });
    prev = cur;
  }
  return out;
}

// Exporter: per release total (latest per (release, binary), sum per release).
export function exporterByRelease(rows: ExporterRow[]): { labels: string[]; values: number[] } {
  const latest = new Map<string, { ts: number; value: number }>();
  for (const r of rows) {
    if (!r.release || !r.binary) continue;
    const key = `${r.release}|${r.binary}`;
    const ts = Date.parse(r.date_retrieval);
    const prev = latest.get(key);
    // >= so a same-timestamp re-run overwrites — file order is read order.
    if (!prev || ts >= prev.ts) latest.set(key, { ts, value: r.download_count ?? 0 });
  }
  const perRelease = new Map<string, number>();
  for (const [k, v] of latest) {
    const release = k.split("|")[0];
    perRelease.set(release, (perRelease.get(release) ?? 0) + v.value);
  }
  const entries = [...perRelease.entries()]
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  return { labels: entries.map(([k]) => k), values: entries.map(([, v]) => v) };
}

// Module: cumulative time series straight from daily snapshots.
export function moduleCumulative(rows: ModuleRow[]): TimePoint[] {
  return rows
    .filter((r) => r.date_retrieval && Number.isFinite(r.downloads))
    .map((r) => ({ x: Date.parse(r.date_retrieval), y: r.downloads }))
    .sort((a, b) => a.x - b.x);
}

// Module monthly delta. First-month fallback: when there's only one
// snapshot, return the cumulative as the month's value (matches the
// Python pipeline's documented behavior).
export function moduleMonthly(rows: ModuleRow[]): { label: string; value: number }[] {
  const byMonth = new Map<string, { ts: number; value: number }>();
  for (const r of rows) {
    if (!r.date_retrieval || !Number.isFinite(r.downloads)) continue;
    const key = monthKey(r.date_retrieval);
    const ts = Date.parse(r.date_retrieval);
    const prev = byMonth.get(key);
    if (!prev || ts >= prev.ts) byMonth.set(key, { ts, value: r.downloads });
  }
  const months = [...byMonth.keys()].sort();
  const totals = months.map((m) => byMonth.get(m)!.value);
  if (totals.length === 0) return [];
  if (totals.length === 1) return [{ label: monthLabel(months[0]), value: totals[0] }];
  const out: { label: string; value: number }[] = [];
  for (let i = 1; i < totals.length; i++) {
    out.push({ label: monthLabel(months[i]), value: totals[i] - totals[i - 1] });
  }
  return out;
}
