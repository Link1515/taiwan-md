# 每日心跳報告 2026-04-11

> 觸發：09:37 Asia/Taipei 排程（自動心跳 γ session）
> 前置 session：α（翻譯審核+DNA進化）、β（PageHero組件+聲景SSOT）

---

## 生命徵象快照

| 器官                 | 分數   | 趨勢 | 備注              |
| -------------------- | ------ | ---- | ----------------- |
| 心臟（內容引擎）     | 90     | ↑    | 452篇，7天+65篇   |
| 免疫（品質防疫）     | 98     | ↑    | 人工審核98.5%     |
| DNA（遺傳密碼）      | 95     | ↑    | EDITORIAL 4/7更新 |
| 骨架（技術架構）     | 90     | →    | PageHero組件新建  |
| 呼吸（自動化循環）   | 85     | →    | 3個workflow       |
| 繁殖（社群繁殖力）   | 85     | ↑    | 54位貢獻者        |
| 感知（外部感知）     | 90     | →    | GA4+SC+CF三源就緒 |
| **翻譯（語言器官）** | **66** | →    | **最弱器官**      |

**與昨日比較（α、β session 已大量處理）：**

- α session 合併了 27 個翻譯 PR（138篇ja+1es+1i18n）
- β session 建立了 PageHero 共用元件（-780行重複代碼）

**三源感知快照（cache from 02:26 今日 α session）：**

- Cloudflare：26,139 requests, 8,429 pageviews, 6,508 uniques
- GA4：3,070 active users, 8,133 page views, avg session 168s
- Search Console：986 clicks, 3,410 impressions, CTR 28.9%

---

## 觀察到的問題

### P0（緊急）

無。Build正常，無社群緊急事項。

### P1（系統性問題）

- **bad_fn_format: 348篇** — 腳註格式不符合 `[^n]: [Name](URL) — description` 規範。主要模式：
  1. URL嵌入link text內（`[^1]: [description text](URL)`，描述在括號裡不在破折號後）
  2. Chinese comma替代em dash（`[^n]: [Name](URL)，Chinese text`）
  3. 無描述（`[^n]: [Name](URL)`）
     → **無法完全自動修復**（模式一需人工重寫），但模式二可腳本化處理（低優先，約10-30篇）
- **no_overview: 149篇** — 缺30秒概覽blockquote。這是格式缺口，影響讀者體驗。
- **翻譯器官66分** — ja覆蓋率57%（257/452），ko只有6%（28/452），es只有7.7%（35/452）

### P2（內容品質）

Quality scan最差5篇（今日前）：

- culture/台灣婚喪喜慶與人生禮俗.md [14分]
- society/動物園與展演動物倫理.md [14分]
- people/葉丙成.md [14分] → **本次修復，降至6分**
- nature/台灣穿山甲.md [14分]
- music/台灣聲音地景.md [14分]

### 平行session留下的待辦

- α session：translation-ratio-check.sh 新工具已建，但12篇歷史TRUNCATED英文翻譯尚未修復
- β session：Nav overview-first 改動 6 dropdowns，需要確認手機版 UX

---

## 本次處理

### 修了什麼

**1. 3個斷開的延伸閱讀連結**（format-check BROKEN_LINKS修復）：

- `knowledge/Lifestyle/台灣咖啡文化.md`：`/culture/台灣手搖飲文化` → `/food/台灣手搖飲文化`
- `knowledge/People/嚴長壽.md`：`/culture/台灣原住民文化` → `/culture/台灣原住民族16族文化地圖`
- `knowledge/Culture/台灣宗教與寺廟文化.md`：`/culture/台灣原住民文化` → `/culture/台灣原住民族16族文化地圖`
- 三檔同步到 `src/content/zh-TW/`

**2. 葉丙成.md 品質修復**（14分→6分）：

- 加入30秒概覽blockquote（修復 no_overview）
- 改掉教科書開場（"葉丙成是教授"→機率課堂具體場景）
- 每個段落增加密度（稀薄段落×3 → 段落實質內容補足）
- 加入3個footnote（修復 citation-desert）
- `lastHumanReview: false` 標注（待人工複審）
- 同步到 `src/content/zh-TW/`

### 造了什麼新橋

- 無新工具（bad_fn_format auto-fix評估後決定不造：模式一需人工重寫，強制自動化會降低品質）
- 記錄了 bad_fn_format 的三個主要模式作為診斷資料

### 刻意保留沒修的

- 其他4篇質量最差文章（台灣婚喪喜慶、動物園倫理、穿山甲、聲景）：全部是「未人工審核」，自動重寫風險高，等人類觀察者介入
- bad_fn_format 348篇的批次修復：影響範圍大，需要哲宇決策

---

## 進化軌跡

- **品質掃描能力**：葉丙成 從worst-5排除，quality scan 高度可疑 196→195篇
- **破壞連結修復**：format-check BROKEN_LINKS 3→0
- **heartbeat 報告機制建立**：首份 daily-heartbeat-YYYY-MM-DD.md 正式建立

---

## 明日待續

**P1：**

- 12篇歷史 TRUNCATED 英文翻譯（en語言器官）
- bad_fn_format 模式二（Chinese comma → em dash）腳本化評估

**P2：**

- culture/台灣婚喪喜慶與人生禮俗.md（score 14，未人工審核，需人類觸發）
- society/動物園與展演動物倫理.md（score 14，未人工審核）
- music/台灣聲音地景.md（score 14，未人工審核）

**P3：**

- Issue #316「建議要有副標題」— 還沒看，值得評估
- Issue #288「ThunderKO用語查核」— 需要哲宇判斷政治立場
- Issue #229「英文文章舊版翻譯自動化」— 大型議題，需要roadmap討論

---

## 一句話收尾

今日心跳完整：α清翻譯債、β建PageHero骨架、γ修斷鏈+升葉丙成。三核心輪替，無碰撞。翻譯器官66分仍是最弱肢，等待下一次輸血。

---

# δ session 補篇 — 新聞 probe + bad_fn_format 自動修補

> session δ — Opus 4.6（1M context），下午由觀察者觸發
> 觀察者明確要求：(1) 新聞分析探知 (2) 完整跑心跳循環

## δ 額外處理

### 1. 4/11 新聞 probe 報告

寫入 `reports/probe/2026-04-11.md`，含三部分：

- **A. 對 4/8 probe gap 的進度盤點**：5 個 P0/P1 缺口（殯葬文化 / 台股 / 國防 / 公衛 / 無人機）→ **5/5 全部填補**。「probe → 後續心跳逐步填補」這個 loop 正式走通一輪。
- **B. 今日（4/11）熱點新聞**：
  - 🔴 **鄭習會**（4/10 北京，國共領導人睽違 10 年再會）+ 行政院 / 陸委會 / AIT / 解放軍 同步施壓
  - 🟠 **NCAIR 國家AI機器人中心揭幕**（4/10 賴清德 台南沙崙，2026-2029 投入 NT$200 億）
  - 🟡 人口連 27 月負成長（新生兒止跌回升）、TSMC Q1 創紀錄、TMTS 2026
- **C. 今日新缺口**：
  - ❌ P0 — 2026 鄭習會與國共雙線深度分析
  - ❌ P1 — 台灣機器人產業（NCAIR + 200 億 + AI 計畫 2.0）
  - ❌ P1 — 韓國瑜 / 鄭麗文 / 蕭美琴 三個高熱度政治人物頁完全缺
  - ⚠️ AI 5 篇全偏軟體，**無機器人專文**（粒度盲點）

INDEX 已補登。

### 2. 造橋 — `scripts/tools/fix-fn-comma.sh`

γ session 在 P1 列了 bad_fn_format 三種模式並判斷「pattern 2 可腳本化但低優先」。δ 接手把這條造橋鋪路完：

- 寫了 conservative auto-fixer，**只處理 pattern 2**（`)，desc` → `) — desc`）
- 為什麼只處理 pattern 2：pattern 1 沒 URL 沒得修、pattern 3 需要讀原文寫描述、pattern 4 需要 rewrite 結構
- Dry-run / `--apply` / `--quiet` 三模式
- 用 Python 處理多位元組 regex（避開 macOS BSD sed 的 UTF-8 雷）

執行結果：

```
🔍 Dry-run: would apply 8 fix(es) to 2 file(s)
✅ Applied: 8 fix(es) across 2 file(s)
```

**format-check delta**：bad_fn_format **350 → 342**（−8）。`broken_links` 維持 0。其他指標不變。

修了哪 2 個檔：

- `knowledge/Music/台灣國樂.md` — 7 個註腳
- `knowledge/Culture/台灣獸迷文化.md` — 1 個註腳

### 3. 順手把 bad_fn_format 全貌量化（之前只有總數）

在 zh-TW 主文章範圍（882 個 footnote line）內：

| 模式                                   | 數量            | 自動化可行性                        |
| -------------------------------------- | --------------- | ----------------------------------- |
| ✅ good                                | 527 (60%)       | —                                   |
| ❌ p1 no_link（純散文，無 URL）        | 183             | 不可（需找來源）                    |
| ❌ p2 link_then_comma                  | **10 → 2 剩下** | ✅ 已自動化                         |
| ❌ p3 ends_with_link（有 URL 無 desc） | 110             | 半自動可行（讀 page title 當 desc） |
| ❌ p4 text_first_link                  | 9               | 不可（需 rewrite）                  |
| ❌ other                               | 43              | 不可                                |

**結論**：純機械可修的天花板就這麼高（10 / 355 = 2.8%）。剩下 345 個 bad fn 都需要人工或半自動 + LLM 助攻。pattern 3 是下一個值得造的橋（110 案件，工具讀網頁 title 自動填 description）。

## δ 對器官的影響

- **骨骼系統 +**：新增 `fix-fn-comma.sh` 工具進入腳本詞彙
- **免疫系統 +**：bad_fn_format 350 → 342（−8 件）
- **感知器官 +**：probe 報告 4/8 → 4/11 連續性建立，gap 填補軌跡可追蹤

## δ 修了什麼總結（commit 預覽）

```
8 lines fixed in 2 articles (footnote em dash typography)
1 new tool: scripts/tools/fix-fn-comma.sh
1 new probe report: reports/probe/2026-04-11.md
INDEX updated (+1 row)
```

## δ 沒做的事 + 下次接手

**沒做**：

- 沒寫新文章（鄭習會 / NCAIR / 韓國瑜 / 鄭麗文 / 蕭美琴）— 自動心跳的鐵律是「不批量、不未審核重寫」。新文章要哲宇觸發或走 REWRITE-PIPELINE。
- 沒處理 pattern 3 的 110 案件 — 工具設計需要 LLM 助攻（讀網頁 title），不在這次心跳的工作量內。

**下次接手建議**：

1. **造 fix-fn-empty-desc.sh**（pattern 3 的 110 案件）— 對每個 link 抓 page title 當 description fallback。風險：title 可能不適合當 footnote 描述
2. **寫鄭習會 / NCAIR 兩篇文章** — 時效性高，本週內最有價值
3. **建立人物頁批次計畫** — 韓國瑜 / 鄭麗文 / 蕭美琴 / 卓榮泰 至少 4 篇

## δ 一句話收尾

α 清翻譯債、β 建 PageHero、γ 修斷鏈、**δ 探新聞 + 造 footnote 橋**。四 session 接力，今日 11 個 commit（含 δ 預期），首次驗證「probe → 多 session 填補」+「自動心跳 + 造橋」的循環。🧬
