/**
 * Taiwan.md Audit Command — Stage 3.5 Hallucination Audit
 *
 * Local runner for REWRITE-PIPELINE Stage 3.5 HALLUCINATION AUDIT.
 * Detects the 5 hallucination patterns documented in MANIFESTO §10:
 *   1. Award hallucination (XXXX 年獲第 N 屆 YYY 獎)
 *   2. Names + precise numbers (English names + exact minutes/percentages)
 *   3. Location displacement (foreign city names without source)
 *   4. Fabricated direct quotes (「 」 attributed to specific speaker)
 *   5. Co-creator omission (「共同創辦」but only one name)
 *
 * Usage:
 *   taiwanmd audit 珍珠奶茶
 *   taiwanmd audit 王新仁 --json
 *   taiwanmd audit 台積電 --strict
 *   taiwanmd audit 吳哲宇 --fix-interactive
 */

import path from 'path';
import chalk from 'chalk';
import { getArticleFiles, readArticle } from '../lib/knowledge.js';
import { ensureData } from '../lib/ensure-data.js';

// Pattern 1: Award claims — "第 N 屆/第 N 次 XX 獎"
const AWARD_PATTERNS = [
  /第\s*(?:\d+|[一二三四五六七八九十百]+)\s*屆[^。，\n]{0,30}獎/g,
  /第\s*(?:\d+|[一二三四五六七八九十百]+)\s*次[^。，\n]{0,30}獎/g,
  /\d{4}\s*年[^。，\n]{0,10}獲[^。，\n]{0,25}獎/g,
  /\d{4}\s*年[^。，\n]{0,10}(?:榮獲|得獎|首獎|入圍)/g,
];

// Pattern 2: English names + precise numbers (likely NYU student / intern / collaborator pattern)
const NAME_NUMBER_PATTERNS = [
  // English name + precise minute count
  /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)[^。，\n]{0,40}?(\d{2,4})\s*(?:分鐘|mins?|minutes)/g,
  // English name + specific session/semester count
  /([A-Z][a-z]+)[^。，\n]{0,20}?(?:跟了|陪了|花了)[^。，\n]{0,15}?(\d+)\s*(?:學期|週|次)/g,
];

// Pattern 3: Location mentions — foreign city names that might be hallucinated
// We flag foreign city names appearing without adjacent footnote reference
const FOREIGN_CITIES = [
  '盧森堡',
  '米蘭',
  '巴黎',
  '柏林',
  '倫敦',
  '紐約',
  '東京',
  '首爾',
  '阿姆斯特丹',
  '斯德哥爾摩',
  '維也納',
  '蘇黎世',
  '布魯塞爾',
  '哥本哈根',
  '赫爾辛基',
  '布拉格',
  '華沙',
  '雅典',
  '羅馬',
];

// Pattern 4: Direct quote with attribution
const QUOTE_PATTERNS = [
  // Full-width quotes with surrounding context suggesting attribution
  /「[^」]{15,200}」/g,
];

// Pattern 5: Co-creator omission — "共同創辦/聯合發起/合作" without multiple names
const COCREATOR_PATTERNS = [
  /共同創辦了\s*(?!.*?(?:和|與|及))[^，。\n]{0,40}/g,
  /共同創立了\s*(?!.*?(?:和|與|及))[^，。\n]{0,40}/g,
  /聯合發起了\s*(?!.*?(?:和|與|及))[^，。\n]{0,40}/g,
];

/**
 * Extract line number for a match in the body.
 */
function getLineNumber(body, matchIndex) {
  return body.slice(0, matchIndex).split('\n').length;
}

/**
 * Find an article file by slug (searches all article files).
 */
function findArticleBySlug(slug) {
  try {
    const files = getArticleFiles();
    const exact = files.find((f) => path.basename(f, '.md') === slug);
    if (exact) return exact;
    const partial = files.find((f) => path.basename(f, '.md').includes(slug));
    return partial || null;
  } catch {
    return null;
  }
}

/**
 * Check if a line has a footnote reference ([^N]) within distance.
 */
function hasNearbyFootnote(body, matchIndex, window = 200) {
  const start = Math.max(0, matchIndex - window);
  const end = Math.min(body.length, matchIndex + window);
  const snippet = body.slice(start, end);
  return /\[\^[\w-]+\]/.test(snippet);
}

/**
 * Extract all potentially hallucinated claims from body.
 */
function extractClaims(body) {
  const claims = {
    award: [],
    nameNumber: [],
    location: [],
    quote: [],
    cocreator: [],
  };

  // Pattern 1: Awards
  for (const pattern of AWARD_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(body)) !== null) {
      const line = getLineNumber(body, m.index);
      const hasFootnote = hasNearbyFootnote(body, m.index);
      claims.award.push({
        line,
        text: m[0].trim(),
        hasFootnote,
        severity: hasFootnote ? 'warn' : 'high',
      });
    }
  }

  // Pattern 2: Name + precise numbers
  for (const pattern of NAME_NUMBER_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(body)) !== null) {
      const line = getLineNumber(body, m.index);
      const hasFootnote = hasNearbyFootnote(body, m.index);
      claims.nameNumber.push({
        line,
        text: m[0].trim().slice(0, 100),
        name: m[1],
        number: m[2],
        hasFootnote,
        severity: hasFootnote ? 'warn' : 'high',
      });
    }
  }

  // Pattern 3: Foreign city without adjacent footnote
  for (const city of FOREIGN_CITIES) {
    const regex = new RegExp(city, 'g');
    let m;
    while ((m = regex.exec(body)) !== null) {
      const line = getLineNumber(body, m.index);
      const hasFootnote = hasNearbyFootnote(body, m.index, 150);
      // Only flag if no nearby footnote
      if (!hasFootnote) {
        claims.location.push({
          line,
          text: city,
          context: body.slice(Math.max(0, m.index - 30), m.index + 30).trim(),
          severity: 'med',
        });
      }
    }
  }

  // Pattern 4: Direct quotes
  for (const pattern of QUOTE_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(body)) !== null) {
      const line = getLineNumber(body, m.index);
      const hasFootnote = hasNearbyFootnote(body, m.index, 100);
      claims.quote.push({
        line,
        text: m[0].slice(0, 60) + (m[0].length > 60 ? '...」' : ''),
        full: m[0],
        hasFootnote,
        severity: hasFootnote ? 'info' : 'warn',
      });
    }
  }

  // Pattern 5: Co-creator without multiple names
  // Check 40 chars BEFORE the phrase for co-creator indicators like
  // 「跟 X 共同創辦了」or「和 X 共創」. If present, skip (no omission).
  for (const pattern of COCREATOR_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(body)) !== null) {
      const line = getLineNumber(body, m.index);
      const contextBefore = body.slice(Math.max(0, m.index - 40), m.index);
      if (/(?:跟|和|與|及)[\u4e00-\u9fff\w]{1,15}$/.test(contextBefore)) {
        continue; // co-creator named before "共同創辦"
      }
      claims.cocreator.push({
        line,
        text: m[0].trim(),
        severity: 'high',
      });
    }
  }

  return claims;
}

/**
 * Compute verdict from claim counts.
 */
function computeVerdict(claims, strict) {
  const highFlags =
    claims.award.filter((c) => c.severity === 'high').length +
    claims.nameNumber.filter((c) => c.severity === 'high').length +
    claims.cocreator.filter((c) => c.severity === 'high').length;
  const warnFlags =
    claims.award.filter((c) => c.severity === 'warn').length +
    claims.nameNumber.filter((c) => c.severity === 'warn').length +
    claims.quote.filter((c) => c.severity === 'warn').length +
    claims.location.length;

  if (highFlags > 0) {
    return {
      status: 'fail',
      label: '❌ HIGH-severity flags detected — do not merge',
      exitCode: 1,
    };
  }
  if (strict && warnFlags > 0) {
    return {
      status: 'fail',
      label: '⚠️  Strict mode: warnings treated as failures',
      exitCode: 1,
    };
  }
  if (warnFlags > 0) {
    return {
      status: 'warn',
      label: '⚠️  Warnings — review before merge',
      exitCode: 0,
    };
  }
  return {
    status: 'pass',
    label: '✅ No hallucination patterns detected',
    exitCode: 0,
  };
}

function printClaimSection(title, claims, opts) {
  if (claims.length === 0) {
    console.log(`  ${chalk.gray(title)}: ${chalk.green('0 flags')}`);
    return;
  }
  const highCount = claims.filter((c) => c.severity === 'high').length;
  const warnCount = claims.filter((c) => c.severity === 'warn').length;
  const medCount = claims.filter((c) => c.severity === 'med').length;
  const infoCount = claims.filter((c) => c.severity === 'info').length;

  const flags = [];
  if (highCount) flags.push(chalk.red(`${highCount} high`));
  if (warnCount) flags.push(chalk.yellow(`${warnCount} warn`));
  if (medCount) flags.push(chalk.yellow(`${medCount} med`));
  if (infoCount) flags.push(chalk.gray(`${infoCount} info`));

  console.log(`  ${chalk.white(title)}: ${flags.join(', ')}`);
  for (const c of claims.slice(0, 5)) {
    const sev =
      c.severity === 'high'
        ? chalk.red('⚠ HIGH')
        : c.severity === 'warn'
          ? chalk.yellow('⚠ WARN')
          : c.severity === 'med'
            ? chalk.yellow('· MED')
            : chalk.gray('· info');
    const text = c.text.length > 70 ? c.text.slice(0, 70) + '...' : c.text;
    console.log(`    ${sev} L${c.line}: ${chalk.gray(text)}`);
  }
  if (claims.length > 5) {
    console.log(`    ${chalk.gray(`... +${claims.length - 5} more`)}`);
  }
}

export function auditCommand(program) {
  program
    .command('audit <slug>')
    .description(
      'Run Stage 3.5 Hallucination Audit locally (MANIFESTO §10 enforcer)',
    )
    .option('--json', 'Output as JSON')
    .option(
      '--strict',
      'Treat warnings as failures (exit 1 on any flag)',
      false,
    )
    .option(
      '--fix-interactive',
      'Interactive mode to mark flags as verified [not yet implemented]',
    )
    .action(async (slug, opts) => {
      try {
        await ensureData({ quiet: true });
        const filePath = findArticleBySlug(slug);
        if (!filePath) {
          const msg = `找不到文章: "${slug}". 請確認 slug 正確，或先執行 taiwanmd sync。`;
          if (opts.json) {
            console.log(JSON.stringify({ error: msg }, null, 2));
          } else {
            console.error(chalk.red(`\n❌ ${msg}\n`));
          }
          process.exit(1);
        }

        const { frontmatter, body } = readArticle(filePath);
        const claims = extractClaims(body);
        const verdict = computeVerdict(claims, opts.strict);

        const totalClaims =
          claims.award.length +
          claims.nameNumber.length +
          claims.location.length +
          claims.quote.length +
          claims.cocreator.length;

        if (opts.json) {
          console.log(
            JSON.stringify(
              {
                slug,
                title: frontmatter.title,
                filePath,
                verdict: verdict.status,
                label: verdict.label,
                totalClaims,
                patterns: {
                  award: claims.award,
                  nameNumber: claims.nameNumber,
                  location: claims.location,
                  quote: claims.quote,
                  cocreator: claims.cocreator,
                },
              },
              null,
              2,
            ),
          );
          process.exit(verdict.exitCode);
        }

        console.log('');
        console.log(
          chalk.bold(
            `🧬 Stage 3.5 Hallucination Audit — ${frontmatter.title || slug}`,
          ),
        );
        console.log(chalk.gray(`   ${filePath}`));
        console.log('');
        console.log(chalk.bold('Phase 1: Claim Table'));
        console.log(`  ${totalClaims} potential factual claims extracted`);
        console.log(
          `  ${claims.award.length} award · ${claims.nameNumber.length} name+number · ${claims.location.length} location · ${claims.quote.length} quote · ${claims.cocreator.length} co-creator`,
        );
        console.log('');
        console.log(chalk.bold('Phase 2: 5-Pattern Flags'));
        printClaimSection('[1] Award hallucination', claims.award, opts);
        printClaimSection(
          '[2] Names + precise numbers',
          claims.nameNumber,
          opts,
        );
        printClaimSection('[3] Location displacement', claims.location, opts);
        printClaimSection('[4] Direct quotes', claims.quote, opts);
        printClaimSection('[5] Co-creator omission', claims.cocreator, opts);
        console.log('');
        console.log(chalk.bold('Phase 3: Verification Checklist'));
        if (verdict.status === 'pass') {
          console.log(chalk.green('  ✅ No action required'));
        } else {
          console.log(chalk.gray('  For each flag above:'));
          console.log(chalk.gray('  - Locate the source URL that backs it'));
          console.log(chalk.gray('  - If no source: downgrade or delete'));
          console.log(chalk.gray('  - If single source: mark single_source'));
          console.log(
            chalk.gray('  - If the subject is a person: confirm with them'),
          );
        }
        console.log('');
        console.log(chalk.bold(`Verdict: ${verdict.label}`));
        console.log(
          chalk.gray(
            '  Reference: MANIFESTO §10 幻覺鐵律 + REWRITE-PIPELINE Stage 3.5',
          ),
        );
        console.log('');
        process.exit(verdict.exitCode);
      } catch (err) {
        console.error(chalk.red(`\n❌ Audit failed: ${err.message}\n`));
        process.exit(1);
      }
    });
}
