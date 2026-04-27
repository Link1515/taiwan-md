/**
 * ARTICLE-INBOX adapter.
 *
 * Watches `docs/semiont/ARTICLE-INBOX.md`. On change, parses each `### {title}`
 * block, looks for `Status: pending` + `Priority: P0|P1`, and converts new
 * blocks into harvest tasks. Already-converted entries are remembered via
 * the `inbox_entries` SQLite table (keyed by sha256 of the entry body).
 *
 * Entry schema we expect (see ARTICLE-INBOX.md "Entry Schema" section):
 *
 *   ### 主題名
 *   - **Type**: NEW | EVOLVE
 *   - **Category**: People
 *   - **Priority**: P0
 *   - **Status**: pending
 *   - **Requested**: 2026-04-27 by cheyu (session γ)
 *   - **Notes**: ...
 */

import {
  existsSync,
  readFileSync,
  statSync,
  watch as fsWatch,
  type FSWatcher,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { config } from '../config.ts';
import { getDb } from '../db/client.ts';
import { child } from '../logger.ts';
import { createTask } from '../tasks/manager.ts';
import { type TaskPriority, isTaskPriority } from '../tasks/types.ts';
import type { DetectedEntry, IntakeAdapter } from './adapter.ts';

const log = child({ module: 'intake/article-inbox' });

interface ParsedEntry {
  title: string;
  type: string; // NEW | EVOLVE
  category: string;
  priority: string;
  status: string;
  requested?: string;
  notes?: string;
  /** Raw markdown body for the entry — used to compute the dedupe hash. */
  body: string;
}

/** Splits ARTICLE-INBOX text into one record per `### ` heading. */
export function parseInbox(markdown: string): ParsedEntry[] {
  const lines = markdown.split('\n');
  const entries: ParsedEntry[] = [];
  let currentLines: string[] | null = null;
  let currentTitle = '';

  const flush = (): void => {
    if (currentLines === null) return;
    const body = currentLines.join('\n').trim();
    if (body.length === 0) {
      currentLines = null;
      return;
    }
    entries.push(parseEntry(currentTitle, body));
    currentLines = null;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.*?)\s*$/);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1] ?? '';
      currentLines = [];
      continue;
    }
    // Stop at higher-level headings to avoid eating other sections.
    if (/^#{1,2}\s/.test(line)) {
      flush();
      continue;
    }
    if (currentLines !== null) currentLines.push(line);
  }
  flush();
  return entries;
}

function parseEntry(title: string, body: string): ParsedEntry {
  const get = (key: string): string | undefined => {
    const re = new RegExp(
      `^[\\-*]\\s+\\*\\*${escapeReg(key)}\\*\\*\\s*:\\s*(.+)$`,
      'mi',
    );
    const m = body.match(re);
    return m ? m[1]?.trim().replace(/^[`\\]+|[`\\]+$/g, '') : undefined;
  };
  const type = get('Type') ?? '';
  const category = get('Category') ?? '';
  const priorityRaw = (get('Priority') ?? '').replace(/`/g, '').trim();
  const statusRaw = (get('Status') ?? '').replace(/`/g, '').trim();
  return {
    title,
    type,
    category,
    priority: priorityRaw,
    status: statusRaw,
    requested: get('Requested') ?? '',
    notes: get('Notes') ?? '',
    body,
  };
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sha256 of (title + body) — stable across whitespace tweaks at the edges. */
export function entryHash(entry: ParsedEntry): string {
  const normalised = `${entry.title.trim()}\n${entry.body.trim()}`;
  return createHash('sha256').update(normalised, 'utf8').digest('hex');
}

/**
 * Decide whether a parsed entry should be converted to a task.
 * MVP rule: status === 'pending' AND priority is P0/P1.
 */
function isActionable(entry: ParsedEntry): boolean {
  if (entry.status.toLowerCase() !== 'pending') return false;
  if (!isTaskPriority(entry.priority)) return false;
  return entry.priority === 'P0' || entry.priority === 'P1';
}

/**
 * Maps a parsed inbox entry to a NewTaskInput for the task manager.
 * EVOLVE → article-evolve, otherwise article-rewrite (NEW or unknown).
 */
function toTaskDraft(entry: ParsedEntry): {
  type: string;
  boot_profile: string;
  priority: TaskPriority;
} {
  // The Type field can carry decorative suffixes in the inbox (e.g.
  // `EVOLVE`（範圍重切變體 / 詳見 [REWRITE-PIPELINE §...]）). We only care
  // about the first NEW|EVOLVE token.
  const tokenMatch = entry.type.toUpperCase().match(/\b(NEW|EVOLVE)\b/);
  const t = tokenMatch?.[1] ?? '';
  const taskType = t === 'EVOLVE' ? 'article-evolve' : 'article-rewrite';
  return {
    type: taskType,
    boot_profile: 'content-writing',
    priority: entry.priority as TaskPriority,
  };
}

export class ArticleInboxAdapter implements IntakeAdapter {
  readonly name = 'article-inbox';
  private watcher: FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    const path = config.paths.articleInbox;
    if (!existsSync(path)) {
      log.warn(
        { path },
        'ARTICLE-INBOX.md missing — adapter idle until file appears',
      );
      return;
    }
    // First catch-up scan so existing pending entries get picked up immediately.
    await this.scanOnce();
    this.watcher = fsWatch(path, () => this.handleChange());
    log.info({ path }, 'watching ARTICLE-INBOX');
  }

  async stop(): Promise<void> {
    this.watcher?.close();
    this.watcher = null;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
  }

  private handleChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.scanOnce().catch((err) =>
        log.error({ err: String(err) }, 'scan failed'),
      );
    }, 750);
  }

  /** Synchronous-friendly scan: returns the list of new entries detected + tasks created. */
  async scanOnce(): Promise<DetectedEntry[]> {
    const path = config.paths.articleInbox;
    if (!existsSync(path)) return [];
    let raw: string;
    try {
      raw = readFileSync(path, 'utf8');
    } catch (err) {
      log.warn({ err: String(err) }, 'failed to read inbox');
      return [];
    }
    const entries = parseInbox(raw);
    const actionable = entries.filter(isActionable);
    const db = getDb();
    const seenStmt = db.prepare<{ task_id: string | null }, [string]>(
      'SELECT task_id FROM inbox_entries WHERE entry_hash = ?',
    );
    const insertEntryStmt = db.prepare(
      'INSERT OR IGNORE INTO inbox_entries (entry_hash, source_file, task_id, detected_at) VALUES (?, ?, ?, ?)',
    );

    const detected: DetectedEntry[] = [];
    for (const entry of actionable) {
      const hash = entryHash(entry);
      const existing = seenStmt.get(hash);
      if (existing) continue; // already converted

      const draft = toTaskDraft(entry);
      const task = createTask({
        type: draft.type,
        boot_profile: draft.boot_profile,
        priority: draft.priority,
        title: entry.title,
        created_by: 'inbox-watch',
        notes: entry.notes,
        inputs: {
          source_file: path,
          inbox_type: entry.type,
          category: entry.category,
          requested: entry.requested,
          raw_body: entry.body,
        },
      });
      insertEntryStmt.run(hash, path, task.id, new Date().toISOString());
      detected.push({
        entryHash: hash,
        sourceFile: path,
        draft: { ...draft, title: entry.title, created_by: 'inbox-watch' },
      });
      log.info(
        { taskId: task.id, title: entry.title, priority: entry.priority },
        'inbox → task',
      );
    }

    if (detected.length === 0) {
      log.debug(
        { stat: statSync(path).size },
        'inbox scan: no new actionable entries',
      );
    }
    return detected;
  }
}
