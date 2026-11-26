// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React, { useMemo, useState } from 'react';
import { PieChart } from '@ui5/webcomponents-react-charts';
import { fmt, versionsTopN, topNWithOther, type ProviderVersionsRow } from '@site/src/lib/aggregate';

type Field = 'this_month' | 'this_year' | 'all_time';
type Pairs = { labels: string[]; values: number[] };

// Per-version (or per-release) usage as a pie, with a Top-N selector.
// Pass either `rows` (provider version CSV rows) or pre-aggregated `data`.
export default function VersionPie({
  rows,
  field = 'this_month',
  itemLabel = 'versions',
  data,
  combineRcBeta = false,
}: {
  rows?: ProviderVersionsRow[];
  field?: Field;
  itemLabel?: string;
  data?: Pairs;
  combineRcBeta?: boolean;
}): React.JSX.Element {
  const [topN, setTopN] = useState<'5' | '10' | '20' | 'all'>('10');

  const dataset = useMemo(() => {
    const n = topN === 'all' ? 'all' : parseInt(topN, 10);
    const r = data
      ? topNWithOther(data.labels.map((label, i) => ({ label, value: data.values[i] ?? 0 })), n)
      : versionsTopN(rows ?? [], field, n, combineRcBeta);
    return r.labels.map((label, i) => ({ label, value: r.values[i] }));
  }, [rows, field, topN, data, combineRcBeta]);

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
