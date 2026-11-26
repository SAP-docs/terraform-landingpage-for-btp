// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

// Repo root is four levels up from this file (content/src/plugins/load-stats-data).
const DATA_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'data');

function parseCsv(fileName) {
  const full = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(full)) return [];
  const csv = fs.readFileSync(full, 'utf8');
  return Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
}

// Build-time CSV loader. Reads every CSV named in stats.config.mjs, parses it,
// and hands the parsed rows to the client via Docusaurus global data — so chart
// components get the data with no runtime fetch and the raw CSVs stay out of the
// client bundle untouched.
module.exports = async function loadStatsData() {
  // stats.config.mjs is ESM; this plugin is CJS. Dynamic import bridges them.
  const { PROVIDERS, TOOLS, MODULES } = await import(
    path.resolve(__dirname, '..', '..', '..', '..', 'stats.config.mjs')
  );

  return {
    name: 'load-stats-data',

    async loadContent() {
      return {
        providers: PROVIDERS.map((p) => ({
          key: p.key,
          label: p.label,
          registry: p.registry,
          combineRcBeta: p.combineRcBeta,
          totals: parseCsv(p.csv),
          versions: parseCsv(p.versionsCsv),
        })),
        tools: TOOLS.map((t) => ({
          key: t.key,
          label: t.label,
          source: t.source,
          rows: parseCsv(t.csv),
        })),
        modules: MODULES.map((m) => ({
          key: m.key,
          label: m.label,
          registry: m.registry,
          rows: parseCsv(m.csv),
        })),
      };
    },

    async contentLoaded({ content, actions }) {
      // setGlobalData makes `content` readable client-side via useGlobalData /
      // usePluginData('load-stats-data').
      actions.setGlobalData(content);
    },
  };
};
