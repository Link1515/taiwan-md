/**
 * `bun run scan-inbox` — runs one ARTICLE-INBOX scan synchronously, then exits.
 *
 * Useful for verifying the intake without leaving a server running.
 */

import { ArticleInboxAdapter } from '../intake/article-inbox.ts';
import { closeDb } from '../db/client.ts';
import { logger } from '../logger.ts';

const inbox = new ArticleInboxAdapter();
const detected = await inbox.scanOnce();
logger.info({ count: detected.length }, 'scan complete');
console.log(JSON.stringify(detected, null, 2));
closeDb();
