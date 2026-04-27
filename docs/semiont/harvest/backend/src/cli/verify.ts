/**
 * `bun run verify` — Phase 1 MVP self-test.
 *
 * What it does (in this order, each step exits non-zero on failure):
 *   1. Boot the SQLite + boot profile loader.
 *   2. Run one scan against ARTICLE-INBOX (real file in repo).
 *   3. Print number of new tasks created.
 *   4. List tasks, print their IDs.
 *   5. Build a spawn prompt for the first task and print its length.
 *   6. Generate today's daily report (writes file).
 *   7. Print path of the generated report.
 *
 * cheyu can run this without booting the server to confirm everything wires.
 */

import { closeDb, getDb } from '../db/client.ts';
import { ArticleInboxAdapter } from '../intake/article-inbox.ts';
import { listTasks, reindexFromDisk } from '../tasks/manager.ts';
import { buildSpawnPrompt } from '../spawner/prompt-builder.ts';
import { generateDailyReport } from '../reporter/daily.ts';
import { loadProfiles } from '../spawner/boot-profiles.ts';
import { logger } from '../logger.ts';
import { config } from '../config.ts';

const lines: string[] = [];
function log(msg: string): void {
  lines.push(msg);
  console.log(msg);
}

log('— Harvest verify —');
log(`repoRoot: ${config.repoRoot}`);
log(`dbPath: ${config.dbPath}`);
log(`articleInbox: ${config.paths.articleInbox}`);

// 1. boot
getDb();
const profiles = loadProfiles();
log(`profiles loaded: ${Object.keys(profiles).join(', ')}`);

// 2. reindex
const reindexed = reindexFromDisk();
log(`reindexed tasks from disk: ${reindexed}`);

// 3. scan
const inbox = new ArticleInboxAdapter();
const detected = await inbox.scanOnce();
log(`new entries detected this scan: ${detected.length}`);

// 4. list
const tasks = listTasks({ limit: 5 });
log(`top 5 tasks (after scan): ${tasks.length}`);
for (const t of tasks)
  log(`  - ${t.id} [${t.status}/${t.priority}] ${t.type} :: ${t.title}`);

// 5. prompt for first task
if (tasks.length > 0) {
  const first = tasks[0]!;
  const prompt = buildSpawnPrompt(first);
  log(`built prompt for ${first.id}: ${prompt.length} chars`);
  log(`prompt preview (first 500 chars):\n${prompt.slice(0, 500)}\n...`);
}

// 6. daily report
const report = await generateDailyReport();
log(`daily report written: ${report.reportPath}`);
log(JSON.stringify(report.counts, null, 2));

logger.info('verify complete');
closeDb();
log('\nverify OK ✓');
