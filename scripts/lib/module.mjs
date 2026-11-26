// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Terraform Registry module downloads. The v1 modules endpoint returns a single
// running `downloads` total (no weekly/monthly breakdown), so we snapshot it
// daily and derive deltas later in aggregate.ts. Public API → plain fetch.

import { upsertByDate, nowStamp } from './csv.mjs';

const HEADER = 'date_retrieval,downloads';

export async function fetchModule(mod) {
  const url = `https://registry.terraform.io/v1/modules/${mod.namespace}/${mod.name}/${mod.provider}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const total = Number((await res.json()).downloads);
  upsertByDate(mod.csv, HEADER, nowStamp(), String(total));
}
