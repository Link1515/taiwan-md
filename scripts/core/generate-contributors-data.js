#!/usr/bin/env node
/**
 * generate-contributors-data.js
 *
 * 產出 public/api/contributors.json — Dashboard Contribution Leaderboard 的資料層。
 *
 * 為什麼存在：
 *   - about.template.astro 裡 45 個 contributor card 是手動維護（易漏、易過時）
 *   - Dashboard 繁殖系統 section 需要 data-driven 的 top 20 leaderboard
 *   - 資料層抽象化：未來可以多個 consumer（about / dashboard / README / 孢子）共用
 *
 * 資料來源（雙軌）：
 *   1. GitHub /contributors endpoint — 權威的 login + avatar + commit 計數
 *      （避免 git log email → login 的對應模糊問題）
 *   2. git log — 活躍時段 + 檔案路徑分類（email 匹配）
 *
 * 輸出結構：
 *   {
 *     lastUpdated: "2026-04-19T...",
 *     totals: { contributors: 46 },
 *     leaderboard: [{ login, commits, avatarUrl, profileUrl, primaryArea, lastActiveAt }, ...],
 *     topContent, topSystem, topTranslation: [...],
 *     weeklyActive, monthlyActive,
 *     recentlyJoined: [...]
 *   }
 *
 * 執行時機：
 *   - npm run prebuild（加到 package.json）
 *   - scripts/tools/refresh-data.sh（間接）
 *
 * CI 行為：
 *   - GitHub API 必跑（prebuild chain 的一部分）
 *   - 失敗時 soft-fail：輸出 fallback 檔（只含 lastUpdated + 空 leaderboard），
 *     consumer 不會 404
 *
 * v1.0 | 2026-04-19 β — CheYu 指派，配合 gitignore prebuild-regen JSON refactor
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public/api/contributors.json');
const REPO = 'frank890417/taiwan-md';
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

// ─── Step 1: GitHub API contributors ─────────────────────────────────────────

function fetchGh(urlPath) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'taiwan-md-leaderboard/1.0',
        Accept: 'application/vnd.github+json',
      },
    };
    if (GH_TOKEN) opts.headers.Authorization = `Bearer ${GH_TOKEN}`;
    https
      .get(opts, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 120)}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function fetchContributors() {
  const all = [];
  for (let page = 1; page <= 4; page++) {
    const batch = await fetchGh(
      `/repos/${REPO}/contributors?per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  // 過濾 bot 類
  return all.filter(
    (c) =>
      c.login !== 'claude' && c.type !== 'Bot' && !c.login.endsWith('[bot]'),
  );
}

// ─── Step 2: git log 活躍時段 + 檔案分類 ─────────────────────────────────────

/**
 * 從 git log 匯總每個 email 的：firstAt, lastAt, content/system/translation 計數
 * 回傳 Map<email, { firstAt, lastAt, contentCommits, systemCommits, translationCommits }>
 */
function parseGitLog() {
  const SEP = '<<<__COMMIT__>>>';
  const out = execSync(
    `git log --no-merges --format='${SEP}%n%H%n%ae%n%ai' --name-only`,
    { cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );

  const byEmail = new Map();
  const commits = out.split(SEP).filter((c) => c.trim());

  for (const chunk of commits) {
    const lines = chunk.split('\n').filter((l) => l.length > 0);
    if (lines.length < 3) continue;
    const [hash, email, date, ...files] = lines;
    if (!email || !hash) continue;

    if (!byEmail.has(email)) {
      byEmail.set(email, {
        email,
        firstAt: date,
        lastAt: date,
        contentCommits: 0,
        systemCommits: 0,
        translationCommits: 0,
      });
    }
    const entry = byEmail.get(email);
    if (date < entry.firstAt) entry.firstAt = date;
    if (date > entry.lastAt) entry.lastAt = date;

    const hasKnowledge = files.some((f) => f.startsWith('knowledge/'));
    const hasSystem = files.some(
      (f) =>
        f.startsWith('src/') ||
        f.startsWith('scripts/') ||
        f.startsWith('.github/') ||
        f.startsWith('docs/') ||
        f === 'astro.config.mjs' ||
        f === 'package.json' ||
        f === '.gitignore',
    );
    const hasTranslation = files.some(
      (f) =>
        f.startsWith('knowledge/en/') ||
        f.startsWith('knowledge/ja/') ||
        f.startsWith('knowledge/ko/') ||
        f.startsWith('knowledge/es/') ||
        f.startsWith('knowledge/fr/') ||
        f.startsWith('src/i18n/'),
    );

    if (hasTranslation) entry.translationCommits += 1;
    else if (hasKnowledge) entry.contentCommits += 1;
    if (hasSystem) entry.systemCommits += 1;
  }

  return byEmail;
}

/**
 * 把 email map aggreagate 到 login：一個 GitHub 帳號可能有多個 email，
 * 用 email prefix fuzzy match（login ⊆ emailPrefix 或 emailPrefix ⊆ login）。
 * 同時保留手動 alias 覆蓋常見 mismatch。
 */
const MANUAL_ALIASES = {
  // GitHub login → known email prefixes
  frank890417: ['cheyu.wu', '117846+frank890417', 'frank890417'],
  dreamline2: ['wilsonchen', 'wilson.chen.dev'],
  ceruleanstring: ['chilan'],
  AgendaLu: ['a9600125a'],
  idlccp1984: ['idlccp64', 'idlccp1984'],
  Link1515: ['terrylin1515', 'link1515'],
  fredchu: ['iamfredchu', 'fredchu'],
  Johnwang860424: ['ihatechina198964', 'johnwang860424'],
};

function matchEmailToLogin(email, login) {
  const prefix = email.split('@')[0].toLowerCase();
  const loginL = login.toLowerCase();
  if (prefix === loginL) return true;
  if (prefix.includes('+')) {
    const afterPlus = prefix.split('+')[1];
    if (afterPlus === loginL) return true;
  }
  // Manual aliases
  const aliases = MANUAL_ALIASES[login] || [];
  if (aliases.some((a) => a.toLowerCase() === prefix)) return true;
  // Fuzzy: substring match both ways
  if (prefix.includes(loginL) || loginL.includes(prefix)) return true;
  return false;
}

function aggregateByLogin(contributors, emailStats) {
  const out = [];
  for (const c of contributors) {
    let firstAt = null;
    let lastAt = null;
    let content = 0,
      system = 0,
      translation = 0;
    for (const [email, stats] of emailStats.entries()) {
      if (!matchEmailToLogin(email, c.login)) continue;
      if (!firstAt || stats.firstAt < firstAt) firstAt = stats.firstAt;
      if (!lastAt || stats.lastAt > lastAt) lastAt = stats.lastAt;
      content += stats.contentCommits;
      system += stats.systemCommits;
      translation += stats.translationCommits;
    }
    const max = Math.max(content, system, translation);
    let primaryArea = 'other';
    if (max > 0) {
      if (max === translation) primaryArea = 'translation';
      else if (max === content) primaryArea = 'content';
      else if (max === system) primaryArea = 'system';
    }
    out.push({
      login: c.login,
      commits: c.contributions,
      avatarUrl: c.avatar_url,
      profileUrl: c.html_url,
      firstCommitAt: firstAt,
      lastCommitAt: lastAt,
      primaryArea,
      breakdown: { content, system, translation },
    });
  }
  out.sort((a, b) => b.commits - a.commits);
  return out;
}

// ─── Step 3: 輸出 ───────────────────────────────────────────────────────────

function buildPayload(authors) {
  const now = Date.now();
  const DAY = 86400 * 1000;

  const weeklyActive = authors.filter(
    (a) =>
      a.lastCommitAt && now - new Date(a.lastCommitAt).getTime() <= 7 * DAY,
  ).length;
  const monthlyActive = authors.filter(
    (a) =>
      a.lastCommitAt && now - new Date(a.lastCommitAt).getTime() <= 30 * DAY,
  ).length;

  const recentlyJoined = authors
    .filter(
      (a) =>
        a.firstCommitAt &&
        now - new Date(a.firstCommitAt).getTime() <= 30 * DAY,
    )
    .sort(
      (a, b) =>
        new Date(a.firstCommitAt).getTime() -
        new Date(b.firstCommitAt).getTime(),
    )
    .slice(0, 10);

  return {
    lastUpdated: new Date().toISOString(),
    totals: { contributors: authors.length, activeWindow: 'last 30d' },
    leaderboard: authors.slice(0, 20),
    topContent: authors.filter((a) => a.primaryArea === 'content').slice(0, 5),
    topSystem: authors.filter((a) => a.primaryArea === 'system').slice(0, 5),
    topTranslation: authors
      .filter((a) => a.primaryArea === 'translation')
      .slice(0, 5),
    weeklyActive,
    monthlyActive,
    recentlyJoined,
  };
}

function writeFallback(errorMsg) {
  // 2026-04-26 β8 fix: 不要在 API 失敗時 wipe 掉上一筆好的 leaderboard。
  // 觸發場景：CF Pages CI 共享 IP 與其他建置爭用 GitHub anon rate limit（60/hr），
  // 第 N 個 build 一定撞 403 → 之前每次都 writeFallback 全 0 → Dashboard 顯示 0
  // 貢獻者（事實是 50+）。修正：先讀現有 JSON，如果有 > 0 leaderboard，
  // **保留所有資料**，只在頂層加 staleness marker（lastUpdated 沿用、加 lastError）。
  // 只有「初次建置 + 沒有舊檔」或「舊檔本身也是空的」才寫真正的空 fallback。
  let existing = null;
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    }
  } catch (_) {
    /* corrupted file → fall through to fresh fallback */
  }

  if (
    existing &&
    Array.isArray(existing.leaderboard) &&
    existing.leaderboard.length > 0
  ) {
    // 保留上一筆好的資料；只更新 staleness 旗標。
    existing.lastError = errorMsg;
    existing.lastErrorAt = new Date().toISOString();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2), 'utf8');
    console.warn(
      `⚠️  保留上次成功的 leaderboard（${existing.leaderboard.length} 筆），` +
        `加 lastError 旗標。Dashboard 仍會顯示資料，只是 lastUpdated 不會推進。`,
    );
    return;
  }

  // 真正的初次建置 fallback：寫空檔（consumer 不會 404）
  const payload = {
    lastUpdated: new Date().toISOString(),
    totals: { contributors: 0, activeWindow: 'last 30d' },
    leaderboard: [],
    topContent: [],
    topSystem: [],
    topTranslation: [],
    weeklyActive: 0,
    monthlyActive: 0,
    recentlyJoined: [],
    error: errorMsg,
  };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

async function main() {
  console.log('👥 Generating contributors leaderboard...');

  let contributors;
  try {
    contributors = await fetchContributors();
    console.log(`   GitHub /contributors → ${contributors.length} users`);
  } catch (e) {
    console.warn(
      `⚠️  GitHub API 失敗（輸出 fallback 空 leaderboard）: ${e.message}`,
    );
    writeFallback(e.message);
    return;
  }

  const emailStats = parseGitLog();
  console.log(`   git log parsed → ${emailStats.size} unique emails`);

  const authors = aggregateByLogin(contributors, emailStats);
  const payload = buildPayload(authors);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');

  console.log(
    `   ✅ contributors.json — ${payload.totals.contributors} total / ` +
      `${payload.weeklyActive} weekly / ${payload.monthlyActive} monthly / ` +
      `top 3: ${payload.leaderboard
        .slice(0, 3)
        .map((a) => `${a.login}(${a.commits})`)
        .join(', ')}`,
  );
}

main().catch((e) => {
  console.error('❌ generate-contributors-data 失敗:', e);
  writeFallback(String(e.message || e));
  process.exit(0);
});
