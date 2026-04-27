/**
 * Task folder I/O.
 *
 * Each task lives at `.harvest/tasks/{id}/` with `task.yml` as its manifest
 * and `inputs/`, `outputs/`, `sessions/` subfolders. We use plain YAML (no
 * frontmatter wrapper) — cheyu's strategy report §3.3 calls it `task.yml`,
 * not `task.md`.
 */

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
} from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Task } from './types.ts';

/** Ensures the task folder + subfolders exist. */
export function ensureTaskFolder(folderPath: string): void {
  mkdirSync(folderPath, { recursive: true });
  mkdirSync(join(folderPath, 'inputs'), { recursive: true });
  mkdirSync(join(folderPath, 'outputs'), { recursive: true });
  mkdirSync(join(folderPath, 'sessions'), { recursive: true });
}

/** Reads task.yml, returns the parsed Task. */
export function readTaskYaml(folderPath: string): Task {
  const path = join(folderPath, 'task.yml');
  const raw = readFileSync(path, 'utf8');
  const parsed = yaml.load(raw) as Task;
  // task.yml stores folder_path implicitly — refresh it from disk so that
  // moving the folder doesn't invalidate the manifest.
  parsed.folder_path = folderPath;
  return parsed;
}

/**
 * Writes task.yml atomically (write tmp, rename). The status.log file gets
 * a one-line append summarising the change so cheyu can grep history.
 */
export function writeTaskYaml(task: Task, statusNote?: string): void {
  ensureTaskFolder(task.folder_path);
  const path = join(task.folder_path, 'task.yml');
  const tmpPath = `${path}.tmp`;
  const yamlBody = yaml.dump(task, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
  writeFileSync(tmpPath, yamlBody, 'utf8');
  renameSync(tmpPath, path);

  if (statusNote) {
    const logPath = join(task.folder_path, 'status.log');
    const ts = new Date().toISOString();
    const line = `[${ts}] ${task.status} — ${statusNote}\n`;
    // Append (create if missing).
    const existing = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
    writeFileSync(logPath, existing + line, 'utf8');
  }
}
