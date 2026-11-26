// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import React from 'react';
import { ColumnChart } from '@ui5/webcomponents-react-charts';
import { fmt } from '@site/src/lib/aggregate';

// Per-month downloads as columns. Takes the {label,value}[] that aggregate.ts
// produces (monthlyFromTotals / exporterMonthly / moduleMonthly).
export default function MonthlyChart({
  data,
  label = 'Downloads',
}: {
  data: { label: string; value: number }[];
  label?: string;
}): React.JSX.Element {
  return (
    <ColumnChart
      dataset={data}
      dimensions={[{ accessor: 'label' }]}
      measures={[{ accessor: 'value', label, formatter: (v: unknown) => fmt.compact(Number(v)) }]}
      style={{ height: '320px' }}
    />
  );
}
