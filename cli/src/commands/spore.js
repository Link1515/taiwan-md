/**
 * Taiwan.md Spore Command — 社群孢子 pipeline
 *
 * Read SPORE-LOG.md + dashboard-spores.json for spore tracking.
 * new/harvest subcommands are scaffolded in v0.6 (need Threads + X API tokens).
 *
 * Usage:
 *   taiwanmd spore                  # show SPORE-LOG summary
 *   taiwanmd spore log --limit 10   # show recent spores
 *   taiwanmd spore log --json
 *   taiwanmd spore new <slug>       # [scaffold] generate spore draft
 *   taiwanmd spore harvest <id>     # [scaffold] pull d+N engagement
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getApiPath, getKnowledgePath } from '../lib/knowledge.js';
import { ensureData } from '../lib/ensure-data.js';

function getSporeLogPath() {
  const kPath = getKnowledgePath();
  const repoRoot = path.resolve(kPath, '..');
  return path.join(repoRoot, 'docs', 'factory', 'SPORE-LOG.md');
}

/**
 * Parse SPORE-LOG markdown table into structured entries.
 */
function parseSporeLog(content) {
  const entries = [];
  const lines = content.split('\n');
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| #')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (line.startsWith('| ---')) continue;
    if (!line.startsWith('| ')) {
      if (inTable && line.trim() === '') inTable = false;
      continue;
    }
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 7) continue;
    const [id, date, lang, platform, slug, category, template, urlCell] = cells;
    if (!/^\d+$/.test(id)) continue;
    const urlMatch = urlCell && urlCell.match(/\((https?:\/\/[^)]+)\)/);
    entries.push({
      id: parseInt(id, 10),
      date,
      lang,
      platform,
      slug,
      category,
      template,
      url: urlMatch ? urlMatch[1] : null,
      published: !!urlMatch,
    });
  }
  return entries.sort((a, b) => b.id - a.id);
}

function platformColor(p) {
  if (p === 'Threads') return chalk.cyan;
  if (p === 'X') return chalk.white;
  return chalk.gray;
}

export function sporeCommand(program) {
  const spore = program
    .command('spore')
    .description(
      '社群孢子 pipeline — SPORE-LOG reader + draft/harvest scaffold',
    )
    .action(() => {
      // Default action: show summary
      showSummary();
    });

  spore
    .command('log')
    .description('Show SPORE-LOG recent entries')
    .option('--limit <n>', 'Max rows', '15')
    .option('--platform <p>', 'Filter: Threads | X')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const logPath = getSporeLogPath();
        if (!fs.existsSync(logPath)) {
          console.error(chalk.red(`\n❌ SPORE-LOG not found: ${logPath}\n`));
          process.exit(1);
        }
        const content = fs.readFileSync(logPath, 'utf8');
        let entries = parseSporeLog(content);
        if (opts.platform) {
          entries = entries.filter((e) => e.platform === opts.platform);
        }
        const limit = parseInt(opts.limit, 10) || 15;
        entries = entries.slice(0, limit);

        if (opts.json) {
          console.log(JSON.stringify(entries, null, 2));
          return;
        }

        console.log('');
        console.log(
          chalk.bold(`🌱 SPORE-LOG — latest ${entries.length} spores`),
        );
        console.log('');
        for (const e of entries) {
          const pub = e.published ? chalk.green('✓') : chalk.gray('·');
          const plat = platformColor(e.platform)(e.platform.padEnd(8));
          const slug = chalk.white((e.slug || '').slice(0, 30).padEnd(31));
          const cat = chalk.gray(`[${e.category || '?'}]`.padEnd(12));
          const lang = chalk.gray(e.lang);
          console.log(
            `  ${pub} #${String(e.id).padStart(3)} ${e.date} ${lang} ${plat} ${slug} ${cat}`,
          );
          if (e.url) {
            console.log(chalk.gray(`         ${e.url}`));
          }
        }
        console.log('');
      } catch (err) {
        console.error(chalk.red(`\n❌ Failed: ${err.message}\n`));
        process.exit(1);
      }
    });

  spore
    .command('new <slug>')
    .description('[scaffold v0.6] Generate spore draft from an article')
    .action((slug) => {
      console.log(chalk.yellow('\n⚠ spore new — scaffold only in v0.6'));
      console.log(
        chalk.gray(`  Planned: generate draft for article "${slug}"`),
      );
      console.log(
        chalk.gray('  Per SPORE-PIPELINE v2.5: Scene-List-Scene structure,'),
      );
      console.log(
        chalk.gray('  platform-specific (Threads Chinese punctuation, X CTA).'),
      );
      console.log(
        chalk.gray(
          '  Needs: src/data/spore-templates.json + CheYu approval loop.\n',
        ),
      );
    });

  spore
    .command('harvest <id>')
    .description('[scaffold v0.6] Pull d+N engagement from Threads + X')
    .action((id) => {
      console.log(chalk.yellow('\n⚠ spore harvest — scaffold only in v0.6'));
      console.log(chalk.gray(`  Planned: fetch metrics for spore #${id}`));
      console.log(
        chalk.gray(
          '  Needs: Threads + X API tokens in ~/.taiwanmd/config.json',
        ),
      );
      console.log(
        chalk.gray('  Output → append to SPORE-LOG + dashboard-spores.json\n'),
      );
    });

  async function showSummary() {
    try {
      await ensureData({ quiet: true });
      const logPath = getSporeLogPath();
      if (!fs.existsSync(logPath)) {
        console.error(chalk.red(`\n❌ SPORE-LOG not found: ${logPath}\n`));
        process.exit(1);
      }
      const entries = parseSporeLog(fs.readFileSync(logPath, 'utf8'));
      const published = entries.filter((e) => e.published);
      const byPlatform = {};
      for (const e of published) {
        byPlatform[e.platform] = (byPlatform[e.platform] || 0) + 1;
      }
      console.log('');
      console.log(chalk.bold('🌱 Spore Pipeline — summary'));
      console.log('');
      console.log(`  Total spores:   ${chalk.white(entries.length)}`);
      console.log(`  Published:      ${chalk.green(published.length)}`);
      console.log(
        `  Draft/pending:  ${chalk.yellow(entries.length - published.length)}`,
      );
      console.log('');
      console.log(chalk.bold('  By platform:'));
      for (const [p, n] of Object.entries(byPlatform)) {
        console.log(`    ${platformColor(p)(p.padEnd(10))} ${n}`);
      }
      if (entries[0]) {
        console.log('');
        console.log(chalk.bold('  Latest spore:'));
        console.log(
          `    #${entries[0].id} ${entries[0].date} ${platformColor(entries[0].platform)(entries[0].platform)} · ${entries[0].slug}`,
        );
      }
      console.log('');
      console.log(chalk.gray('  taiwanmd spore log         # recent entries'));
      console.log(
        chalk.gray('  taiwanmd spore new <slug>  # draft (scaffold)'),
      );
      console.log('');
    } catch (err) {
      console.error(chalk.red(`\n❌ Failed: ${err.message}\n`));
      process.exit(1);
    }
  }
}
