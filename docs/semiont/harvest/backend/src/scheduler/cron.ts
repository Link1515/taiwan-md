/**
 * Tiny in-process cron.
 *
 * MVP fires only one job: daily report at 08:00 +0800. We use setTimeout —
 * compute the next 08:00 wall-clock time, sleep, fire, recompute. No
 * external cron deps (per strategy report §8.2).
 *
 * Future: we'll add D+7 spore harvest, GA refresh, etc. Each new schedule
 * registers via `scheduleDaily(hour, minute, fn)`.
 */

import { child } from '../logger.ts';
import { generateDailyReport } from '../reporter/daily.ts';

const log = child({ module: 'scheduler/cron' });

interface Job {
  name: string;
  hour: number;
  minute: number;
  /** TZ offset in minutes (e.g. +480 for +0800). */
  tzOffsetMin: number;
  run: () => Promise<void> | void;
  timer?: ReturnType<typeof setTimeout>;
}

const TAIPEI_OFFSET_MIN = 8 * 60;

const jobs: Job[] = [];

export function scheduleDaily(
  name: string,
  hour: number,
  minute: number,
  run: () => Promise<void> | void,
  tzOffsetMin: number = TAIPEI_OFFSET_MIN,
): void {
  const job: Job = { name, hour, minute, tzOffsetMin, run };
  jobs.push(job);
  arm(job);
}

function arm(job: Job): void {
  const delayMs = msUntilNext(job.hour, job.minute, job.tzOffsetMin);
  job.timer = setTimeout(async () => {
    log.info({ job: job.name }, 'cron firing');
    try {
      await job.run();
      log.info({ job: job.name }, 'cron job complete');
    } catch (err) {
      log.error({ job: job.name, err: String(err) }, 'cron job failed');
    } finally {
      arm(job); // re-arm for tomorrow
    }
  }, delayMs);
  log.info(
    {
      job: job.name,
      fireInMs: delayMs,
      fireInMin: Math.round(delayMs / 60000),
    },
    'cron armed',
  );
}

/** Compute milliseconds until the next HH:MM in the given TZ offset. */
export function msUntilNext(
  hour: number,
  minute: number,
  tzOffsetMin: number,
): number {
  const now = new Date();
  // Convert "now" to the target TZ wall-clock by adding offset.
  const nowTz = new Date(now.getTime() + tzOffsetMin * 60_000);
  const targetTz = new Date(nowTz);
  targetTz.setUTCHours(hour, minute, 0, 0);
  if (targetTz <= nowTz) targetTz.setUTCDate(targetTz.getUTCDate() + 1);
  return targetTz.getTime() - nowTz.getTime();
}

export function startScheduler(): void {
  scheduleDaily('daily-report', 8, 0, async () => {
    await generateDailyReport();
  });
  log.info({ jobs: jobs.map((j) => j.name) }, 'scheduler started');
}

export function stopScheduler(): void {
  for (const job of jobs) {
    if (job.timer) clearTimeout(job.timer);
    job.timer = undefined;
  }
  log.info('scheduler stopped');
}

let _paused = false;
export function pauseScheduler(): void {
  if (_paused) return;
  stopScheduler();
  _paused = true;
}
export function resumeScheduler(): void {
  if (!_paused) return;
  startScheduler();
  _paused = false;
}
export function isPaused(): boolean {
  return _paused;
}
