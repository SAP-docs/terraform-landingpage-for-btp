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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(key: string): string {
  // Build from the numbers directly — no Date, so timezones never bite.
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
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
// Fold already-reduced {label,value} entries into Top-N + an "Other (count)"
// slice. Shared by versionsTopN and the component's pre-aggregated path.
// topN === "all" means keep everything (no "Other").
export function topNWithOther(
  entries: { label: string; value: number }[],
  topN: number | "all",
): { labels: string[]; values: number[] } {
  const sorted = entries.filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
  const n = topN === "all" ? sorted.length : topN;
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n);
  const labels = top.map((e) => e.label);
  const values = top.map((e) => e.value);
  if (rest.length) {
    labels.push(`Other (${rest.length})`);
    values.push(rest.reduce((s, e) => s + e.value, 0));
  }
  return { labels, values };
}

export function versionsTopN(
  rows: ProviderVersionsRow[],
  field: "this_month" | "this_year" | "all_time",
  topN: number | "all",
  combineRcBeta = false,
): { labels: string[]; values: number[] } {
  const latest = new Map<string, { ts: number; value: number }>();
  for (const r of rows) {
    if (!r.version || !Number.isFinite(r[field])) continue;
    const ts = r.date_retrieval ? Date.parse(r.date_retrieval) : 0;
    const prev = latest.get(r.version);
    if (!prev || ts >= prev.ts) latest.set(r.version, { ts, value: r[field] });
  }
  let entries = [...latest.entries()].map(([label, v]) => ({ label, value: v.value }));
  if (combineRcBeta) {
    // Fold every rc/beta version into a single "Beta & RC" slice.
    let betaRc = 0;
    const stable: { label: string; value: number }[] = [];
    for (const e of entries) {
      if (/rc|beta/i.test(e.label)) betaRc += e.value;
      else stable.push(e);
    }
    if (betaRc > 0) stable.push({ label: "Beta & RC", value: betaRc });
    entries = stable;
  }
  return topNWithOther(entries, topN);
}

// Exporter: cumulative all-time downloads per date.
// Each run snapshots only the few most-recent releases (releaseCount in
// stats.config.mjs), so a given date's rows cover a subset of all binaries
// ever released. We carry each binary's last-known count forward across dates,
// so the total is every binary's latest count as of that date — not just the
// binaries snapshotted that day. Without this the line drops when old releases
// rotate out of the snapshot.
export function exporterCumulative(rows: ExporterRow[]): TimePoint[] {
  // Keep latest count per (date, binary) first, so same-day re-runs settle.
  const latestByKey = new Map<string, { ts: number; row: ExporterRow }>();
  for (const r of rows) {
    if (!r.date_retrieval || !r.binary) continue;
    const key = `${r.date_retrieval}|${r.binary}`;
    const ts = Date.parse(r.date_retrieval);
    const prev = latestByKey.get(key);
    // >= so same-timestamp re-runs overwrite; matches exporterByRelease.
    if (!prev || ts >= prev.ts) latestByKey.set(key, { ts, row: r });
  }

  // Collect each date's snapshotted binaries, in date order.
  const dates = [...new Set([...latestByKey.values()].map((e) => e.row.date_retrieval))].sort();
  const byDateBinary = new Map<string, number>(); // "date|binary" -> count
  for (const { row: r } of latestByKey.values()) {
    byDateBinary.set(`${r.date_retrieval}|${r.binary}`, r.download_count ?? 0);
  }
  const allBinaries = new Set([...latestByKey.values()].map((e) => e.row.binary));

  // Walk dates forward, carrying each binary's last-known count.
  const lastKnown = new Map<string, number>();
  const out: TimePoint[] = [];
  for (const d of dates) {
    for (const b of allBinaries) {
      const seen = byDateBinary.get(`${d}|${b}`);
      if (seen !== undefined) lastKnown.set(b, seen);
    }
    let total = 0;
    for (const v of lastKnown.values()) total += v;
    out.push({ x: Date.parse(d), y: total });
  }
  return out;
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
