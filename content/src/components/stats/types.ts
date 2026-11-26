// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

import { cumulativeFromTotals, type ProviderTotalsRow, type ProviderVersionsRow, type ExporterRow, type ModuleRow } from '@site/src/lib/aggregate';

// Shape of the global data emitted by the load-stats-data plugin.
export type ProviderData = {
  key: string;
  label: string;
  registry: string;
  combineRcBeta: boolean;
  totals: ProviderTotalsRow[];
  versions: ProviderVersionsRow[];
};
export type ToolData = { key: string; label: string; source: string; rows: ExporterRow[] };
export type ModuleData = { key: string; label: string; registry: string; rows: ModuleRow[] };

export type StatsData = {
  providers: ProviderData[];
  tools: ToolData[];
  modules: ModuleData[];
};

export function latestTotal(totals: ProviderTotalsRow[]): number {
  const cum = cumulativeFromTotals(totals);
  return cum.length ? cum[cum.length - 1].y : 0;
}
