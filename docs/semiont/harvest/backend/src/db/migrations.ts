/**
 * Schema migrations.
 *
 * MVP strategy: the schema.sql file is idempotent (CREATE TABLE IF NOT EXISTS
 * everywhere). On startup we run schema.sql, then bump schema_version. Future
 * structural changes will append numbered .sql files in this folder and the
 * runner will apply only those above the current version.
 */

import type { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CURRENT_SCHEMA_VERSION = 1;

export function applyMigrations(db: Database): void {
  const schemaPath = join(__dirname, 'schema.sql');
  const ddl = readFileSync(schemaPath, 'utf8');
  db.exec(ddl);

  const row = db
    .query<
      { version: number },
      []
    >('SELECT MAX(version) AS version FROM schema_version')
    .get();
  const current = row?.version ?? 0;
  if (current < CURRENT_SCHEMA_VERSION) {
    db.run('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)', [
      CURRENT_SCHEMA_VERSION,
      new Date().toISOString(),
    ]);
  }
}
