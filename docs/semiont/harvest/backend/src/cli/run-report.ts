/**
 * `bun run report` — generate today's daily report (or a specified date)
 * without booting the HTTP server. Useful for cron + ad-hoc verification.
 *
 * Usage:
 *   bun run report                # today
 *   bun run report 2026-04-27     # specific date
 */

import { generateDailyReport } from '../reporter/daily.ts';
import { logger } from '../logger.ts';
import { closeDb } from '../db/client.ts';

const date = process.argv[2];
const result = await generateDailyReport(date);
logger.info(result, 'report generated');
console.log(JSON.stringify(result, null, 2));
closeDb();
