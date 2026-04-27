/**
 * Daily reporter.
 *
 * Once per day (08:00 +0800 by default) we summarise the last 24h of harvest
 * activity into `reports/harvest/YYYY-MM-DD.md`. Optionally auto-commits
 * the file with a `🧬 [semiont] memory: harvest daily report YYYY-MM-DD`
 * message — gated by `HARVEST_AUTO_COMMIT_REPORT` because cheyu wants to
 * review the first few reports manually.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { config } from '../config.ts';
import { getDb } from '../db/client.ts';
import { child as childLogger } from '../logger.ts';
import { getTask } from '../tasks/manager.ts';
import type { Task } from '../tasks/types.ts';

const log = childLogger({ module: 'reporter/daily' });

export interface DailyReportResult {
  date: string;
  reportPath: string;
  counts: {
    completed: number;
    failed: number;
    blocked: number;
    awaitingCheyu: number;
    spawned: number;
  };
  committed: boolean;
}

/** Build today's report (or any date passed as YYYY-MM-DD). */
export async function generateDailyReport(
  date?: string,
): Promise<DailyReportResult> {
  const today = date ?? formatLocalDate(new Date());
  const cutoff = subDaysIso(today, 1);

  const db = getDb();
  const recentTasks = db
    .query<
      { id: string },
      [string, string]
    >('SELECT id FROM tasks WHERE updated_at >= ? OR created_at >= ?')
    .all(cutoff, cutoff);
  const tasks: Task[] = [];
  for (const row of recentTasks) {
    const t = getTask(row.id);
    if (t) tasks.push(t);
  }

  const completed = tasks.filter((t) => t.status === 'done');
  const failed = tasks.filter((t) => t.status === 'failed');
  const blocked = tasks.filter((t) => t.status === 'blocked');
  const awaitingCheyu = tasks.filter((t) => t.status === 'awaiting-cheyu');
  const inProgress = tasks.filter(
    (t) => t.status === 'in-progress' || t.status === 'spawning',
  );
  const pending = tasks.filter((t) => t.status === 'pending');

  // Sessions spawned in window.
  const sessionRows = db
    .query<
      { count: number },
      [string]
    >('SELECT COUNT(*) AS count FROM sessions WHERE spawned_at >= ?')
    .get(cutoff);
  const spawned = sessionRows?.count ?? 0;

  const md = renderReport({
    date: today,
    cutoff,
    completed,
    failed,
    blocked,
    awaitingCheyu,
    inProgress,
    pending,
    spawned,
  });

  mkdirSync(config.paths.reportsRoot, { recursive: true });
  const reportPath = join(config.paths.reportsRoot, `${today}.md`);
  writeFileSync(reportPath, md, 'utf8');

  // Index in DB.
  db.run(
    `INSERT INTO daily_reports (date, report_path, generated_at,
       tasks_completed, tasks_failed, tasks_blocked, tasks_awaiting_cheyu)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       report_path = excluded.report_path,
       generated_at = excluded.generated_at,
       tasks_completed = excluded.tasks_completed,
       tasks_failed = excluded.tasks_failed,
       tasks_blocked = excluded.tasks_blocked,
       tasks_awaiting_cheyu = excluded.tasks_awaiting_cheyu`,
    [
      today,
      reportPath,
      new Date().toISOString(),
      completed.length,
      failed.length,
      blocked.length,
      awaitingCheyu.length,
    ],
  );

  log.info(
    {
      date: today,
      reportPath,
      counts: {
        completed: completed.length,
        failed: failed.length,
        blocked: blocked.length,
        awaitingCheyu: awaitingCheyu.length,
        spawned,
      },
    },
    'daily report generated',
  );

  let committed = false;
  if (config.autoCommitReport) {
    try {
      await commitAndPush(reportPath, today);
      db.run('UPDATE daily_reports SET committed_at = ? WHERE date = ?', [
        new Date().toISOString(),
        today,
      ]);
      committed = true;
    } catch (err) {
      log.error({ err: String(err) }, 'failed to commit daily report');
    }
  }

  return {
    date: today,
    reportPath,
    counts: {
      completed: completed.length,
      failed: failed.length,
      blocked: blocked.length,
      awaitingCheyu: awaitingCheyu.length,
      spawned,
    },
    committed,
  };
}

interface RenderArgs {
  date: string;
  cutoff: string;
  completed: Task[];
  failed: Task[];
  blocked: Task[];
  awaitingCheyu: Task[];
  inProgress: Task[];
  pending: Task[];
  spawned: number;
}

function renderReport(a: RenderArgs): string {
  const total =
    a.completed.length +
    a.failed.length +
    a.blocked.length +
    a.awaitingCheyu.length +
    a.inProgress.length +
    a.pending.length;
  const lines: string[] = [];
  lines.push(`# 🧬 Taiwan.md Harvest — Daily Report ${a.date}`);
  lines.push('');
  lines.push(`> Window: from ${a.cutoff} to ${a.date} (last 24h).`);
  lines.push(`> Sessions spawned in window: **${a.spawned}**`);
  lines.push(`> Tasks touched in window: **${total}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('| --- | --- |');
  lines.push(`| done | ${a.completed.length} |`);
  lines.push(`| failed | ${a.failed.length} |`);
  lines.push(`| blocked | ${a.blocked.length} |`);
  lines.push(`| awaiting-cheyu | ${a.awaitingCheyu.length} |`);
  lines.push(`| in-progress | ${a.inProgress.length} |`);
  lines.push(`| pending | ${a.pending.length} |`);
  lines.push('');

  if (a.awaitingCheyu.length > 0) {
    lines.push('## Awaiting cheyu (review first)');
    lines.push('');
    lines.push(taskTable(a.awaitingCheyu));
    lines.push('');
  }
  if (a.failed.length > 0) {
    lines.push('## Failed');
    lines.push('');
    lines.push(taskTable(a.failed));
    lines.push('');
  }
  if (a.blocked.length > 0) {
    lines.push('## Blocked');
    lines.push('');
    lines.push(taskTable(a.blocked));
    lines.push('');
  }
  if (a.completed.length > 0) {
    lines.push('## Completed');
    lines.push('');
    lines.push(taskTable(a.completed));
    lines.push('');
  }
  if (a.inProgress.length > 0) {
    lines.push('## In progress');
    lines.push('');
    lines.push(taskTable(a.inProgress));
    lines.push('');
  }
  if (a.pending.length > 0) {
    lines.push('## Pending');
    lines.push('');
    lines.push(taskTable(a.pending));
    lines.push('');
  }

  lines.push('## Recommendations for cheyu');
  lines.push('');
  if (a.awaitingCheyu.length > 0) {
    lines.push(
      `- ${a.awaitingCheyu.length} task(s) need your call before they can move. Start there.`,
    );
  }
  if (a.failed.length > 0) {
    lines.push(
      `- ${a.failed.length} task(s) failed. Check logs under \`.harvest/tasks/{id}/sessions/\`.`,
    );
  }
  if (a.blocked.length > 0) {
    lines.push(
      `- ${a.blocked.length} task(s) blocked on dependencies — check whether the upstream is stuck.`,
    );
  }
  if (
    a.awaitingCheyu.length === 0 &&
    a.failed.length === 0 &&
    a.blocked.length === 0
  ) {
    lines.push('- All clear. Nothing requires your attention today.');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`_Generated by harvest backend at ${new Date().toISOString()}._`);
  lines.push('🧬');
  return lines.join('\n');
}

function taskTable(tasks: Task[]): string {
  if (tasks.length === 0) return '_(none)_';
  const rows: string[] = [];
  rows.push('| id | type | priority | title | last update |');
  rows.push('| --- | --- | --- | --- | --- |');
  for (const t of tasks) {
    const title = t.title.replace(/\|/g, '\\|');
    rows.push(
      `| \`${t.id}\` | ${t.type} | ${t.priority} | ${title} | ${t.updated_at} |`,
    );
  }
  return rows.join('\n');
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function subDaysIso(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function commitAndPush(reportPath: string, date: string): Promise<void> {
  await runGit(['add', reportPath]);
  await runGit([
    'commit',
    '-m',
    `🧬 [semiont] memory: harvest daily report ${date}`,
  ]);
  await runGit(['push']);
}

function runGit(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd: config.repoRoot });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args.join(' ')} exit ${code}: ${stderr}`));
    });
  });
}

/** True when the report has already been generated for that date. */
export function reportExists(date: string): boolean {
  return existsSync(join(config.paths.reportsRoot, `${date}.md`));
}
