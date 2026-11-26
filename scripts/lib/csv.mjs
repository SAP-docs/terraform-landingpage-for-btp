// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and terraform-landingpage-for-btp contributors
//
// SPDX-License-Identifier: CC-BY-4.0

// Minimal CSV helpers shared by every data source. No parser dependency — the
// files are flat, comma-separated, no quoting/escaping in any column we write.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');

export function dataPath(fileName) {
  return path.join(DATA_DIR, fileName);
}

export function nowStamp() {
  // YYYY-MM-DD HH:MM:SS — matches the historical format.
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function dateOnly(stamp) {
  return String(stamp).split(' ')[0];
}

function readLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n');
}

// Append one row, or replace today's row if one already exists (upsert by day).
// Creates the file with `header` if missing. Used for single-row-per-day series
// (provider totals, module totals).
export function upsertByDate(fileName, header, stamp, valuesCsv) {
  const file = dataPath(fileName);
  const today = dateOnly(stamp);
  const row = `${stamp},${valuesCsv}`;

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${header}\n${row}\n`);
    return;
  }

  const lines = readLines(file);
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false; // drop blank lines
    if (trimmed === header) return true; // keep header
    return dateOnly(trimmed.split(',')[0]) !== today; // drop any existing today rows
  });
  kept.push(row);
  fs.writeFileSync(file, kept.join('\n') + '\n');
}

// Rewrite the whole file from scratch (header + all rows). Used for the
// per-version snapshot CSVs, which are a full replacement each run.
export function writeAll(fileName, header, rows) {
  fs.writeFileSync(dataPath(fileName), [header, ...rows].join('\n') + '\n');
}

// Append rows only if today's data isn't present yet. Used for the exporter CSV,
// which keeps one block of (release,binary) rows per day.
export function appendOncePerDay(fileName, header, stamp, rows) {
  const file = dataPath(fileName);
  const today = dateOnly(stamp);

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${header}\n`);
  } else {
    const alreadyToday = readLines(file).some(
      (line) => line.trim() && line.trim() !== header && dateOnly(line.split(',')[0]) === today,
    );
    if (alreadyToday) return;
  }
  fs.appendFileSync(file, rows.map((r) => `${r}\n`).join(''));
}
