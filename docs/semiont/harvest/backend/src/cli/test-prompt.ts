/**
 * `bun run test:prompt` — synthesises a fake task in memory and renders the
 * full spawn prompt. Doesn't touch SQLite or the filesystem (beyond reading
 * profile YAML and template files). Pure smoke test for prompt-builder.
 */

import { config } from '../config.ts';
import { buildSpawnPrompt } from '../spawner/prompt-builder.ts';
import type { Task } from '../tasks/types.ts';
import { join } from 'node:path';

const fakeTask: Task = {
  schema_version: 1,
  id: '2026-04-27-999-fake-prompt-test',
  type: 'article-rewrite',
  boot_profile: 'content-writing',
  status: 'pending',
  priority: 'P1',
  title: '測試主題 — Phase 1 MVP 驗證',
  folder_path: join(config.paths.tasksRoot, '2026-04-27-999-fake-prompt-test'),
  created_at: new Date().toISOString(),
  created_by: 'test:prompt',
  updated_at: new Date().toISOString(),
  dependencies: [],
  blockers: [],
  sessions: [],
  attempts: 0,
  max_attempts: 3,
  notes: '純測試 — agent 不需要實際寫文章',
};

const prompt = buildSpawnPrompt(fakeTask);
console.log(prompt);
console.error(`\n--- prompt length: ${prompt.length} chars ---`);
