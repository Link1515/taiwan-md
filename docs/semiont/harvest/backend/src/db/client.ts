/**
 * SQLite client — thin wrapper around bun:sqlite.
 *
 * Exposes a singleton `db` instance plus helpers for the rest of the backend.
 * We keep the surface tiny: most modules use raw `db.prepare(...)`.
 */

import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.ts';
import { applyMigrations } from './migrations.ts';

let _db: Database | null = null;

/** Returns the process-wide Database handle, creating it on first call. */
export function getDb(): Database {
  if (_db) return _db;
  mkdirSync(dirname(config.dbPath), { recursive: true });
  const db = new Database(config.dbPath, { create: true });
  // PRAGMA tuning: WAL is faster for concurrent reads, foreign_keys must be
  // explicitly enabled in SQLite.
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  applyMigrations(db);
  _db = db;
  return db;
}

/** Closes the database (mainly for tests / verification scripts). */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
