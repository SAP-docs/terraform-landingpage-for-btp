// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import CumulativeChart from './CumulativeChart';
import MonthlyChart from './MonthlyChart';
import VersionPie from './VersionPie';
import { fmt, cumulativeFromTotals, monthlyFromTotals, exporterCumulative, exporterMonthly, exporterByRelease, moduleCumulative, moduleMonthly } from '@site/src/lib/aggregate';
import { latestTotal, type StatsData } from './types';

function Block({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      {children}
    </section>
  );
}

type Props = { kind: 'provider' | 'tool' | 'module'; entityKey: string };

function EntityInner({ kind, entityKey }: Props): React.JSX.Element {
  const data = usePluginData('load-stats-data') as StatsData;

  if (kind === 'provider') {
    const p = data.providers.find((x) => x.key === entityKey);
    if (!p) return <p>Unknown provider: {entityKey}</p>;
    return (
      <div>
        <p>
          <a href={p.registry} target="_blank" rel="noreferrer">View on the Terraform Registry</a>
          {' — '}<strong>{fmt.full(latestTotal(p.totals))}</strong> all-time downloads.
        </p>
        <Block title="Downloads over time (cumulative)"><CumulativeChart points={cumulativeFromTotals(p.totals)} /></Block>
        <Block title="Downloads per month"><MonthlyChart data={monthlyFromTotals(p.totals)} /></Block>
        <Block title="Downloads by version (this month)"><VersionPie rows={p.versions} field="this_month" combineRcBeta={p.combineRcBeta} /></Block>
      </div>
    );
  }

  if (kind === 'tool') {
    const t = data.tools.find((x) => x.key === entityKey);
    if (!t) return <p>Unknown tool: {entityKey}</p>;
    return (
      <div>
        <p><a href={t.source} target="_blank" rel="noreferrer">View the source repository</a></p>
        <Block title="Downloads over time (cumulative)"><CumulativeChart points={exporterCumulative(t.rows)} /></Block>
        <Block title="Downloads per month"><MonthlyChart data={exporterMonthly(t.rows)} /></Block>
        <Block title="Downloads by release"><VersionPie data={exporterByRelease(t.rows)} itemLabel="releases" /></Block>
      </div>
    );
  }

  const m = data.modules.find((x) => x.key === entityKey);
  if (!m) return <p>Unknown module: {entityKey}</p>;
  return (
    <div>
      <p><a href={m.registry} target="_blank" rel="noreferrer">View on the Terraform Registry</a></p>
      <Block title="Downloads over time (cumulative)"><CumulativeChart points={moduleCumulative(m.rows)} /></Block>
      <Block title="Downloads per month"><MonthlyChart data={moduleMonthly(m.rows)} /></Block>
    </div>
  );
}

// Renders the charts for a single provider/tool/module. Charts need the DOM
// (UI5 web components), so rendering is client-only.
export default function StatsEntity(props: Props): React.JSX.Element {
  return <BrowserOnly fallback={<div>Loading charts…</div>}>{() => <EntityInner {...props} />}</BrowserOnly>;
}
