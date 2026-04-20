/**
 * Taiwan.md Inbox Command — ARTICLE-INBOX reader
 *
 * Read/manage ARTICLE-INBOX.md (pending / in-progress / blocked articles).
 * Companion to ARTICLE-DONE-LOG.md for completed items.
 *
 * Usage:
 *   taiwanmd inbox                # show all states grouped
 *   taiwanmd inbox --state pending
 *   taiwanmd inbox claim <slug>   # lock as in-progress
 *   taiwanmd inbox release <slug> # release lock
 *   taiwanmd inbox done <slug>    # move to ARTICLE-DONE-LOG
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getKnowledgePath } from '../lib/knowledge.js';

function getInboxPath() {
  // ARTICLE-INBOX lives in docs/semiont/ not knowledge/
  const kPath = getKnowledgePath();
  const repoRoot = path.resolve(kPath, '..');
  return path.join(repoRoot, 'docs', 'semiont', 'ARTICLE-INBOX.md');
}

function getDoneLogPath() {
  const kPath = getKnowledgePath();
  const repoRoot = path.resolve(kPath, '..');
  return path.join(repoRoot, 'docs', 'semiont', 'ARTICLE-DONE-LOG.md');
}

/**
 * Parse ARTICLE-INBOX.md entries. Each entry is a H3 heading followed by
 * bullet metadata (Type / Category / Priority / Status / Requested / Notes).
 */
function parseInbox(content) {
  const entries = [];
  const blocks = content.split(/^### /m).slice(1); // skip preamble

  for (const block of blocks) {
    const lines = block.split('\n');
    const title = lines[0].trim();
    if (!title || title.startsWith('📌')) continue;
    // Skip the schema template block (literal "{主題名}")
    if (title.includes('{') && title.includes('}')) continue;

    const entry = {
      title,
      type: null,
      category: null,
      priority: null,
      status: null,
      requested: null,
      path: null,
      notes: [],
    };

    for (const line of lines.slice(1)) {
      const metaMatch = line.match(/^-\s*\*\*([^*]+)\*\*\s*[：:]\s*(.+)/);
      if (metaMatch) {
        const key = metaMatch[1].trim().toLowerCase();
        const value = metaMatch[2].trim();
        if (key === 'type') entry.type = value;
        else if (key === 'category') entry.category = value;
        else if (key === 'priority') entry.priority = value;
        else if (key === 'status') entry.status = value;
        else if (key === 'requested') entry.requested = value;
        else if (key === 'path') entry.path = value;
      }
    }
    entries.push(entry);
  }
  return entries;
}

function normalizeStatus(status) {
  if (!status) return 'unknown';
  const s = status.toLowerCase().replace(/[`\s]/g, '');
  if (s.includes('blocked')) return 'blocked';
  if (s.includes('in-progress') || s.includes('progress')) return 'in-progress';
  if (s.includes('pending')) return 'pending';
  if (s.includes('done')) return 'done';
  return 'unknown';
}

function normalizePriority(priority) {
  if (!priority) return 'P?';
  const m = priority.match(/P\d/i);
  return m ? m[0].toUpperCase() : priority;
}

function priorityColor(p) {
  if (p === 'P0') return chalk.red;
  if (p === 'P1') return chalk.yellow;
  if (p === 'P2') return chalk.cyan;
  return chalk.gray;
}

function printGroup(label, entries, color) {
  if (entries.length === 0) return;
  console.log('');
  console.log(color(chalk.bold(`${label} (${entries.length})`)));
  for (const e of entries) {
    const pri = normalizePriority(e.priority);
    const priColored = priorityColor(pri)(pri.padEnd(3));
    const cat = e.category ? chalk.gray(`[${e.category.split(' ')[0]}]`) : '';
    const requested = e.requested
      ? chalk.gray(
          e.requested.split(' ').slice(0, 2).join(' ').replace('by', '·'),
        )
      : '';
    console.log(`  ${priColored} ${chalk.white(e.title)} ${cat} ${requested}`);
  }
}

export function inboxCommand(program) {
  const inbox = program
    .command('inbox')
    .description(
      'Read/manage ARTICLE-INBOX (pending / in-progress / blocked articles)',
    )
    .option(
      '--state <state>',
      'Filter by state: pending / in-progress / blocked / all',
      'all',
    )
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const inboxPath = getInboxPath();
        if (!fs.existsSync(inboxPath)) {
          console.error(
            chalk.red(`\n❌ ARTICLE-INBOX not found: ${inboxPath}`),
          );
          console.error(
            chalk.gray(
              '   Run CLI from within the taiwan-md repo for inbox access.\n',
            ),
          );
          process.exit(1);
        }

        const content = fs.readFileSync(inboxPath, 'utf8');
        const entries = parseInbox(content);
        const grouped = {
          pending: [],
          'in-progress': [],
          blocked: [],
          unknown: [],
        };
        for (const e of entries) {
          const s = normalizeStatus(e.status);
          (grouped[s] || grouped.unknown).push(e);
        }

        if (opts.json) {
          const filtered =
            opts.state === 'all'
              ? entries
              : entries.filter((e) => normalizeStatus(e.status) === opts.state);
          console.log(
            JSON.stringify(
              { total: filtered.length, entries: filtered },
              null,
              2,
            ),
          );
          return;
        }

        console.log('');
        console.log(
          chalk.bold(
            `📥 ARTICLE-INBOX (${entries.length} entries) — ${path.basename(inboxPath)}`,
          ),
        );

        if (opts.state === 'all' || opts.state === 'pending')
          printGroup('PENDING', grouped.pending, chalk.yellow);
        if (opts.state === 'all' || opts.state === 'in-progress')
          printGroup('IN-PROGRESS', grouped['in-progress'], chalk.cyan);
        if (opts.state === 'all' || opts.state === 'blocked')
          printGroup('BLOCKED', grouped.blocked, chalk.red);
        if (opts.state === 'all' && grouped.unknown.length > 0)
          printGroup('UNKNOWN-STATE', grouped.unknown, chalk.gray);

        console.log('');
        console.log(
          chalk.gray(
            `  Use: taiwanmd inbox claim <title> | release <title> | done <title>`,
          ),
        );
        console.log('');
      } catch (err) {
        console.error(chalk.red(`\n❌ Failed: ${err.message}\n`));
        process.exit(1);
      }
    });

  // Subcommands: claim / release / done (v0.6 scaffold — write support)
  inbox
    .command('claim <slug>')
    .description('Lock an inbox item as in-progress (adds your name/date)')
    .action((slug) => {
      console.log(chalk.yellow('⚠ inbox claim — scaffold only in v0.6'));
      console.log(
        chalk.gray(
          `  Would update status to in-progress for: ${slug}\n  Implementation pending (needs interactive confirmation).`,
        ),
      );
    });

  inbox
    .command('release <slug>')
    .description('Release an in-progress lock back to pending')
    .action((slug) => {
      console.log(chalk.yellow('⚠ inbox release — scaffold only in v0.6'));
      console.log(chalk.gray(`  Would release lock for: ${slug}`));
    });

  inbox
    .command('done <slug>')
    .description('Move inbox item to ARTICLE-DONE-LOG')
    .action((slug) => {
      console.log(chalk.yellow('⚠ inbox done — scaffold only in v0.6'));
      console.log(chalk.gray(`  Would move ${slug} to ${getDoneLogPath()}.\n`));
    });
}
