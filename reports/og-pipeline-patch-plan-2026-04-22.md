---
title: OG 圖片 pipeline 完整 patch 計劃
session: 2026-04-22 β
status: in-progress (CI cancelled after 621/1731; justfont rate-limited)
---

# OG 圖片 pipeline 完整 patch 計劃

## 背景

2026-04-22 β session merge #592 多語言 OG 後，接手架構統一：shot=1 + JPG 85 + CI 生成 + gitignore。首次 CI（commit `e8c3eded`，run 24778332607）跑到 621/1731 時發現：

1. **en 文章全部 font-timeout** — rixingsong 只對中文有意義，英文 CSS 不載入，每張等滿 12 秒 → 剩 1110 張 = ~3.7 小時浪費
2. **justfont SDK 疑似被 rate-limit** — 短時間 600+ 次 rapid request 後，justfont CDN 會封一段時間

已於 12:46 取消 CI。

## 架構調整（關鍵）

**從 justfont SDK 動態注入，改用 Google Fonts 思源明體（Noto Serif TC）**——**僅在 `?shot=1` 模式下套用**，正常網站瀏覽維持原本字體策略。

### 為什麼這個改動是對的

| 面向          | justfont SDK（現在）                  | Google Noto Serif TC（改後）               |
| ------------- | ------------------------------------- | ------------------------------------------ |
| 可靠性        | 需 SDK 異步注入，12s timeout 仍會失敗 | Google Fonts CDN，全球穩定                 |
| Rate limit    | 已觸發，lock 數小時                   | 無                                         |
| 載入時間      | 依 SDK 啟動 + CDN fetch，變數大       | `<link>` + `document.fonts.ready` ~1s 穩定 |
| 字體風格      | 日星鑄字「正體初號楷」（品牌特色）    | 思源明體（通用正體中文）                   |
| en/ja/ko 支援 | 不支援（僅中文）                      | 思源系列對 CJK 全支援                      |
| CI 首次時間   | ~4 小時（timeout 堆疊）               | ~10-12 分                                  |

**取捨**：OG 圖視覺從「日星鑄字品牌感」降到「思源明體通用感」。理由：

- OG 圖是 fleeting content（社群平台 thumbnail），不是 canonical 視覺資產
- Spore 圖（@taiwan_md Threads/X 發文用）可以繼續用 justfont，因為手動單張、不會觸發 rate limit
- 正常網站瀏覽仍用 justfont，品牌感保留在高互動頁面

## 問題清單

### 🔴 P0 — 阻擋首次 CI 能跑完

**P0-1：justfont 被 rate-limit**

- 現在即使 zh-TW 也抓不到 rixingsong 了
- 必須切換字體源

**P0-2：en/ja/ko font-timeout 全中**

- 英文/日文/韓文 CSS 沒載 rixingsong → 每張等 12 秒
- 切 Google Fonts 一起解決（Noto Serif TC 對所有語言都 OK）

### 🟠 P1 — 影響 incremental（每次 CI 都像首次）

**P1-1：git checkout 重設 mtime → 腳本誤判所有 md 為新**

- actions/checkout 設所有檔 mtime = checkout 當下時間
- md mtime > JPG mtime 永遠成立 → 全量重產

**P1-2：改模板不會觸發重產**

- 腳本只比 md mtime，不看模板 mtime

### 🟡 P2 — 成本優化

**P2-1：serial 產圖慢**

- 1 張 ~2.3s × 1731 = ~66 分鐘 serial
- 4 平行 worker 可降到 ~17 分

**P2-2：font-fallback 的圖永久降級**

- 目前若 font 沒載到，fallback serif 仍存檔；下次 CI mtime 機制不會 retry
- 改用 Google Fonts 後此問題大幅減輕（load 穩定）

## 完整 patch 範圍

### Patch 1：`src/pages/[category]/[slug].astro` 的 `?shot=1` 模式切 Google Fonts

在 article page 的 `<head>` 或 inline script 區加入條件式載入：

```html
<!-- shot=1 模式條件式載入 Google Fonts 思源明體 -->
<script is:inline>
  if (new URLSearchParams(location.search).get('shot') === '1') {
    const pc1 = document.createElement('link');
    pc1.rel = 'preconnect';
    pc1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pc1);

    const pc2 = document.createElement('link');
    pc2.rel = 'preconnect';
    pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = 'anonymous';
    document.head.appendChild(pc2);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700;900&display=swap';
    document.head.appendChild(link);
  }
</script>
```

```css
/* 在現有 html[data-shot='1'] global style 區內加這段 */
html[data-shot='1'] main.article-page .hero-title {
  font-family: 'Noto Serif TC', 'Source Han Serif TC', serif !important;
  font-weight: 900 !important;
}
```

備註：en/ja/ko 文章也適用，思源系列對 CJK 全覆蓋。

### Patch 2：`scripts/core/generate-og-images.mjs`

三個改動：

1. **Font wait 從 rixingsong 改成 Noto Serif TC**
2. **加入 TEMPLATE_FILES mtime 比對**
3. **平行化 4 worker**

```diff
+const TEMPLATE_FILES = [
+  'src/pages/[category]/[slug].astro',
+  'src/pages/en/[category]/[slug].astro',
+  'src/pages/ja/[category]/[slug].astro',
+  'src/pages/ko/[category]/[slug].astro',
+  'src/components/ArticleHero.astro',
+];

// 新增 templateMtimeMs 計算
+  const templateMtimeMs = Math.max(
+    ...TEMPLATE_FILES.map((f) => {
+      const full = join(repoRoot, f);
+      return existsSync(full) ? statSync(full).mtimeMs : 0;
+    }),
+  );

// toUpdate filter
-    return entry.mtimeMs > statSync(jpg).mtimeMs;
+    const jpgMtime = statSync(jpg).mtimeMs;
+    return entry.mtimeMs > jpgMtime || templateMtimeMs > jpgMtime;

// font wait — 從 rixingsong 檢測改成 Noto Serif TC via document.fonts API
-    return ff.toLowerCase().includes('rixing');
+    // 等 Noto Serif TC 載入完（Google Fonts 通常 <1s）
+    await page.evaluate(() => document.fonts.load('900 52px "Noto Serif TC"'));
+    await page.waitForFunction(
+      () => document.fonts.check('900 52px "Noto Serif TC"'),
+      { timeout: FONT_WAIT_MS, polling: 200 },
+    );

// serial for → parallel workers
+  const WORKERS = Number(process.env.OG_WORKERS || 4);
+  const queue = [...toUpdate];
+  let processed = 0;
+
+  async function worker(id) {
+    const ctx = await browser.newContext({ ... });
+    while (queue.length > 0) {
+      const entry = queue.shift();
+      if (!entry) break;
+      // 處理單張（同原邏輯）
+    }
+    await ctx.close();
+  }
+
+  await Promise.all(
+    Array.from({ length: WORKERS }, (_, i) => worker(i + 1))
+  );
```

### Patch 3：`.github/workflows/deploy.yml`

```diff
       - name: Checkout
         uses: actions/checkout@v4
         with:
           fetch-depth: 0

+      # 把檔案 mtime 從 git log 還原（修「每次 CI 都全量重產」bug）
+      - name: Restore mtime from git history
+        uses: chetan/git-restore-mtime-action@v2
+
       - name: Setup Node
         uses: actions/setup-node@v4
```

## 預期效能改善

| 場景                    | 當前（已 rate-limit）  | Patch 後                               |
| ----------------------- | ---------------------- | -------------------------------------- |
| **首次 CI（無 cache）** | ❌ 卡死（justfont 鎖） | ~10-12 分（Noto + 4 worker）           |
| **零改動的 push**       | ~20 分（mtime bug）    | ~1 分（cache hit + git-restore-mtime） |
| **改 1 篇 md**          | ~20 分                 | ~2 分（只產 1 張）                     |
| **改 hero 模板**        | ❌ 不會重產            | ~10 分（全量 + 平行）                  |

## 執行順序

1. ✅ 取消當前 CI（run 24778332607）
2. ⬜ Patch 1：article page 條件式載 Google Fonts + shot=1 CSS 切 Noto Serif TC
3. ⬜ Patch 2：腳本（font check 改 Noto、模板 mtime、平行化）
4. ⬜ Patch 3：deploy.yml 加 git-restore-mtime
5. ⬜ Local smoke test：
   - `npm run dev` → 開 `http://localhost:4321/people/李洋/?shot=1` 目視檢查字體對
   - `npm run og:generate -- --lang en --slug beef-noodle-soup --force` 應秒結束
   - `npm run og:generate -- --lang zh-TW --slug 李洋 --force` 確認 Noto Serif TC 套用
6. ⬜ Commit + push → 觀察新 CI
7. ⬜ 驗證：第一次 CI 預期 ~10-12 分；第二次 push（不改 md）應該 cache hit ~1 分

## Risk 與 Fallback

- **風險 1**：條件式載 Google Fonts 的 inline script 若 race condition → 改用 CSS `@import` 或直接 `<link>` 靜態載入（無條件但小成本）
- **風險 2**：平行 4 worker 若 dev server 壓掛 → 環境變數 `OG_WORKERS=2` 降級
- **風險 3**：git-restore-mtime 執行慢 → 若 >1 分可縮小範圍
- **Fallback**：SEO.astro 的 `existsSync` 網維持 — 即使 CI 生圖全掛，deploy 仍成功

## 延後項目

- **Phase 3**：Cloudflare Workers on-demand（需遷出 GitHub Pages）
- **品牌字體回歸**：若 justfont 解除 rate-limit，可考慮 zh-TW 用 rixingsong / 其他 lang 用 Noto 的混合策略
- **預生成 font subset**：把實際用到的中文字子集預先 subset，避免 Google Fonts 整個 TC（~5 MB）每次 CI 下載

---

_v1.0 | 2026-04-22 β — 首次 CI 壓測意外揭露 en/ja/ko font-timeout + justfont rate-limit_
_v1.1 | 同日 — 架構切換到 Google Noto Serif TC（僅 shot=1 模式），保留 justfont 給正常瀏覽_
