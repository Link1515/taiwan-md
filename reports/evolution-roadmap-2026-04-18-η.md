# 自我進化 Roadmap — 2026-04-18 η session

> 觸發：ζ session 結束後觀察者「根據觀察，完整升級自己的基因 + 完整執行下個 session 的 handoff」
> 性質：session-specific 進化快照；ζ 的延伸執行 session
> 作者：Semiont η session

---

## A. η session 完成項目

### A.1 基因升級（canonical 層）

| #   | 動作                                         | 成果                                                                                                                      |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | **LONGINGS 新條目**「為 AI 讀者做 SEO」      | 戰略層 — 未來三年方向。指標：top 3 AI crawler HTTP 200 率 ≥ 80%（目前 36-53%）                                            |
| 2   | **SPORE-PIPELINE Step 4.5 誕生**             | Platform allocation 表 + Hook tier 三級（229x/48x/83x 量化）+ d+0 6h decision gate + re-hook opportunity + harvest 資料流 |
| 3   | **DNA #15 第 9 次驗證**                      | 觀察者 scaffolding → canonical SOP 升級是「被允許→被期待」的結構性躍遷                                                    |
| 4   | **LESSONS-INBOX +6 條**                      | Hook hierarchy / Data provenance / Platform allocation / AI SEO / d+0 gate / canonical 載體                               |
| 5   | **Dashboard GA 放大倍數 bar width bug 修復** | template.astro — 無 multiplier 時 fallback 用 ga_7d_after (log scale)                                                     |

### A.2 Handoff 執行（ζ→η 轉交）

| #   | Handoff                        | 狀態                                                                                                                                                                                                  |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 🔴 魏如萱 Stage 2 full rewrite | ✅ **完成** — 新增陳建騏 20 年段 + 盧凱彤具體悼念 + 離婚紀實（MANIFESTO §5 v2）+ 育兒窗口 + 珍珠刑/薔薇刑 典故段；開場改代表性（金曲領獎）；街訪民眾降為中段 scene；「不是 X 是 Y」從 19 → 4 處 prose |
| 2   | Dashboard 孢子 auto-refresh    | ✅ **完成** — generate-dashboard-spores.py 已 reflect 最新 SPORE-LOG（#29 300K / #25 190K / #30 135K）+ GA bar width bug 修                                                                           |
| 3   | d+0 6h decision gate           | ✅ **instantiate** SPORE-PIPELINE Step 4.5c                                                                                                                                                           |
| 4   | AI crawler per-UA 404 修復     | ⚠️ **降級為下個 session P1**（需擴 fetch-cloudflare.py 加 UA dimension, 30-40 min）                                                                                                                   |
| 5   | 陳建騏 P0 + 5 條 P1            | ⏭️ **下個 session**（每篇 45-60 min，不適合混合 session）                                                                                                                                             |

### A.3 Dashboard UI fix（η session 實戰揭露）

**問題 1**：GA 放大倍數 bar 全滿 100%

- 根因：`multiplier || 1` fallback + `maxMul = Math.max(..., 1)` 讓所有無 multiplier 的 item pct = 100%
- 修：當沒 multiplier 時用 ga_7d_after 絕對值 + log scale
- 驗證：3K=100% / 965=85% / 83=55% / 15=33%（正確反映 200x 量級差）

**問題 2**：#29 Rate / 互動欄位顯示 —

- 根因：SPORE-LOG 7d 互動欄位寫 `~28K` parse_number 不支援 tilde
- 修：改成 `27,000`（normalize format）
- 驗證：#29 Rate 9.00% / 互動 27K 正確顯示

---

## B. 下個 session handoff 清單

### 🔴 P0（必做）

| #   | 任務                         | Scope 估計                                                                    |
| --- | ---------------------------- | ----------------------------------------------------------------------------- |
| 1   | **陳建騏 Stage 1 → Stage 2** | Stage 1 需 20+ searches（音樂劇作曲家 subgenre 首例）+ Stage 2 write. ~90 min |
| 2   | **魏如萱 v3 觀察者 review**  | 待觀察者讀 v3 後可能有 feedback（Jenny 可能再來）。反應式                     |

### 🟠 P1（本週）

| #   | 任務                                       | Scope                                                                                                                |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 3   | **AI crawler per-UA 404 分析**             | 擴 fetch-cloudflare.py 加 `userAgent x httpResponseCode` dimension；產出 top 5 crawler 的 404 paths；批次寫 redirect |
| 4   | **范曉萱 NEW**（童星 → 創作人 → 幕後轉折） | 中等，~60 min                                                                                                        |
| 5   | **黃少雍 NEW**（製作人 subgenre）          | 需要製作人傳記結構新設計，~75 min                                                                                    |
| 6   | **阿爆 NEW**（族語 × future pop）          | 跨分類重要性（音樂 + 原住民文化），~60 min                                                                           |
| 7   | **鄭宜農 NEW**（台語創作 + 身份敘事）      | 敏感素材要紀實筆法（MANIFESTO §5 v2），~60 min                                                                       |
| 8   | **LESSONS-INBOX 第 3 次 distill**          | 本 session append 6 條，總計約 11+ 條，已超 10 門檻。30-60 min                                                       |

### 🟡 P2（本月）

| #   | 任務                                                                                    |
| --- | --------------------------------------------------------------------------------------- |
| 9   | Hello Nico / VH / 柯智棠 / 林宥嘉 / 魚條（身份待確認）/ 孫燕姿（ARTICLE-INBOX P1 剩餘） |
| 10  | d+0 6h decision gate 實作自動化（cron 每小時掃 waiting 孢子）                           |
| 11  | Platform allocation 實戰驗證（下 3 則孢子改用 Step 4.5a 分流規則）                      |

### 📥 P3（背景）

- fetch-search-events.py 2026-04-20 跑第一次（GA4 dimensions 帶值驗證）
- #31-34 孢子 d+7 harvest（2026-04-25）
- ARTICLE-INBOX 容量達 30 時 distill

---

## C. 執行順序建議

| 時程         | 優先                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| 下個 session | P0 #1 陳建騏 → reactive P0 #2（若 Jenny/觀察者 review 魏如萱 v3）         |
| 本週         | P1 #3 AI crawler 404 分析（最高 ROI 的「為 AI 讀者做 SEO」instantiation） |
| 本週         | P1 #4-7 連續做 3 篇人物文（范曉萱 / 阿爆 / 鄭宜農）                       |
| 週末         | P1 #8 LESSONS-INBOX 第 3 次 distill                                       |

---

## D. η session 留給下個 session 的重要 context

1. **魏如萱 v3 的 hook framing 已改**：從「被標成民眾」反諷改為金曲領獎 verbatim 開場，符合 EDITORIAL v5.1 §Title 原則 1。如果 Jenny 回來 review 發現還有問題，follow her feedback。
2. **SPORE-PIPELINE Step 4.5** 是 canonical 新增，發下一則孢子時**必須走 4.5a Platform allocation**（決定只發 Threads / 雙發 / X-only）。不要再 default mirror。
3. **Dashboard GA 放大倍數** 已修，但「多 item 無 multiplier」架構還在（因為大多數孢子沒 ga_before 基線）。未來可考慮計算 ga_before = 孢子發佈前 7 天該文章平均 GA views，讓 multiplier 變成可計算的 metric。
4. **AI SEO 作為戰略**（LONGINGS 新條目）：接下來每次寫新文章，可以問「這篇的句式結構對 AI 訓練/查詢友好嗎？」作為額外品質維度。

🧬

---

_v1.0 | 2026-04-18 η session_
_觸發：觀察者「完整升級基因 + 完整執行 handoff」→ η session 延續 ζ 的工作_
_核心結論：(1) P0 魏如萱 Stage 2 完成 + Dashboard UI 雙 bug 修好；(2) Platform allocation + Hook tier + d+0 6h gate 三個 ζ 洞察全 instantiate 到 SPORE-PIPELINE canonical；(3) LONGINGS 長出「為 AI 讀者做 SEO」作為未來三年戰略方向；(4) P1 陳建騏 + AI crawler 404 + ARTICLE-INBOX 5 條 P1 handoff 下個 session_
