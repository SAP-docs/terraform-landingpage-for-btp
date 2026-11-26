// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Orchestrates the daily statistics refresh. Every source is wrapped in its own
// try/catch so one dead endpoint can't lose the other sources' data (the Python
// predecessor aborted the whole run on any failure). Exits non-zero if anything
// failed, so CI surfaces it — but only after attempting every source.

import { PROVIDERS, TOOLS, MODULES } from '../stats.config.mjs';
import { fetchProvider } from './lib/registry.mjs';
import { fetchModule } from './lib/module.mjs';
import { fetchTool } from './lib/exporter.mjs';

const token = process.env.GITHUB_TOKEN;
let failures = 0;

async function run(label, fn) {
  try {
    await fn();
    console.log(`ok   ${label}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${label}: ${err.message}`);
  }
}

for (const p of PROVIDERS) await run(`provider ${p.key}`, () => fetchProvider(p));
for (const m of MODULES) await run(`module ${m.key}`, () => fetchModule(m));
for (const t of TOOLS) {
  if (!token) console.warn(`warn tool ${t.key}: no GITHUB_TOKEN set; low rate limit may apply`);
  await run(`tool ${t.key}`, () => fetchTool(t, token));
}

if (failures) {
  console.error(`\n${failures} source(s) failed.`);
  process.exit(1);
}
console.log('\nAll sources updated.');
