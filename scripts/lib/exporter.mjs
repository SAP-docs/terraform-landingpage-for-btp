// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// GitHub-release download counts, via Octokit REST (per the GitHub -> Octokit
// decision). One row per (release, binary asset) per day; .sha256 checksums are
// skipped — they aren't the artifact users download.

import { Octokit } from '@octokit/rest';
import { appendOncePerDay, nowStamp } from './csv.mjs';

const HEADER = 'date_retrieval,release,binary,download_count';

export async function fetchTool(tool, token) {
  const octokit = new Octokit(token ? { auth: token } : {});
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: tool.owner,
    repo: tool.repo,
    per_page: tool.releaseCount ?? 5,
  });

  const stamp = nowStamp();
  const rows = [];
  for (const rel of releases) {
    for (const asset of rel.assets ?? []) {
      if (asset.name.includes('.sha256')) continue;
      rows.push(`${stamp},${rel.tag_name},${asset.name},${asset.download_count}`);
    }
  }
  appendOncePerDay(tool.csv, HEADER, stamp, rows);
}
