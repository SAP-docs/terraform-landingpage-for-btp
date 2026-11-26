// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React from 'react';
import { LineChart } from '@ui5/webcomponents-react-charts';
import { fmt, type TimePoint } from '@site/src/lib/aggregate';

// Cumulative "all-time downloads over time" line. Takes the TimePoint[] that
// aggregate.ts produces (cumulativeFromTotals / exporterCumulative /
// moduleCumulative) and maps it onto UI5's dataset-of-objects shape.
export default function CumulativeChart({
  points,
  label = 'Downloads',
}: {
  points: TimePoint[];
  label?: string;
}): React.JSX.Element {
  const dataset = points.map((p) => ({
    date: new Date(p.x).toLocaleDateString('en', { year: '2-digit', month: 'short', day: 'numeric' }),
    value: p.y,
  }));

  return (
    <LineChart
      dataset={dataset}
      dimensions={[{ accessor: 'date' }]}
      measures={[{ accessor: 'value', label, formatter: (v: unknown) => fmt.compact(Number(v)) }]}
      style={{ height: '320px' }}
    />
  );
}
