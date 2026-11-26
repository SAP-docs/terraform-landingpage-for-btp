// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Smoke tests for the pure helpers in aggregate.ts. Run with: npm test
// (tsx is a devDependency; a developer sanity check, not a pipeline gate.)

import assert from "node:assert/strict";
import {
  cumulativeFromTotals,
  monthlyFromTotals,
  versionsTopN,
  exporterCumulative,
  exporterMonthly,
  exporterByRelease,
  moduleCumulative,
  moduleMonthly,
  monthKey,
  monthLabel,
} from "./aggregate";

// monthKey & monthLabel
assert.equal(monthKey("2026-06-26 10:00:00"), "2026-06");
assert.equal(monthLabel("2026-06"), "Jun 26");

// cumulativeFromTotals: sorted, only valid rows.
{
  const out = cumulativeFromTotals([
    { date_retrieval: "2026-06-26", this_week: 0, this_month: 0, this_year: 0, all_time: 200 },
    { date_retrieval: "2026-06-25", this_week: 0, this_month: 0, this_year: 0, all_time: 150 },
    // @ts-expect-error invalid row stays out
    { date_retrieval: "", this_week: 0, this_month: 0, this_year: 0, all_time: NaN },
  ]);
  assert.equal(out.length, 2);
  assert.ok(out[0].x < out[1].x);
  assert.equal(out[1].y, 200);
}

// monthlyFromTotals: latest snapshot per month.
{
  const out = monthlyFromTotals([
    { date_retrieval: "2026-05-30 10:00:00", this_week: 0, this_month: 5, this_year: 0, all_time: 0 },
    { date_retrieval: "2026-05-31 23:00:00", this_week: 0, this_month: 7, this_year: 0, all_time: 0 },
    { date_retrieval: "2026-06-01 09:00:00", this_week: 0, this_month: 1, this_year: 0, all_time: 0 },
  ]);
  assert.deepEqual(out.map((r) => r.value), [7, 1]);
}

// versionsTopN: top-N + Other.
{
  const rows = [
    { date_retrieval: "2026-06-26", version: "1.0", this_week: 0, this_month: 30, this_year: 0, all_time: 0 },
    { date_retrieval: "2026-06-26", version: "1.1", this_week: 0, this_month: 20, this_year: 0, all_time: 0 },
    { date_retrieval: "2026-06-26", version: "1.2", this_week: 0, this_month: 10, this_year: 0, all_time: 0 },
    { date_retrieval: "2026-06-26", version: "1.3", this_week: 0, this_month: 5, this_year: 0, all_time: 0 },
  ];
  const r = versionsTopN(rows, "this_month", 2);
  assert.deepEqual(r.labels, ["1.0", "1.1", "Other (2)"]);
  assert.deepEqual(r.values, [30, 20, 15]);
  const all = versionsTopN(rows, "this_month", "all");
  assert.equal(all.labels.length, 4);
}

// Exporter aggregations.
// Each row models a daily snapshot of a (release, binary) cumulative
// counter — the format the exporter pipeline writes. Real binaries embed
// the release version in their name (btptf_1.6.0_linux_amd64, …), so
// (date, binary) is unique per snapshot. June 1 re-snapshots v1's binaries
// (unchanged) and adds v2's newly-released binary at 10.
{
  const rows = [
    { date_retrieval: "2026-05-01", release: "v1", binary: "btptf_v1_linux_amd64", download_count: 5 },
    { date_retrieval: "2026-05-01", release: "v1", binary: "btptf_v1_darwin_arm64", download_count: 3 },
    // Same day, same binary, latest wins.
    { date_retrieval: "2026-05-01", release: "v1", binary: "btptf_v1_linux_amd64", download_count: 7 },
    // June snapshot: v1 totals unchanged, v2 newly released at 10.
    { date_retrieval: "2026-06-01", release: "v1", binary: "btptf_v1_linux_amd64", download_count: 7 },
    { date_retrieval: "2026-06-01", release: "v1", binary: "btptf_v1_darwin_arm64", download_count: 3 },
    { date_retrieval: "2026-06-01", release: "v2", binary: "btptf_v2_linux_amd64", download_count: 10 },
  ];
  const cum = exporterCumulative(rows);
  // May total = 7 + 3 = 10; June total = 7 + 3 + 10 = 20.
  assert.deepEqual(cum.map((p) => p.y), [10, 20]);
  const monthly = exporterMonthly(rows);
  // Month-over-month delta: May 10 (from 0), June +10 (20 − 10).
  assert.deepEqual(monthly.map((m) => m.value), [10, 10]);
  const byRel = exporterByRelease(rows);
  // Compare as a {label: value} map so the assertion isn't sensitive to
  // sort order and keeps label↔value pairing intact.
  const byRelMap = Object.fromEntries(byRel.labels.map((l, i) => [l, byRel.values[i]]));
  assert.deepEqual(byRelMap, { v1: 10, v2: 10 });
}

// Module monthly with first-day fallback.
{
  const oneRow = moduleMonthly([{ date_retrieval: "2026-06-26 10:00:00", downloads: 11 }]);
  assert.deepEqual(oneRow, [{ label: "Jun 26", value: 11 }]);
  const twoRows = moduleMonthly([
    { date_retrieval: "2026-05-31 10:00:00", downloads: 11 },
    { date_retrieval: "2026-06-30 10:00:00", downloads: 18 },
  ]);
  assert.deepEqual(twoRows, [{ label: "Jun 26", value: 7 }]);
}

// Module cumulative.
{
  const cum = moduleCumulative([
    { date_retrieval: "2026-06-26 10:00:00", downloads: 11 },
    { date_retrieval: "2026-06-25 10:00:00", downloads: 9 },
  ]);
  assert.equal(cum.length, 2);
  assert.ok(cum[0].x < cum[1].x);
  assert.equal(cum[1].y, 11);
}

console.log("ok — all aggregate.ts assertions passed");
