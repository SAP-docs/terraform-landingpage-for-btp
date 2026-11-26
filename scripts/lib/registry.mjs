// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Terraform Registry provider downloads. The Registry is a public, unauthenticated
// JSON API (not GitHub), so plain fetch is used here — not Octokit.

import { upsertByDate, writeAll, nowStamp } from './csv.mjs';

const BASE = 'https://registry.terraform.io/v2/providers';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function downloadSummary(id, version) {
  const url = version
    ? `${BASE}/${id}/downloads/summary?filter%5Bversion%5D=${encodeURIComponent(version)}`
    : `${BASE}/${id}/downloads/summary`;
  const data = await getJson(url);
  return data.data.attributes; // { week, month, year, total }
}

async function allVersions(id) {
  const url = `${BASE}/${id}?include=provider-versions`;
  const data = await getJson(url);
  return (data.included ?? [])
    .filter((x) => x.type === 'provider-versions')
    .map((x) => x.attributes.version);
}

// Totals CSV: one upserted row per day.
const TOTALS_HEADER = 'date_retrieval,this_week,this_month,this_year,all_time';
// Versions CSV: full rewrite each run.
const VERSIONS_HEADER = 'date_retrieval,version,this_week,this_month,this_year,all_time';

export async function fetchProvider(provider) {
  const stamp = nowStamp();

  const t = await downloadSummary(provider.id);
  upsertByDate(provider.csv, TOTALS_HEADER, stamp, `${t.week},${t.month},${t.year},${t.total}`);

  const versions = await allVersions(provider.id);
  versions.sort().reverse();
  const rows = [];
  for (const v of versions) {
    const d = await downloadSummary(provider.id, v);
    rows.push(`${stamp},${v},${d.week},${d.month},${d.year},${d.total}`);
  }
  writeAll(provider.versionsCsv, VERSIONS_HEADER, rows);
}
