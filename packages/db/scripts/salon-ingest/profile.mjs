/**
 * salon-ingest/profile.mjs — understand ANY dropped salon dataset.
 *
 * The generator's format is unknown, so before mapping to the Bask schema we
 * profile whatever landed: files, their type, and for each table/entity the
 * columns, inferred types, row counts, and a few sample values. The mapping to
 * bask.* (customers → Customer, etc.) is written AFTER reading this profile —
 * no field is guessed blind.
 *
 * Read-only. Touches no database. Never writes into the drop directory.
 *
 *   node packages/db/scripts/salon-ingest/profile.mjs <dir>
 *
 * Handles: .json / .ndjson (array-of-objects or object-of-arrays), .csv / .tsv,
 * .sqlite / .db / .sqlite3 (via the sqlite3 CLI), and .sql text dumps
 * (reports CREATE TABLE / INSERT shape without executing anything). Anything
 * else is listed as "unrecognized — tell me what it is".
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node profile.mjs <drop-dir>   (no default — never profile an unnamed path)');
  process.exit(1);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`not a directory: ${dir}`);
  process.exit(1);
}

const inferType = (v) => {
  if (v === null || v === undefined || v === '') return 'empty';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'decimal';
  if (typeof v === 'boolean') return 'bool';
  const s = String(v).trim();
  if (/^-?\d+$/.test(s)) return 'int';
  if (/^-?\d+\.\d+$/.test(s)) return 'decimal';
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?/.test(s)) return 'datetime';
  if (/^(true|false|yes|no|y|n|0|1)$/i.test(s)) return 'bool?';
  if (/@/.test(s) && /\./.test(s)) return 'email?';
  return 'string';
};

const profileRows = (name, rows) => {
  const cols = {};
  const n = Math.min(rows.length, 500);
  for (let i = 0; i < n; i++) {
    const r = rows[i];
    if (!r || typeof r !== 'object') continue;
    for (const [k, v] of Object.entries(r)) {
      (cols[k] ??= { types: {}, samples: [], nonEmpty: 0 });
      const t = inferType(v);
      cols[k].types[t] = (cols[k].types[t] || 0) + 1;
      if (t !== 'empty') cols[k].nonEmpty++;
      if (cols[k].samples.length < 3 && t !== 'empty') cols[k].samples.push(v);
    }
  }
  return {
    entity: name,
    rowCount: rows.length,
    columns: Object.fromEntries(
      Object.entries(cols).map(([k, c]) => [
        k,
        {
          type: Object.entries(c.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'empty',
          fillRate: `${Math.round((c.nonEmpty / n) * 100)}%`,
          samples: c.samples,
        },
      ]),
    ),
  };
};

const parseCsv = (text, sep) => {
  // minimal, quote-aware CSV; good enough to profile shape, not to import
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return [];
  const split = (line) => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
};

const profileSqlite = (file) => {
  const tables = execFileSync('sqlite3', [file, ".tables"], { encoding: 'utf8' })
    .split(/\s+/).filter(Boolean);
  return tables.map((t) => {
    let rows = [];
    try {
      const json = execFileSync('sqlite3', [file, '-json', `SELECT * FROM "${t}" LIMIT 500`], { encoding: 'utf8' });
      rows = json.trim() ? JSON.parse(json) : [];
    } catch { /* unreadable table — report empty */ }
    let total = rows.length;
    try {
      total = Number(execFileSync('sqlite3', [file, `SELECT COUNT(*) FROM "${t}"`], { encoding: 'utf8' }).trim());
    } catch { /* keep sample length */ }
    const p = profileRows(t, rows);
    p.rowCount = total;
    return p;
  });
};

const profileSqlDump = (text) => {
  const creates = [...text.matchAll(/CREATE TABLE[^(]*?["`\[]?(\w+)["`\]]?\s*\(([^;]*?)\)\s*;/gis)];
  return creates.map((m) => ({
    entity: m[1],
    rowCount: (text.match(new RegExp(`INSERT INTO\\s+["\`\\[]?${m[1]}\\b`, 'gi')) || []).length + ' INSERT stmts',
    columns: Object.fromEntries(
      m[2].split(',').map((c) => c.trim().split(/\s+/)).filter((p) => p[0]).map((p) => [
        p[0].replace(/["`\[\]]/g, ''),
        { type: (p[1] || '?').toLowerCase(), fillRate: 'n/a', samples: [] },
      ]),
    ),
  }));
};

const report = { dir, generatedFor: 'bask schema mapping', files: [] };

for (const name of fs.readdirSync(dir)) {
  const full = path.join(dir, name);
  if (fs.statSync(full).isDirectory()) continue;
  const ext = path.extname(name).toLowerCase();
  const entry = { file: name, ext, tables: [] };
  try {
    if (ext === '.json' || ext === '.ndjson') {
      const raw = fs.readFileSync(full, 'utf8');
      if (ext === '.ndjson') {
        const rows = raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
        entry.tables.push(profileRows(path.basename(name, ext), rows));
      } else {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) entry.tables.push(profileRows(path.basename(name, ext), data));
        else for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v)) entry.tables.push(profileRows(k, v));
        }
      }
    } else if (ext === '.csv' || ext === '.tsv') {
      entry.tables.push(profileRows(path.basename(name, ext), parseCsv(fs.readFileSync(full, 'utf8'), ext === '.tsv' ? '\t' : ',')));
    } else if (['.sqlite', '.db', '.sqlite3'].includes(ext)) {
      entry.tables = profileSqlite(full);
    } else if (ext === '.sql') {
      entry.tables = profileSqlDump(fs.readFileSync(full, 'utf8'));
    } else {
      entry.note = 'unrecognized — tell me what this is';
    }
  } catch (e) {
    entry.error = String(e.message || e);
  }
  report.files.push(entry);
}

const out = path.join(dir, '_profile.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));

// human summary to stdout
console.log(`\n=== salon-ingest profile: ${dir} ===`);
for (const f of report.files) {
  console.log(`\n${f.file}${f.note ? `  (${f.note})` : ''}${f.error ? `  ERROR: ${f.error}` : ''}`);
  for (const t of f.tables) {
    const cols = Object.keys(t.columns);
    console.log(`  • ${t.entity}: ${t.rowCount} rows, ${cols.length} cols`);
    for (const [c, meta] of Object.entries(t.columns)) {
      console.log(`      ${c.padEnd(22)} ${String(meta.type).padEnd(10)} fill=${meta.fillRate}  eg ${JSON.stringify(meta.samples).slice(0, 60)}`);
    }
  }
}
console.log(`\nprofile written to ${out}`);
