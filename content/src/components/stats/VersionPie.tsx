// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React, { useMemo, useState } from 'react';
import { PieChart } from '@ui5/webcomponents-react-charts';
import { fmt, versionsTopN, type ProviderVersionsRow } from '@site/src/lib/aggregate';

type Field = 'this_month' | 'this_year' | 'all_time';
type Pairs = { labels: string[]; values: number[] };

// Top-N + "Other" over pre-aggregated label/value pairs (e.g. exporter releases).
function topNFromPairs(data: Pairs, n: number): Pairs {
  const entries = data.labels
    .map((label, i) => ({ label, value: data.values[i] ?? 0 }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
  const top = entries.slice(0, n);
  const rest = entries.slice(n);
  const labels = top.map((e) => e.label);
  const values = top.map((e) => e.value);
  if (rest.length) {
    labels.push(`Other (${rest.length})`);
    values.push(rest.reduce((s, e) => s + e.value, 0));
  }
  return { labels, values };
}

// Per-version (or per-release) usage as a pie, with a Top-N selector.
// Pass either `rows` (provider version CSV rows) or pre-aggregated `data`.
export default function VersionPie({
  rows,
  field = 'this_month',
  itemLabel = 'versions',
  data,
}: {
  rows?: ProviderVersionsRow[];
  field?: Field;
  itemLabel?: string;
  data?: Pairs;
}): React.JSX.Element {
  const [topN, setTopN] = useState<'5' | '10' | '20' | 'all'>('10');

  const dataset = useMemo(() => {
    const maxLen = data ? data.labels.length : (rows?.length ?? 0);
    const n = topN === 'all' ? maxLen : parseInt(topN, 10);
    const r = data ? topNFromPairs(data, n) : versionsTopN(rows ?? [], field, topN === 'all' ? 'all' : n);
    return r.labels.map((label, i) => ({ label, value: r.values[i] }));
  }, [rows, field, topN, data]);

  return (
    <div>
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
        Show top
        <select value={topN} onChange={(e) => setTopN(e.target.value as typeof topN)}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="all">All</option>
        </select>
        {itemLabel}, rest folded into &quot;Other&quot;.
      </label>
      <PieChart
        dataset={dataset}
        dimension={{ accessor: 'label' }}
        measure={{ accessor: 'value', formatter: (v: unknown) => fmt.full(Number(v)) }}
        style={{ height: '320px' }}
      />
    </div>
  );
}
