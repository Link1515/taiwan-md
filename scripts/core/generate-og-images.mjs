#!/usr/bin/env node
/**
 * generate-og-images.mjs — 多語言 OG 圖片批次產生器
 *
 * 架構（2026-04-22 β 統一）：
 *   1. 不走獨立 `/og/[cat]/[slug]` 路由，改用文章頁 `?shot=1` 模式
 *      （與 scripts/tools/generate-spore-image.mjs 共用同一個渲染源
 *       — poster-style hero、justfont rixingsong-semibold、hide chrome）
 *   2. 輸出 **JPG 85** 而不是 PNG：1200×630 社交圖 PNG vs JPG 在 FB/
 *      Threads/X 視覺無差別，但體積降約 70%（150-300 KB → 40-80 KB）
 *   3. `public/og-images/` 不進 git（已加 .gitignore）— CI 或本地按需產生
 *
 * 用法：
 *   前置：在另一個 shell 跑 `npm run dev`（本腳本走 http://localhost:4321）
 *
 *   npm run og:generate                              # 所有語言全掃（incremental）
 *   npm run og:generate -- --lang zh-TW              # 只產 zh-TW
 *   npm run og:generate -- --lang ko --category food # 只產 ko/food
 *   npm run og:generate -- --slug 李洋               # 只產指定 slug（所有語言）
 *   npm run og:generate -- --force                   # 忽略 mtime 全部重產
 *
 * Incremental 邏輯：若 JPG 存在且 mtime ≥ 來源 md mtime → 跳過
 *
 * 輸出路徑：
 *   - zh-TW（default）：public/og-images/[category]/[slug].jpg
 *   - 其他語言        ：public/og-images/[lang]/[category]/[slug].jpg
 *
 * 為什麼用 `?shot=1` 而不是 `/og/[...path]` 獨立路由：
 *   一處維護：spore 與 OG 共用 article page 的 hero shot 樣式，品牌一致、
 *   不會出現「spore 好看但 OG 太樸素」或反向問題。獨立 /og/ 路由仍保留
 *   在 src/pages/og/[...path].astro，未來有需要時可以作為備用模板，但不
 *   再是 OG meta 的主要來源。
 */

import { chromium } from 'playwright';
import { statSync, mkdirSync, existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');

const knowledgeDir = join(repoRoot, 'knowledge');
const outDir = join(repoRoot, 'public', 'og-images');

const CATEGORY_MAP = {
  About: 'about',
  History: 'history',
  Geography: 'geography',
  Culture: 'culture',
  Food: 'food',
  Art: 'art',
  Music: 'music',
  Technology: 'technology',
  Nature: 'nature',
  People: 'people',
  Society: 'society',
  Economy: 'economy',
  Lifestyle: 'lifestyle',
};

const LANGUAGES = ['zh-TW', 'en', 'ja', 'ko'];
const DEFAULT_LANG = 'zh-TW';

const baseUrl = process.env.BASE_URL || 'http://localhost:4321';

// OG 標準 1200×630（~1.905:1）— 社交平台共通規格
const VIEWPORT = { width: 1200, height: 630 };
const JPEG_QUALITY = 85;
const FONT_WAIT_MS = 12000;

async function checkServer() {
  try {
    const res = await fetch(baseUrl + '/');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return true;
  } catch (err) {
    console.error(`\n❌ Cannot reach ${baseUrl}`);
    console.error(`   Run \`npm run dev\` in another shell first.\n`);
    return false;
  }
}

async function findMarkdownFiles(filterLang, filterCategory) {
  const results = [];
  const dirs = Object.keys(CATEGORY_MAP);
  const langsToScan = filterLang ? [filterLang] : LANGUAGES;

  for (const lang of langsToScan) {
    const isDefault = lang === DEFAULT_LANG;
    const langBasePath = isDefault ? knowledgeDir : join(knowledgeDir, lang);
    if (!existsSync(langBasePath)) continue;

    for (const folderName of dirs) {
      const categorySlug = CATEGORY_MAP[folderName];
      if (filterCategory && categorySlug !== filterCategory) continue;

      const folderPath = join(langBasePath, folderName);
      if (!existsSync(folderPath)) continue;

      const files = await readdir(folderPath);
      for (const file of files) {
        if (!file.endsWith('.md') || file.startsWith('_')) continue;
        const filePath = join(folderPath, file).normalize('NFC');
        const fileStat = await stat(filePath);
        results.push({
          lang,
          folderName,
          file,
          filePath,
          mtimeMs: fileStat.mtimeMs,
          categorySlug,
          slug: basename(file, '.md'),
        });
      }
    }
  }
  return results;
}

function outputPathFor(entry) {
  const isDefault = entry.lang === DEFAULT_LANG;
  const langPath = isDefault ? '' : entry.lang;
  const categoryOutDir = join(outDir, langPath, entry.categorySlug);
  return {
    dir: categoryOutDir,
    jpg: join(categoryOutDir, `${entry.slug}.jpg`),
  };
}

function articleUrlFor(entry) {
  const isDefault = entry.lang === DEFAULT_LANG;
  const encodedSlug = encodeURIComponent(entry.slug);
  // 注意：zh-TW 沒有 /zh-TW 前綴（default language mount at root）
  const base = isDefault
    ? `${baseUrl}/${entry.categorySlug}/${encodedSlug}/`
    : `${baseUrl}/${entry.lang}/${entry.categorySlug}/${encodedSlug}/`;
  return `${base}?shot=1`;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const eq = args.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.split('=')[1];
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : null;
  };
  const hasFlag = (name) => args.includes(`--${name}`);

  const filterLang = getArg('lang');
  const filterCategory = getArg('category');
  const filterSlug = getArg('slug');
  const force = hasFlag('force');
  const skipFontWait = hasFlag('no-font-wait');

  console.log(`\n🖼️  OG Image Generator (shot=1 mode, JPG ${JPEG_QUALITY})`);
  console.log(`   target  : ${baseUrl}`);
  console.log(`   viewport: ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(`   output  : public/og-images/`);
  if (filterLang) console.log(`   lang    : ${filterLang}`);
  if (filterCategory) console.log(`   category: ${filterCategory}`);
  if (filterSlug) console.log(`   slug    : ${filterSlug}`);
  if (force) console.log(`   mode    : --force (regenerate all)`);
  console.log('');

  const serverOk = await checkServer();
  if (!serverOk) process.exit(1);

  const entries = await findMarkdownFiles(filterLang, filterCategory);

  const toUpdate = entries.filter((entry) => {
    if (filterSlug && entry.slug !== filterSlug) return false;
    if (force) return true;
    const { jpg } = outputPathFor(entry);
    if (!existsSync(jpg)) return true;
    return entry.mtimeMs > statSync(jpg).mtimeMs;
  });

  if (toUpdate.length === 0) {
    console.log(`✅ No images need (re)generation.\n`);
    return;
  }
  console.log(`📝 ${toUpdate.length} images queued.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1, // OG 不需 retina，CDN 體積優先
    reducedMotion: 'reduce',
  });

  let succeeded = 0;
  let failed = 0;
  const startTime = Date.now();

  try {
    for (let i = 0; i < toUpdate.length; i++) {
      const entry = toUpdate[i];
      const { dir, jpg } = outputPathFor(entry);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      const url = articleUrlFor(entry);
      const progress = `[${i + 1}/${toUpdate.length}]`;
      process.stdout.write(
        `${progress} ${entry.lang}/${entry.categorySlug}/${entry.slug} ... `,
      );

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

        // Wait for justfont rixingsong-semibold（與 spore pipeline 一致）
        if (!skipFontWait) {
          try {
            await page.waitForFunction(
              () => {
                const h1 = document.querySelector('.hero-title');
                if (!h1) return false;
                const ff = getComputedStyle(h1).fontFamily || '';
                return ff.toLowerCase().includes('rixing');
              },
              { timeout: FONT_WAIT_MS, polling: 200 },
            );
          } catch (_) {
            // fallback serif — 繼續產圖，警告但不中止
            process.stdout.write(`(font-timeout) `);
          }
        }

        // extra paint settle
        await page.waitForTimeout(300);

        await page.screenshot({
          path: jpg,
          type: 'jpeg',
          quality: JPEG_QUALITY,
          clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
          animations: 'disabled',
        });

        console.log(`✓`);
        succeeded++;
      } catch (err) {
        console.log(`✗ ${err.message}`);
        failed++;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (succeeded / parseFloat(elapsed)).toFixed(2);
  const mark = failed === 0 ? '✅' : '⚠️';
  console.log(
    `\n${mark}  ${succeeded}/${toUpdate.length} generated in ${elapsed}s (${rate} img/s)${failed ? `, ${failed} failed` : ''}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
