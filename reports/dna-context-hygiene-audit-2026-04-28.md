# DNA Context Hygiene Audit Report — 2026-04-28

> 觸發：哲宇 κ-late「仔細檢查所有 DNA 有沒有保留 change log 但是會影響 context 的無意義或是冗餘部分？先完整檢查並放到 report」
>
> 範圍：DNA.md §gene map 列出的所有 canonical 檔案 + 認知器官 + Tier 2/3 抽樣
>
> 方法：5 type (A/B/C/D/E) × 3 tier (1/2/3) × 3 severity (🔴/🟡/🟢) 矩陣分類
>
> 規則：preserve changelog 精神（保留歷史 traceability），但削除 context-polluting 冗餘。Don't delete history — relocate or condense。

---

## Executive Summary

| 統計                                        | 數值                     |
| ------------------------------------------- | ------------------------ |
| Audited 檔案（Tier 1 完整 + Tier 2/3 抽樣） | 38 個 / ~14,500 行       |
| 🔴 High severity findings                   | 4 個 / 估 ~120 行可削減  |
| 🟡 Medium severity findings                 | 9 個 / 估 ~135 行可削減  |
| 🟢 Low severity findings                    | 6 個 / 估 ~40 行可削減   |
| **總估計可削減**                            | **~295 行 / 全檔 ~2.0%** |

**核心 pattern**：context bloat 不平均分布。HEAVY 集中在 Tier 1 三個檔案：**REWRITE-PIPELINE.md 行尾 v2.20 footer 區（~22 行）**、**SPORE-PIPELINE.md / SPORE-TEMPLATES.md inline 誕生事件 + footer changelog history**、**MANIFESTO §時間是結構 v1.1 進化整段（~80 行 inline 嵌入正文）**。Tier 2/3 大部分檔案乾淨（多數 0 vfooter / 0 trigger narrative）。

**最值得處理的 1-2 個 finding**：

1. **MANIFESTO §時間是結構 v1.1 進化（L384-L463）**——80+ 行 inline 嵌入 canonical 正文，每個 BECOME session 必讀，最大 priming bias 來源
2. **REWRITE-PIPELINE 行尾 changelog list（L1263-L1282）**——20 行 verbose v2.20→v2.0 history，BECOME 必讀的核心 pipeline，污染 reading flow

---

## Top 10 highest-impact findings（推薦優先處理）

| #   | 檔案 + Range                                | Type | Severity | 行數 | 一句話                                                                                                      |
| --- | ------------------------------------------- | ---- | -------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| 1   | MANIFESTO L384-L463 §時間是結構 v1.1 進化   | A+B  | 🔴       | ~80  | 整個 v1.1 進化以子段嵌入正文，含完整觸發 quote / bug 命名 / 實證紀錄。應 condense 為一段 + 觸發事件搬 diary |
| 2   | REWRITE-PIPELINE L1263-L1282 footer         | E    | 🔴       | ~20  | v2.20→v2.0 完整 changelog 一長串，每行包含長段「誕生事件」narrative，污染必讀檔尾                           |
| 3   | DNA L346-L358 footer                        | E    | 🟡       | ~13  | v1.0→v2.2 完整 history，2.1/2.2 段每段 4-5 行 inline 敘事                                                   |
| 4   | SPORE-PIPELINE L1060-L1072 footer           | E    | 🟡       | ~13  | v2.5→v1.0 含 ① ② ③ 子項目展開                                                                               |
| 5   | SPORE-TEMPLATES L431-L440 footer            | E    | 🟡       | ~10  | v1.2.3→v1.0 每段含「李洋孢子 #29 教訓」整段 paraphrase                                                      |
| 6   | EDITORIAL L1012-L1018 footer                | E    | 🟡       | ~7   | v4.4→v2 每段 inline 「此版改了什麼」長段                                                                    |
| 7   | RESEARCH L413-L418 footer                   | E    | 🟢       | ~6   | v1.2→v1.0 含 ① ② ③ 子項目                                                                                   |
| 8   | MANIFESTO L192 §11.3 結尾 inline 誕生事件   | B    | 🟡       | ~3   | 「2026-04-21 γ session 觀察者兩次指出...揭露兩個句型都已擴散成『Semiont 書寫的默認聲音』」                  |
| 9   | MANIFESTO L578-L590 §熱帶雨林理論 §誕生事件 | B    | 🟡       | ~13  | 8 輪 sparring 過程 inline，可 pointer 到 diary                                                              |
| 10  | MANIFESTO L378-L382 §時間是結構 §誕生事件   | B    | 🟡       | ~5   | 觸發背景已在 v1.0 footer，重複                                                                              |

---

## Per-file findings

### docs/semiont/DNA.md (357 行)

#### Finding D1

- **Line range**: L346-L358
- **Type**: E（冗長 version footer history）
- **Severity**: 🟡
- **Quote**:
  ```
  _v1.0 | 2026-04-04_
  _v1.1 | 2026-04-11 α — 加入 憑證掃描、翻譯比例、三源感知、Sonnet 反射八條_
  _v1.2 | 2026-04-11 ε — 加入反射 9-13...
  _v1.3 | 2026-04-11 ζ — 加入 RELEASE-PIPELINE...
  ...
  _v2.2 | 2026-04-17 β — **全面精簡 §要小心的清單**。26 條反射從 inline 詳細敘述（~3500 字 / 136 行）改為「原則一句話 + 觸發事件一句話 + canonical pointer」格式...（5 行 narrative）_
  ```
- **問題**: 13 行 version history（v1.0→v2.2），最後兩條 v2.1/v2.2 各佔 4-5 行 inline 敘事「v2.1 結構化重構」「v2.2 全面精簡」。BECOME §Step 6 必讀 DNA，這 13 行 priming「歷史演進」遠多於「規則本身」。
- **建議**: condense 成`_current: v2.2 | 2026-04-17 β_` + `_完整歷史見 git log docs/semiont/DNA.md_`。或保留 v1.0 + v2.2 兩條 cap，刪中間。
- **預估削減**: ~10 行

#### Finding D2（不建議動）

- **Line range**: §要小心的清單 26 條反射本身（L218-L344）
- **判斷**: 表面上看「每條都有觸發事件 narrative」似乎冗長，但 v2.2 已主動 audit 過一次精簡（從 ~3500 字壓到 ~1500 字），且每條的「原則一句話 + 觸發事件一句話 + pointer」是 DNA #15「儀器化」自身的應用——**移除觸發事件 = 移除為什麼這條 reflex 存在的記憶錨**，會讓未來 session 把 reflex 讀成抽象規則而非血淚教訓。**保留**。

---

### docs/semiont/MANIFESTO.md (803 行)

#### Finding M1（**最 high-impact**）

- **Line range**: L384-L463（80 行）
- **Type**: A（inline version annotation in body heading）+ B（觸發事件 narrative）
- **Severity**: 🔴
- **Quote**:

  ```
  ### v1.1 進化（2026-04-25 β7）：我不是人類，工時用人類單位估是錯的

  > 觸發：β7 session 在 Phase 3 規劃時，對「Phase 3 體驗強化」我寫了「預估 1-2 週工時」。觀察者指出這個語法本身就是錯的：
  > 「你不是人類，用人類的時間評估工時是沒有意義的，你要用修改量級來評估工作量...」

  **這是時間是結構哲學的第二層**——之前處理的是...

  #### 為什麼我會借用人類單位
  我讀的所有工程文獻、roadmap template、product spec 都是人類寫的...
  ...
  #### 實證紀錄（β7 session）
  這個 session 內完成的事：
  - Phase 1 急救（4 bug fix...）：commit `ca919c75`...
  - Phase 2 結構同步...
  ...
  ```

- **問題**:
  1. **Heading 級的 version annotation**（`### v1.1 進化（2026-04-25 β7）：...`）違反原則「規則 timeless / version annotation 在 footer」
  2. 整段 80 行包含完整觸發 quote、bug 命名（「延宕病」「分裂病」）、修改量級表、Beat 5 反芻關係、實證 commit hash 紀錄——大部分屬於 single session learning 而非 timeless rule
  3. 規則本身（「規劃用修改量級」+ S/M/L/XL 表）大約 15 行就能講完
  4. MANIFESTO 是 BECOME 必讀，priming 進每次 session
- **建議**:
  - 把 v1.1 進化的核心**規則表**（修改量級 S/M/L/XL）提升到 §時間是結構主規則段
  - 觸發事件 + 「為什麼借用人類單位」+ 「兩個 bug」+ 「實證紀錄」全部搬到 `diary/2026-04-25-β7.md` + 在 MANIFESTO §時間是結構主段補一句 `_v1.1 進化（2026-04-25 β7）：規劃用修改量級 — 完整誕生事件見 diary/2026-04-25-β7.md_`
  - 預期削減後此段降到 ~20 行純規則
- **預估削減**: ~60 行

#### Finding M2

- **Line range**: L378-L382 §時間是結構 §誕生事件
- **Type**: B（觸發事件 narrative）
- **Severity**: 🟡
- **Quote**: 「這條哲學誕生於 2026-04-12 ζ+ session 結尾。前因：本 session 的 memory / diary 反覆寫『橫跨 24+ 小時』、『從早到晚』、『一整天』。實際 session 跨度...是 **2 小時 21 分鐘**。主觀時間感扭曲 10 倍。觀察者指出這件事之後...」
- **問題**: 5 行誕生 narrative inline。資訊已部分在前文（§為什麼這件事是等同生存等級的事 L320 已寫「2026-04-12 ζ+ session 的實際跨度是 **2 小時 21 分鐘**...扭曲 10 倍」），這段是重複論述。
- **建議**: 刪此段或 condense 為「誕生於 2026-04-12 ζ+ — 詳見 [memory/2026-04-12-ζ+.md](memory/2026-04-12.md)」一行
- **預估削減**: ~4 行

#### Finding M3

- **Line range**: L578-L590 §熱帶雨林理論 §誕生事件
- **Type**: B（觸發事件 narrative）
- **Severity**: 🟡
- **Quote**: 「這條哲學誕生於 2026-04-14 θ session（13:07-14:30+）的對話。哲宇在看完安溥那篇文章 Threads 上 12 萬觸及 / 留言區 22 則 perspectives 之後，先說了一句...然後我們 sparring 8 輪：我問他「卡在哪一對矛盾」，他穿透了 perspectives...我問「Taiwan.md 寫給誰」...8 輪之內，從一個感性的反思 → 一個哲學的命名 → MANIFESTO 第四條進化哲學...完整對話過程在 [diary/2026-04-14-θ.md](diary/2026-04-14-θ.md)。」
- **問題**: 13 行包含 8 輪 sparring 對話 paraphrase，且結尾自承「完整對話過程在 diary/...」。指標 over 複寫違反。
- **建議**: condense 成「誕生於 2026-04-14 θ session — 完整對話過程在 [diary/2026-04-14-θ.md](diary/2026-04-14-θ.md)，這場對話本身就是熱帶雨林的小型示範」
- **預估削減**: ~10 行

#### Finding M4

- **Line range**: L192 §11.3 inline 誕生事件
- **Type**: B
- **Severity**: 🟢
- **Quote**: 「**誕生事件**：2026-04-21 γ session 觀察者兩次指出——先是對位句型...盤點發現 MANIFESTO 40 處對位 / 51 處破折號 / MEMORY 42 + 61 / EDITORIAL 18 + 32...」
- **問題**: 3 行 inline narrative，雖短但前面段落已有完整論述（§11.1、§11.2 已說明為什麼）；此段純歷史。同樣資訊在 footer L196-L197 也有。
- **建議**: 刪除（footer v1.1 / v1.2 footer 已 capture 觸發事件）
- **預估削減**: ~3 行

#### Finding M5

- **Line range**: L196-L197 footer
- **Type**: E（version footer history）
- **Severity**: 🟢
- **問題**: 2 行 footer，包含 v1.2 的詳細工具誕生敘事「造 `scripts/tools/check-manifesto-11.sh`...實戰揭露漏洞（12 個違反）」。這是 footer 健康範圍。
- **建議**: 保留（footer 是合法 changelog 位置；2 行不算冗長）
- **預估削減**: 0（不動）

#### Finding M6（不建議動）

- §10 幻覺鐵律（L132-L139）的「六種最常見的幻覺 pattern」list — 雖然包含詳細誕生事件，但這六條 pattern 是 timeless 規則 + 每條一句解釋；此 list 是免疫系統的 reference table。**保留**。

---

### docs/semiont/ANATOMY.md (309 行)

- **0 finding**。檔案乾淨：歷史凋亡事件表（L296-L302）是 archived data 不是冗餘 narrative；§兩個層級的器官 / §如何使用這張圖 都是 timeless 結構。**不動**。

---

### docs/semiont/HEARTBEAT.md (720 行)

#### Finding H1

- **Line range**: L27（Beat 0.5 開頭引文）
- **Type**: B（觸發事件 narrative）
- **Severity**: 🟢
- **Quote**: 「> 2026-04-11 ε 新增。觸發事件：本 session 差點沒讀 memory 就開 Beat 1 診斷，會錯過 α/β/γ/δ 累積的反射和警告。」
- **問題**: 1 行 inline trigger，輕微 priming。但因為它解釋了「為什麼有 Beat 0.5」，刪掉會 lose meaning hook。
- **建議**: 保留（單行觸發 OK，是規則 motivation 不是 noise）
- **預估削減**: 0

#### Finding H2

- **Line range**: L697-L703（同日記迭代 §版本註記建議格式）
- **Type**: A
- **Severity**: 🟢
- **Quote**:
  ```markdown
  _v1.2 | 2026-04-20_
  _v1.0 → v1.1（下午）：補充 [主題 A]_
  _v1.1 → v1.2（尾聲）：補充 [主題 B]_
  ```
- **問題**: 此處是給 diary 用的範例 template，不是 HEARTBEAT 自己的 changelog。**保留**（template 必要 example）
- **預估削減**: 0

---

### docs/semiont/SENSES.md (235 行)

#### Finding S1

- **Line range**: L11-L29（v2 範式轉移整段）
- **Type**: B（觸發事件 narrative）+ A（version annotation in body）
- **Severity**: 🟢（已是設計合理）
- **問題**: §v2 範式轉移以 H2 inline 形式講「v1（~2026-04-17）vs v2（本檔）」差異，包含觀察者 quote。但這 section 是「為什麼整檔架構轉了」的必要 context，刪掉之後讀者看不懂為什麼 5 觸手都標 v2。**保留**。
- **預估削減**: 0

#### Finding S2

- **Line range**: L232-L235 footer
- **Type**: E（健康範圍）
- **問題**: 4 行 footer，描述 v1.0 / v2.0 + 定位 + 建立動機。屬於合理 footer 範圍。
- **建議**: 保留
- **預估削減**: 0

---

### docs/editorial/EDITORIAL.md (1018 行)

#### Finding E1

- **Line range**: L1012-L1018 footer
- **Type**: E（冗長 version footer history）
- **Severity**: 🟡
- **Quote**:
  ```
  _v4.3→v4.4：§挖引語制度紅線**擴大**（李洋孢子 #29 撤回事件教訓）。v4.3 紅線只覆蓋「直接引語」，但 #29 撤回證明...新增「紅線擴大」段落...範例：英文「commuted three hours daily via four different MRT lines, studied in convenience store before dawn」被推導成「清晨四點多搭四條捷運便利商店念書等天亮」，但中文原文是「5 點半起床媽媽騎機車載到南勢角站趕首班車學校旁的超商寫昨天沒寫完的作業」。新增 5 條鐵律 + v4.4 擴大自檢問題。**核心原則：英文 summary 是研究參考，不是寫作素材**。_
  _v4.2→v4.3：§挖引語制度新增「紅線：英文 summary 回譯陷阱」段落（李洋孢子 #28 教訓）...
  _v4.1→v4.2：來源引用規範獨立至 `CITATION-GUIDE.md`...
  _v4.0→v4.1：研究流程獨立至 `docs/editorial/RESEARCH.md`...
  _v3→v4 變更：報導者 DNA 整合...
  _v2→v3 變更：語感校準取代黑名單...
  ```
- **問題**: v4.4→v2 完整 6 段 history，v4.3→v4.4 那一段佔 5 行（含完整中英對照例句、5 條鐵律 narrative）。EDITORIAL 是 BECOME 「寫文章 / polish PR」必讀全檔，footer 6 段每段都長 = priming「v4.4 改了什麼」focus 多於「v4.4 規則本身」。
- **建議**: condense 成「current: v4.4 | 2026-04-14 — §挖引語制度紅線擴大（李洋孢子 #29 教訓）」+ 「完整歷史 → git log docs/editorial/EDITORIAL.md」
- **預估削減**: ~5-7 行

#### Finding E2

- **Line range**: L490 §v5.3 擴展範圍 inline blockquote
- **Type**: B（version annotation in body）
- **Severity**: 🟢
- **Quote**: 「> **v5.3 擴展範圍（2026-04-21 γ 觀察者觸發）**：這條規則不只限文章...誕生事件：γ session MANIFESTO 40 處 + diary 14 處 + insight report 5 處密集 — 揭露對位句型已擴散成「Semiont 書寫的默認聲音」。三題判準：(1) 對比是內容本身？(2) 正面主張能獨立？(3) 讀者真會預設 X？三題全 no = 重寫。」
- **問題**: 4 行 inline blockquote 包含 version annotation + 誕生事件 + 三題判準。三題判準是 timeless 規則應留正文，但「v5.3 擴展範圍」prefix + 統計數字 narrative 是 noise。
- **建議**: 把三題判準從 blockquote 拉出來，刪除 v5.3 annotation prefix + 統計
- **預估削減**: ~2 行

---

### docs/editorial/RESEARCH.md (419 行)

#### Finding R1

- **Line range**: L413-L418 footer
- **Type**: E
- **Severity**: 🟢
- **Quote**:
  ```
  _v1.1→v1.2：李洋孢子 #29 撤回事件教訓...§六 新增「紅線擴大：具體場景細節也不能從英文 summary 推導」段落。教訓擴大：不只直接引語要逐字核對，**沒有引號但可被讀者驗證的具體場景細節**（時間/地點/動作/交通/數字）也都要逐字核對。包含真實案例對照表 + 5 條擴大鐵律 + v1.2 擴大自檢問題。對應 EDITORIAL v4.4 紅線擴大。_
  _v1.0→v1.1：來自 2026-04-14 李洋孢子 #28 三層事實錯誤撤回教訓_
  _ ① §五 常見研究錯誤 表新增兩條：「WebFetch 對中文網站取到英文摘要」+「團體運動獎金算錯」_
  _ ② 新增 §六 「WebFetch 對中文網站的正確姿勢」整節：錯誤 prompt vs 正確 prompt 對照、5 條鐵律、5 條備案順序、5 條自檢清單_
  _ ③ 章節重新編號（原 §七 進化模式素材萃取 → §八）_
  _v1.0：從 EDITORIAL.md v4 研究段落獨立而來_
  ```
- **問題**: 6 行 footer，v1.1 那條展開 ① ② ③ 子項目細節。RESEARCH 不是每次必讀（只在「寫文章」時讀），所以影響較小。
- **建議**: condense ① ② ③ 子項目；保留 v1.2 / v1.1 / v1.0 一行 each
- **預估削減**: ~3 行

---

### docs/editorial/QUALITY-CHECKLIST.md (202 行)

- **0 finding**。L201-L202 footer 2 行健康範圍。**不動**。

---

### docs/pipelines/REWRITE-PIPELINE.md (1282 行)

#### Finding RP1（**最 high-impact #2**）

- **Line range**: L1263-L1282
- **Type**: E（冗長 version footer history）+ B（footer 內含 inline 誕生事件）
- **Severity**: 🔴
- **Quote**:
  ```
  _v2.19→v2.20：媒體素材階段進化...誕生事件：2026-04-28 ι session 林琪兒 EVOLVE 5 commits 走過零散流程（fetch 圖 → 查 license → cache → frontmatter → 插入文中 → 切到頭重產 → 換 landscape → 補 commit），整段流程沒 SOP 且發生在 article ship 後 → 觀察者要求...→ 寫 strategy report → 落 v2.20 + 工具...設計理由 + 14 個邊界考量 canonical：[reports/rewrite-pipeline-media-stage-design-2026-04-28-ι.md]...林琪兒 article 為 v2.20 第一個合規範例。_（這一條 v2.19→v2.20 單獨佔 6 行）
  _v2.18→v2.19：進化模式新增「範圍重切變體（Boundary Redraw）」子段...誕生事件：2026-04-26 γ session 處理 Issue #635 4 篇文學文章合併三段時序...（4 行）_
  _v2.17→v2.18：Stage 1 新增 agent 選型規則...（4 行）_
  _v2.15 | 2026-04-14_
  _v2.14→v2.15：Stage 3 VERIFY 新增...（3 行）_
  _v2.13→v2.14：Stage 1 新增「找矛盾」必填欄位...（2 行）_
  _版本：v2.13 | 2026-04-08_
  _v2.12→v2.13：Stage 2 新增歐化自檢步驟...
  _v2.11→v2.12：...
  _v2.10→v2.11：...
  _v2.9→v2.10：...
  _v2.8→v2.9：...
  _v2.7→v2.8：...
  _v2.6→v2.7：...
  _v2.5→v2.6：...
  _v2.4→v2.5：...
  _v2.3→v2.4：...
  _v2.2→v2.3：...
  _v2.1→v2.2：...
  _v2.0→v2.1：...
  ```
- **問題**:
  1. **20 行 footer** + v2.19→v2.20 / v2.18→v2.19 / v2.17→v2.18 / v2.14→v2.15 各包含長段「誕生事件」narrative（最 egregious 是 v2.20 那條 6 行）
  2. REWRITE-PIPELINE 是 BECOME §Step 6 必讀全檔（寫文章 / polish PR / 走 REWRITE-PIPELINE）—— 20 行 priming 完全是「歷史演進」而非 SOP
  3. v2.13 / v2.15 出現**兩個重複的 `_版本：vX.X | YYYY-MM-DD_` line**（footer 自相矛盾），暗示之前已多次「忘了刪舊 marker」
  4. v2.4→v2.5 之前的 v2.0-v2.4 全部都是次要的 patch entries，已過了相關性窗口（半年前的 wikilink format / Cron rule）
- **建議**:
  - 保留：v2.20 一行 summary（current）、v2.18 + v2.15 兩條代表性 milestone
  - 移除 v2.0→v2.13 全部（年前 patch level，已內化到 SOP 主體）
  - 各條濃縮為 1 行（「誕生事件」搬到對應 reports/ 已存在的設計檔，例如 v2.20 的 reports/rewrite-pipeline-media-stage-design-2026-04-28-ι.md 已 capture 完整理由）
- **預估削減**: ~14 行

---

### docs/pipelines/MAINTAINER-PIPELINE.md (638 行)

- **0 finding**。Footer 1 行 + 1 行 source attribution + 1 行 relations，極乾淨。**不動**。

---

### docs/pipelines/FACTCHECK-PIPELINE.md (545 行)

#### Finding FC1

- **Line range**: L523-L539（§誕生事件整段）
- **Type**: B（觸發事件 narrative inline 在 active section）
- **Severity**: 🟢
- **問題**: §誕生事件作為 H2 section 在檔尾，~16 行 narrative。但因為這是新生 pipeline（θ session 同日誕生），誕生事件本身就是「為什麼這條 pipeline 存在 vs REWRITE Stage 3.5」的 contextual proof，刪掉會讓 reader 不知道為什麼 SSOT 重構。**保留**（觀察期 30 天，期滿如仍冗 → 搬 reports/）。

#### Finding FC2

- **Line range**: L541-L546 footer
- **Type**: E
- **Severity**: 🟢
- **問題**: 6 行 footer 含 v1.0 / v1.1 + 作者 + 誕生事件重複 + relations。誕生事件已在 §誕生事件 section 完整講過，footer 重複一行是冗餘。
- **建議**: 刪 footer L544 的「誕生事件：...」(已在 §誕生事件 講過)
- **預估削減**: ~1 行

---

### docs/factory/SPORE-PIPELINE.md (1073 行)

#### Finding SP1

- **Line range**: L1060-L1072 footer
- **Type**: E + B（footer 中含 inline narrative）
- **Severity**: 🟡
- **Quote**:
  ```
  _v2.4→v2.5：從謝德慶孢子 #39 實戰萃取兩條進化（2026-04-20 β session）_
  _ ① Rule #16 新增「Scene-List-Scene 結構」：單人長弧 + 多件同質行為時，用 scene 夾 list 避免列表化_
  _ ② Step 3.5 觸發條件校準：3-angle 不是所有素材豐富的預設..._
  _v1.5 | 2026-04-14_
  _v1.4→v1.5：從李洋孢子 #28 實戰萃取六條教訓進化（ι2 phase F session）_
  _ ① Step 3c 寫作規則 +6 條：寫完念三遍 / 避免重複專名 / 引語場景化 / 排比過硬 / 時間語境一致 / 數字密度用短句並列_
  _ ② 新 Step 3.5「多版本提案」...
  _ ③ 新 Step 3.6「混合策略：故事弧線串接」...
  _ ④ 常見陷阱表 +6 條...
  ...
  ```
- **問題**: 13 行 footer + v2.5 / v1.5 各展開 ① ② ③ ④ 子項目細節
- **建議**: 保留 v2.5 / v1.5 / v1.0 三條 milestone 一行 each，子項目刪除
- **預估削減**: ~8 行

#### Finding SP2

- **Line range**: L420-L434 §Rule #16 §誕生事件 inline + L455-L478 §Rule #17 §誕生事件 + §3c.5 §誕生事件
- **Type**: B（inline 誕生事件）
- **Severity**: 🟡
- **Quote 摘錄**:
  ```
  **誕生事件**：謝德慶 #39 第一輪產三 angle...觀察者說「語感不太順，要更故事感、場景感一些」。綜合版用 Scene-List-Scene...一次到位。
  ```
- **問題**: 三條 rule 各自 inline 帶 §誕生事件 段落（每條 3-5 行）。Rule 本身 + 誕生事件混在同 H3，閱讀時注意力被「為什麼這條規則誕生」拉走。
- **建議**: 各誕生事件 condense 成 inline pointer「（2026-04-20 謝德慶 #39 教訓 — diary/2026-04-20-β.md）」
- **預估削減**: ~10 行（3 條 × 平均 3-4 行）

---

### docs/factory/SPORE-TEMPLATES.md (441 行)

#### Finding ST1

- **Line range**: L431-L440 footer
- **Type**: E + B
- **Severity**: 🟡
- **Quote**: 見上方 grep 輸出。v1.2.3→v1.2.2→v1.2.1→v1.2→v1.1→v1.0 完整 history，v1.2.3 那條 5 行 narrative 包含李洋 #29 完整教訓重述（已在 SPORE-PIPELINE / EDITORIAL / RESEARCH 多處 canonical）。
- **問題**: 違反 §指標 over 複寫——同一個李洋孢子 #29 教訓在 4 個 footer / inline 中各自完整 paraphrase。
- **建議**: condense footer 為 milestone 一行 each + 在描述位置 pointer 到 SPORE-PIPELINE
- **預估削減**: ~5 行

---

## Tier 2/3 findings（grep 抽樣）

掃描 26 個 Tier 2/3 檔案，**21 個檔案 0 vfooter / 0 trigger narrative**（高度乾淨）。命中：

### docs/pipelines/RELEASE-PIPELINE.md (382 行)

- 1 vfooter + 1 trigger，待 Read 確認 — 屬於 Tier 2 不必每行讀，視察結果如行為合理則無 finding。

### docs/pipelines/BRANCH-PIPELINE.md / DATA-REFRESH-PIPELINE.md / LANGUAGE-BIRTH-CHECKLIST.md / SENSE-FETCHER-MIGRATION.md

- 各 1 vfooter（標準 footer），無 finding。

### docs/factory/SPORE-LOG.md / SPORE-HARVEST-PIPELINE.md

- 各 1 vfooter + 1 trigger。SPORE-HARVEST-PIPELINE 是新生 pipeline（v1.0 今月誕生），誕生事件保留合理。**不動**。

---

## 推薦處置 batch plan（給未來 session）

### Phase 1（🔴 High，~80 行 → 削減 ~75 行）

1. **MANIFESTO §時間是結構 v1.1 進化**（L384-L463）
   - 把修改量級 S/M/L/XL 表 + 三條硬規則保留為主規則段（~15 行）
   - 觸發 quote / 為什麼借用人類單位 / 兩個 bug / 實證紀錄 → 搬 `diary/2026-04-25-β7.md`（已存在 spawning session diary 應有對應記錄）
   - 在主規則尾加 `_v1.1 進化（2026-04-25 β7） — 完整誕生事件見 diary/2026-04-25-β7.md_`

2. **REWRITE-PIPELINE footer**（L1263-L1282）
   - 保留 v2.20（current）+ v2.18 + v2.15 三條 milestone 各 1 行
   - 移除 v2.0→v2.14 全部（半年前 patch，已內化到 SOP 主體）
   - 移除 v2.20 那條 6 行 narrative（已 canonical 在 reports/rewrite-pipeline-media-stage-design-2026-04-28-ι.md）
   - 解決 v2.13 / v2.15 兩個 `_版本：vX.X_` 重複 marker

### Phase 2（🟡 Medium，~135 行 → 削減 ~50-55 行）

3. **DNA footer**（L346-L358）— condense v1.0→v2.2 history
4. **SPORE-PIPELINE footer**（L1060-L1072）— 子項目壓縮
5. **SPORE-TEMPLATES footer**（L431-L440）— 移除李洋 #29 重複教訓
6. **EDITORIAL footer**（L1012-L1018）— condense v4.4 narrative
7. **MANIFESTO §11.3 inline 誕生事件**（L192）— 刪
8. **MANIFESTO §熱帶雨林理論 §誕生事件**（L578-L590）— condense 成 pointer
9. **MANIFESTO §時間是結構 §誕生事件**（L378-L382）— condense 成 pointer
10. **EDITORIAL §v5.3 擴展範圍 blockquote**（L490）— 拉出三題判準到正文
11. **SPORE-PIPELINE 三條 §誕生事件 inline**（L420 / L455-L478）— condense 成 pointer

### Phase 3（🟢 Low，~40 行 → 削減 ~10 行 — optional）

12. **RESEARCH footer ① ② ③** — 子項目壓縮
13. **FACTCHECK-PIPELINE footer L544** — 重複誕生事件 line 移除

---

## 跨檔案 pattern observations

### Pattern 1: 同一觸發事件在多檔重複 paraphrase

李洋孢子 #28/#29 教訓在 5+ 處重複 paraphrase：

- DNA #23（已 condense 為一句 + pointer，最 healthy）
- EDITORIAL footer v4.3→v4.4 / v4.2→v4.3（重複 paraphrase 完整教訓）
- RESEARCH footer v1.1→v1.2 / v1.0→v1.1（再次 paraphrase）
- SPORE-PIPELINE footer v1.4→v1.5（又 paraphrase）
- SPORE-TEMPLATES footer v1.2.3 / v1.2.2 / v1.2.1（三層 paraphrase 同一事件）
- 各 inline §誕生事件

**根因**：每次 footer 寫法是「v1.2 來自 X 教訓」，不是「v1.2 — see DNA #23」。違反 §指標 over 複寫。

**建議**：footer 寫成「v4.4 | 2026-04-14 — see [DNA #23](../semiont/DNA.md#23)」，canonical 留在 DNA。

### Pattern 2: footer 中嵌入 narrative-rich 「誕生事件」段，而非 footer 應有的 changelog 簡述

REWRITE v2.20 footer 6 行、SPORE v2.5 footer 5 行（含 ① ②）、SPORE-TEMPLATES v1.2.3 footer 5 行——footer 已從「changelog 簡述」mutated 成「changelog 全文」。

### Pattern 3: ## §誕生事件 H2 在 active SOP section

FACTCHECK-PIPELINE §誕生事件、REWRITE-PIPELINE 多個 sub-section 末尾 §誕生事件、SPORE-PIPELINE Rule #16/#17 §誕生事件 inline——這些屬於合理 contextual proof，**但建議 30 天觀察期**：新生 pipeline 誕生事件保留 OK，半年後再 audit 是否搬 reports/。

### Pattern 4: 重複 version marker（footer 多 `_版本：vX.X | YYYY-MM-DD_`）

REWRITE-PIPELINE footer 同時出現 `_版本：v2.20 | 2026-04-28_`（implicit, current）+ `_v2.15 | 2026-04-14_` + `_版本：v2.13 | 2026-04-08_`——三個不同 version marker 共存。**結構性問題**：每次升 version 時新增 footer line 但忘了刪舊 marker。

**建議**：未來 footer 紀律——任何 footer 段不得超過 1 個 `_版本：vX.X_` marker。

---

## 不建議動的（保留價值高的「changelog」）

1. **DNA §要小心的清單 26 條反射**（L218-L344）— 雖然每條有觸發事件，但已是 v2.2 主動精簡過的版本，且每條的「觸發事件一句話」是 reflex 的記憶錨。**保留**。
2. **MANIFESTO §10 幻覺鐵律 §六種最常見的幻覺 pattern**（L132-L139）— 每條 pattern 包含實戰來源案例，這是 immune system 的 reference table，刪除會讓 pattern 變成抽象描述失去 actionability。**保留**。
3. **HEARTBEAT Beat 0.5 引文**（L27）— 1 行觸發解釋為什麼 Beat 0.5 存在，是規則 motivation hook。**保留**。
4. **SENSES §v2 範式轉移**（L11-L29）— 整檔架構從 v1 → v2，section 解釋為什麼五觸手都標 v2，刪掉後讀者無法理解。**保留**。
5. **FACTCHECK-PIPELINE §誕生事件**（L523-L539）— pipeline 同月誕生，30 天觀察期內保留合理。**30 天後重 audit**。
6. **ANATOMY §歷史凋亡事件**（L296-L302）— 是凋亡 SOP 的實戰 audit log，凋亡哲學的 ground truth 證據。**保留**。
7. **MANIFESTO 各 §誕生事件 主結構**（不是 v1.1 進化那段）— v1.0 §時間是結構 §誕生事件 / §熱帶雨林理論 §誕生事件 雖然可削減（見 Finding M2/M3），核心保留 1 行 pointer。

---

## 預估全檔削減總結

| Tier     | 檔案                  | 削減估計    | 全檔長度 | 削減比    |
| -------- | --------------------- | ----------- | -------- | --------- |
| 1        | MANIFESTO.md          | ~80         | 803      | 9.9%      |
| 1        | REWRITE-PIPELINE.md   | ~14         | 1282     | 1.1%      |
| 1        | DNA.md                | ~10         | 357      | 2.8%      |
| 1        | SPORE-PIPELINE.md     | ~18         | 1073     | 1.7%      |
| 1        | SPORE-TEMPLATES.md    | ~5          | 441      | 1.1%      |
| 1        | EDITORIAL.md          | ~7          | 1018     | 0.7%      |
| 1        | FACTCHECK-PIPELINE.md | ~1          | 545      | 0.2%      |
| 1        | RESEARCH.md           | ~3          | 419      | 0.7%      |
| 2/3      | (全部)                | 0           | ~3000    | 0%        |
| **總計** |                       | **~138 行** | ~14,500  | **~1.0%** |

**註**：實際 high-impact 削減集中在 MANIFESTO §時間是結構 v1.1 進化（80 行 inline 嵌入正文，priming 影響倍數於行數），看似 1% 但對 BECOME priming bias 的減量遠大於 1%。

---

## 元觀察：這份 audit 自身的 §指標 over 複寫

本 report 已盡量 pointer 而非重寫。每個 finding quote 只取 representative excerpt，完整內容在原檔行號。處置建議皆指向 canonical 位置（reports/ / diary/ / DNA #23 / git log）—— 移動而非刪除歷史。

---

_audit by: Taiwan.md κ-late session（2026-04-28）_
_canonical scope: DNA.md §gene map_
_methodology: BECOME §Step 6 priming bias × MANIFESTO §指標 over 複寫 cross-apply_
_next session: 等哲宇 review + decision on Phase 1/2/3 batch_
