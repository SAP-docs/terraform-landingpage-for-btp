// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { fmt, exporterCumulative, moduleCumulative, type TimePoint } from '@site/src/lib/aggregate';
import { latestTotal, type StatsData } from './types';

const allTime = (points: TimePoint[]): number => (points.length ? points[points.length - 1].y : 0);

// Compact overview for the Statistics index page: every tracked provider, tool,
// and module with its headline number and a link to its detail subpage. No
// charts here — the per-entity subpages carry those.
function OverviewInner(): React.JSX.Element {
  const data = usePluginData('load-stats-data') as StatsData;
  const base = useBaseUrl('/docs/landing-page-content/statistics/');

  const rows = [
    ...data.providers.map((p) => ({
      key: p.key, label: p.label,
      total: `${fmt.full(latestTotal(p.totals))} downloads`,
    })),
    ...data.tools.map((t) => ({
      key: t.key, label: t.label,
      total: `${fmt.full(allTime(exporterCumulative(t.rows)))} downloads`,
    })),
    ...data.modules.map((m) => ({
      key: m.key, label: m.label,
      total: `${fmt.full(allTime(moduleCumulative(m.rows)))} downloads`,
    })),
  ];

  return (
    <table>
      <thead>
        <tr><th>Name</th><th>All-time</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td><a href={`${base}${r.key}`}>{r.label}</a></td>
            <td>{r.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatsDashboard(): React.JSX.Element {
  return <BrowserOnly fallback={<div>Loading…</div>}>{() => <OverviewInner />}</BrowserOnly>;
}
