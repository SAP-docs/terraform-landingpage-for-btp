// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Single source of truth for everything statistics-related.
//
// To add a new provider, tool, or module: append one entry to the relevant
// array below. The fetch script (scripts/fetch-stats.mjs), the build-time CSV
// loader (content/src/plugins/load-stats-data), and the statistics page all
// read from here — no other file needs to change.
//
// `id` is the numeric Terraform Registry provider id (registry.terraform.io/v2).
// `csv`/`versionsCsv` are file names under data/.

// Terraform Registry providers. Each yields a totals CSV and a per-version CSV.
export const PROVIDERS = [
  {
    key: "btp",
    id: 4294,
    label: "SAP BTP",
    registry: "https://registry.terraform.io/providers/SAP/btp/latest",
    csv: "tf_btp_downloads.csv",
    versionsCsv: "tf_btp_downloads_versions.csv",
    // Fold rc/beta versions into a single "Beta & RC" slice in the version pie.
    combineRcBeta: true,
  },
  {
    key: "cf",
    id: 5672,
    label: "Cloudfoundry (CF)",
    registry: "https://registry.terraform.io/providers/cloudfoundry/cloudfoundry/latest",
    csv: "cf_cf_downloads.csv",
    versionsCsv: "cf_cf_downloads_versions.csv",
    combineRcBeta: false,
  },
  {
    key: "sci",
    id: 342937,
    label: "SAP Cloud Identity Services",
    registry: "https://registry.terraform.io/providers/SAP/sap-cloud-identity-services/latest",
    csv: "tf_sci_downloads.csv",
    versionsCsv: "tf_sci_downloads_versions.csv",
    combineRcBeta: true,
  },
  {
    key: "scc",
    id: 575340,
    label: "SAP Cloud Connector",
    registry: "https://registry.terraform.io/providers/SAP/scc/latest",
    csv: "tf_scc_downloads.csv",
    versionsCsv: "tf_scc_downloads_versions.csv",
    combineRcBeta: true,
  },
  {
    key: "services",
    id: 2028839,
    label: "SAP BTP Services",
    registry: "https://registry.terraform.io/providers/SAP/btp-services/latest",
    csv: "tf_services_downloads.csv",
    versionsCsv: "tf_services_downloads_versions.csv",
    combineRcBeta: true,
  },
];

// GitHub-release based tools (download counts come from release assets, via Octokit).
export const TOOLS = [
  {
    key: "exporter",
    label: "SAP BTP Exporter",
    owner: "SAP",
    repo: "terraform-exporter-btp",
    source: "https://github.com/SAP/terraform-exporter-btp",
    csv: "tf_btp_exporter_downloads_stats.csv",
    // How many most-recent releases to read per run.
    releaseCount: 5,
  },
];

// Terraform Registry modules (v1 modules endpoint → running download total).
export const MODULES = [
  {
    key: "rolecolassign",
    namespace: "SAP",
    name: "sap-btp-role-collection-assignments",
    provider: "btp",
    label: "sap-btp-role-collection-assignments",
    registry:
      "https://registry.terraform.io/modules/SAP/sap-btp-role-collection-assignments/btp/latest",
    csv: "tfmod_rolecolassign_downloads.csv",
  },
];
