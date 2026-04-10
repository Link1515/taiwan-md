# TAILWIND-CHEATSHEET.md — 遷移對照表

> Phase 3+ 的 leaf component 遷移用這份對照表。看到舊 class pattern，換成右邊的 `tw-*`。
>
> **原則**：
>
> - 優先用 cheatsheet 裡的對應 — 這些 class 已經從 tokens 抽象出來，改一處全站同步
> - cheatsheet 沒對應的 → 直接用 plain CSS + `var(--token)` 寫在 component scoped style（還沒 refactor 完，但是 tokens 是 SSOT）
> - **不要**自己加 hex color、magic spacing 數字 — 用 `var(--...)` 從 `src/styles/tokens.css`
> - **不要**用 `@apply` — Phase 2 刻意避開 Tailwind 的 `@import` 以閃掉 preflight（詳見 `src/styles/global.css` 頂部註解）

---

## 快速索引

| 舊 pattern                        | 新 class                                                           | 位置                           |
| --------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 包版型到 1380px / 1180px / 1080px | `tw-container-wide` / `tw-container-page` / `tw-container-reading` | 任何 section 最外層            |
| hero / section 垂直內距           | `tw-section-y`                                                     | 搭配 container 使用            |
| 主要 CTA 按鈕                     | `tw-btn tw-btn-primary`                                            | 「開始探索」、「Contribute」等 |
| 次要按鈕 / 下載按鈕               | `tw-btn tw-btn-outline`                                            | 「下載 SVG」、「Copy code」等  |
| 無框按鈕（icon button）           | `tw-btn tw-btn-ghost`                                              | Header 語言切換等              |
| 白底卡片                          | `tw-card`                                                          | 一般卡片                       |
| 淺灰底卡片                        | `tw-card-soft`                                                     | 次級卡片 / empty state         |
| 浮凸卡片                          | `tw-card-elevated`                                                 | Featured / highlighted         |
| 分類徽章 / 標籤                   | `tw-chip`                                                          | 分類 badge、meta item          |
| 細邊標籤                          | `tw-tag`                                                           | Frontmatter tags、inline 標記  |
| 圓角過濾按鈕                      | `tw-pill`                                                          | Filter bar、quick filter       |
| 卡片 hover 浮起動畫               | `tw-hover-lift`                                                    | 搭配 `tw-card` 使用            |
| 頂部導航連結                      | `tw-nav-link`                                                      | Header 主要連結                |
| 下拉選單項目                      | `tw-dropdown-item`                                                 | Header dropdown                |
| 文章內文排版                      | `tw-prose`                                                         | `.article-body` 包裝           |
| 區塊 kicker 小標                  | `tw-kicker`                                                        | `🗺️ 開源地圖資料集` 這種       |
| 大區塊標題                        | `tw-section-title`                                                 | `為什麼台灣的形狀重要`         |
| 小區塊標題                        | `tw-subsection-title`                                              | `SVG 輪廓 — 直接嵌入` 這種     |

---

## 詳細對照

### 1. Container

**舊寫法**（散落在各 component 的 scoped style）：

```css
.feature-grid {
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 2vw, 2rem);
}
```

**新寫法**：

```html
<div class="tw-container-wide">...</div>
```

對應表：

| 舊 max-width         | 新 class               |
| -------------------- | ---------------------- |
| `1380px` / `wide`    | `tw-container-wide`    |
| `1180px` / `page`    | `tw-container-page`    |
| `1080px` / `reading` | `tw-container-reading` |

---

### 2. Section vertical rhythm

**舊**：

```css
.hero-section {
  padding: clamp(3.5rem, 7vw, 6rem) 0;
}
```

**新**：

```html
<section class="tw-section-y">...</section>
```

---

### 3. Buttons

| 舊 class                           | 新 class                |
| ---------------------------------- | ----------------------- |
| `btn-primary` / `btn-cta`          | `tw-btn tw-btn-primary` |
| `btn-secondary` / `btn-outline`    | `tw-btn tw-btn-outline` |
| `btn-ghost` / 沒邊框的 icon button | `tw-btn tw-btn-ghost`   |

**注意**：`tw-btn` 是 base，必須搭配一個 variant。三個一起用會撞（後者贏）。

```html
<!-- 主要 CTA -->
<a href="/contribute/" class="tw-btn tw-btn-primary">開始貢獻</a>

<!-- 下載按鈕 -->
<a
  href="/assets/svg/taiwan-icon-wiki.svg"
  download
  class="tw-btn tw-btn-outline"
  >下載 SVG</a
>

<!-- 語言切換 -->
<button class="tw-btn tw-btn-ghost">EN</button>
```

---

### 4. Cards

| 舊 pattern                          | 新 class           |
| ----------------------------------- | ------------------ |
| 白底 + 細邊 + 圓角 20               | `tw-card`          |
| 淺灰底 + 細邊 + 圓角 20             | `tw-card-soft`     |
| 白底 + 細邊 + 圓角 20 + shadow-card | `tw-card-elevated` |
| 任何卡片加 transform + shadow hover | 加 `tw-hover-lift` |

**組合範例**：

```html
<article class="tw-card tw-hover-lift">
  <h3 class="tw-subsection-title">台灣國防現代化</h3>
  <p>...</p>
</article>
```

---

### 5. Chip / tag / pill

| 舊 pattern                        | 新 class  | 用途                 |
| --------------------------------- | --------- | -------------------- |
| 淺灰底 + 圓角 16px + 4×10 padding | `tw-chip` | Category badge、meta |
| 透明底 + 1px 邊 + 2×8 padding     | `tw-tag`  | Frontmatter tags     |
| 白底 + 圓角 full + 6×14 padding   | `tw-pill` | Filter bar           |

---

### 6. Navigation

**舊 `.nav-link`**：

```css
.nav-link {
  color: #475569;
  font-weight: 600;
  font-family: 'Noto Sans TC', sans-serif;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #1a1a2e;
}
```

**新**：

```html
<a href="/" class="tw-nav-link">首頁</a>
<a href="/" class="tw-nav-link is-active">首頁（active）</a>
```

**舊 `.dropdown-item`** → 新 `tw-dropdown-item`（用法同）。

---

### 7. Article body

**舊**：

```astro
<div class="article-body">
  <slot />
</div>
<style>
  .article-body {
    font-family: var(--font-reading);
    font-size: 1rem;
    line-height: 1.85;
    color: #1a1a2e;
  }
  .article-body p + p {
    margin-top: 1rem;
  }
</style>
```

**新**：

```astro
<div class="tw-prose">
  <slot />
</div>
```

**注意**：`tw-prose` 只包 base typography。標題樣式 (h1-h6) 仍由 Layout.astro 的 global `<style>` 控制（Phase 4 才會遷移）。

---

### 8. Section titles

| 元素                                  | 新 class              | 範例                                                     |
| ------------------------------------- | --------------------- | -------------------------------------------------------- |
| 上方 kicker 標籤（🗺️ 開源地圖資料集） | `tw-kicker`           | `<p class="tw-kicker">...</p>`                           |
| 大 section 標題                       | `tw-section-title`    | `<h2 class="tw-section-title">為什麼台灣的形狀重要</h2>` |
| 子區塊標題                            | `tw-subsection-title` | `<h3 class="tw-subsection-title">SVG 輪廓</h3>`          |

---

## 遷移 SOP（給 Phase 3 的 AI agent）

對每一個 leaf component：

```bash
# 1. 切新 branch
git checkout -b refactor/tw-<component-kebab-name>

# 2. 捕獲當前 baseline（如果 main 剛動過的話）
npm run build && npm run preview &
npm run visual:baseline

# 3. 讀要遷移的檔案
cat src/components/<Component>.astro

# 4. 對照 cheatsheet
#    - 找到每個 class 的新對應
#    - 沒對應的 → 是否值得加進 cheatsheet？如果單次使用就保留為 scoped
#    - hex color / magic number → 查 tokens.css 有無對應 var()

# 5. 改 HTML 裡的 class
#    - 舊:  class="card-soft hover-lift"
#    - 新:  class="tw-card-soft tw-hover-lift"

# 6. 整塊刪 <style> 區塊（不要留半邊）

# 7. 跑 build + visual diff
npm run build
npm run visual:capture
npm run visual:diff

# 8. 任何 diff > 0.5% 都要檢查：
#    - 真的 regression → 修到一致
#    - 只是 anti-alias / font-swap → 接受
#    - changelog 內容漂移 → 忽略（重生成 baseline）

# 9. Commit
git commit -m "refactor(tw): migrate <ComponentName> to tw-* classes"

# 10. 更新 REFACTOR-LOG 打勾 + 任何視覺微調

# 11. Push + PR
```

---

## 新增 `tw-*` class 的時機

Phase 3 遷移時發現有重複出現的 pattern 不在 cheatsheet 裡，且：

- ✅ 出現在 **≥ 3 個 component**
- ✅ 未來 Phase 4/5 也會用到
- ✅ 可以完全用 tokens.css 的 var() 寫出來

→ 加進 `global.css` 的 `@layer components`，同時更新這份 cheatsheet。

**不要**為了單次使用而加 class。單次 → 保留為 component scoped style，下次再看。

---

## 什麼時候保留 scoped `<style>`

就算 Phase 3+ 基本目標是「把 scoped style 全刪」，有些情況還是留著：

1. **複雜動畫 / keyframes** — 不值得搬
2. **一次性的特殊效果** — 不會被別的 component 用到
3. **容器查詢 / 複雜 media query** — 如果寫 plain CSS 比 utility 清楚就留
4. **子元素選擇器** — `.parent :global(svg)` 這種 scoped 特殊需求

**原則**：Phase 3 目標是降低認知成本，不是把所有 CSS 搬到同一個檔案。剩下 5-10 個合理的 scoped style 是可以的。

---

_Created: 2026-04-10, Phase 2_
_Maintainer: 任何遇到 cheatsheet 缺項的人，請直接 PR 更新這份文件_
