# REWRITE-PIPELINE 媒體素材階段進化設計 — strategy report

> Status: **strategy report，未實作**。本檔規劃 REWRITE-PIPELINE v2.20 候選新增「Stage 1.7 媒體素材研究 + Stage 4.5 媒體插入」+ 統合既有 v2.17.1 / v2.27「音樂／影像／影片 inline 外連」規則。
>
> **Author**: Taiwan.md (Semiont) ι session, 2026-04-28
>
> **Triggered by**: 觀察者 ι session「我想要在 rewrite-pipeline 進化：研究階段多一個媒體素材研究，同步搜集可使用的媒體檔案與對應授權檢查，然後在文章寫完跟邊修完後，加入一個插入媒體的步驟，確認文章敘事與適當的節奏順序放入媒體素材，可以統合之前歌手可以放 youtube 那部分的規則，把這個階段做的明確，還有後續怎麼處理，怎麼放，用什麼格式（jpg？）還有一切我沒有想到的」
>
> **Real-world ground truth**: 林琪兒 EVOLVE 實戰（2026-04-28 ι session, commits `33ebed7c → cd5b72bf → 608ea990`）— 觀察者主動丟 NASA + Wikipedia 連結 → 我事後查授權 → cache → 寫 frontmatter → 插入文中 → 圖被切重產 → 圖型錯換 landscape → 補 commit。整段流程零散，沒 SOP，且發生在 article ship 後。本 report 把這段亂打變成 pipeline。

---

## 為什麼需要這個 Stage

### 觀察到的痛點

| #   | 痛點                                                                                             | 實戰案例                                                                          |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 1   | 媒體素材是 article ship 後才補，導致重新 sync + 重新 deploy 兩次                                 | 林琪兒 ι session：3 commits article 後第 4 commit 補圖、第 5 commit 改 landscape  |
| 2   | 授權檢查零散：有時 PD、有時 CC、有時忘了查                                                       | 林琪兒 3 張圖授權檢查是「ι 觀察者丟連結 → ι session 用 WebFetch 個別查 license」  |
| 3   | 圖檔尺寸沒標準：portrait 被 Astro 16:9 框切掉頭                                                  | 林琪兒 lindgren-crew4-portrait.jpg 1041×1561 portrait → 切到只剩鼻子下            |
| 4   | 命名沒慣例：`lindgren-emu-2014.jpg` vs `lindgren-crew4-training.jpg` 同檔案不同人會用不同 schema | 林琪兒 3 張隨便取                                                                 |
| 5   | 圖檔放哪沒慣例：`public/article-images/people/` 是這次決定的，沒寫進 pipeline                    | 既有只 林琪兒一篇用 `image:` frontmatter                                          |
| 6   | inline 外連（YouTube）規則散落 v2.17.1 / v2.27 兩個版本                                          | 「音樂／影像／影片題材」段塞在 Stage 2 寫作流程 step 12                           |
| 7   | 沒有「媒體插入時機」決策：寫完才硬塞 vs 寫之前先布陣                                             | 林琪兒 article 圖是寫完才放，沒事先想三段位置敘事節奏                             |
| 8   | Caption 格式沒標準：是用 markdown italic？還是 HTML figcaption？                                 | 林琪兒用 `_..._` italic                                                           |
| 9   | 攝影者 credit 標哪？frontmatter？inline caption？文末？                                          | 林琪兒同時三處標（重複）                                                          |
| 10  | 沒有 alt text accessibility 紀律                                                                 | 林琪兒 alt text 只有「林琪兒擔任 SpaceX Crew-4『Freedom』指揮官的官方人像」隨便寫 |

### 為什麼集中成 stage 比散落 ad-hoc 好

- 統合既有 v2.17.1 / v2.27 inline 外連規則 → SSOT
- 授權檢查只跑一次（Stage 1.7）不是寫到一半再回頭查
- 媒體插入跟寫作主動同步思考敘事節奏（Stage 4.5），不是寫完才硬塞
- 命名／格式／cache 路徑／alt text 統一規範，避免不同 session 不同人不同寫法
- 跟 EDITORIAL §密度平衡 + Rule #16 Scene-List-Scene 連動：媒體插入是另一個「呼吸」工具

---

## 設計：Stage 1.7 媒體素材研究 + Stage 4.5 媒體插入

```
Stage 1: RESEARCH（35-40%）
   ├─ §1.1 中英文 web search 20+
   ├─ §1.2 verbatim 引語蒐集
   ├─ §1.3 矛盾找尋
   ├─ §1.4 reports/research/YYYY-MM/ 落檔
   └─ §1.7 媒體素材蒐集 + 授權檢查 ⭐ NEW
        ├─ §1.7a inline 外連（YouTube／影像／音檔，沿用 v2.17.1 / v2.27）
        ├─ §1.7b 圖片素材（PD / CC，本地 cache）
        ├─ §1.7c 引用音檔／podcast 片段
        ├─ §1.7d 授權矩陣
        └─ §1.7e 三類 manifest 寫進研究檔末尾

Stage 2: WRITE（40-45%）
   ├─ ... 既有 13 條規則
   ├─ §2.12 inline 外連密度（沿用 v2.17.1 / v2.27 關鍵作品）
   └─ §2.X 媒體佔位 ⭐ NEW（標記 `<!-- MEDIA: 媒體 ID -->` 等 Stage 4.5 替換）

Stage 3-3.5: VERIFY + FACTCHECK Quick Mode

Stage 4: FORMAT CHECK
   └─ §4.5 媒體插入 ⭐ NEW
        ├─ §4.5a 三段敘事節奏判斷（hero / scene-mid / closure）
        ├─ §4.5b 圖檔 fetch + cache + naming convention
        ├─ §4.5c Aspect ratio 護欄（避免被切）
        ├─ §4.5d Markdown 插入 + caption + alt text 全規範
        ├─ §4.5e 授權清單同步（frontmatter + 文末「## 圖片來源」）
        └─ §4.5f 圖片健康檢查（hot-link？404？尺寸？）

Stage 5: CROSS-LINK
Stage 6: TRANSLATION（可選）
```

---

## Stage 1.7 媒體素材研究 — 詳細 SOP

### §1.7a inline 外連（YouTube／影像／音檔）

**統合既有 v2.17.1 / v2.27 全部規則（現在散落 Stage 2 step 12，搬到 Stage 1.7a SSOT）**：

- 觸發條件：任何題材敘事中提到**有公開影像／音檔／影片**的具體作品
  - 音樂人：歌名 → 官方 MV／lyric video／official audio
  - 電影 / 紀錄片：片名 → 官方預告／導演頻道／串流官方頁
  - 電視劇 / 綜藝：節目名 → 官方頻道／公視+／Netflix 官方
  - Podcaster：節目名 → 官方頻道
  - 演唱會 / 表演：場次名 → 主辦官方／售票頁／aftermovie
  - 音樂節：節目名 → 官方 lineup
  - 新聞事件：被引用的關鍵公開影片 → 官方 YouTube
- URL 優先序：(1) 官方頻道（藝人／廠牌／節目方／導演）(2) 國際串流官方（Spotify / Apple Music / KKBOX）(3) 主辦／策展單位官方頁
- 不接受：搜尋結果頁、UGC 翻唱、二手轉貼
- 密度：每篇 3-8 inline 外連最合理（< 3 沒得點 → 缺「邊讀邊聽」/ > 10 視覺擁擠）

**Stage 1.7a 強制動作**：研究 agent 在 Round 1 額外蒐集「文章預期會提到的所有公開作品」的官方連結，列入研究筆記獨立一節 §inline 外連 manifest（範例：壞特 Round 1 §10 13 條 / 田馥甄 Round 2 §A 14 條）。找不到官方版就標 `[no official URL found]`，**Stage 2 寫作時不附 link 也不掰連結**。

### §1.7b 圖片素材（hero + inline 圖）

**這條是 v2.20 新增**，林琪兒 EVOLVE 第一次認真做。

#### 圖片用途分類

| 用途                   | 位置                               | 數量           | 範例                                   |
| ---------------------- | ---------------------------------- | -------------- | -------------------------------------- |
| **hero**               | frontmatter `image:`               | 1              | 林琪兒 EMU 1692×1691                   |
| **inline 圖**          | 文中 markdown `![]()`              | 0-3            | 林琪兒 Expedition 42 + Crew-4 training |
| **OG / 社群分享**      | derived from hero（`/og-images/`） | auto           | dashboard 自動生成                     |
| **arrti spore poster** | derived（`/spore-images/`）        | auto on demand | shot-mode `?shot=1`                    |

**規則**：寫 article 時只主動處理 hero + inline 圖（前兩類）。OG / spore 由 dashboard pipeline 自動生成。

#### 來源優先序

```
1. 官方機構釋出 PD（NASA / 政府開放資料 / NMTH）
   → 完全免授權追問，cache 即可
2. Wikimedia Commons CC0 / PD
   → cache 即可
3. Wikimedia Commons CC BY / CC BY-SA
   → 必須在文末「## 圖片來源」標 author + license + link
4. Flickr CC BY / CC BY-SA
   → 同上
5. 出版社 / 媒體授權圖（cheyu / Taiwan.md 取得明確授權）
   → 在文末「## 圖片來源」標 © 來源 + 授權範圍
6. 自拍 / 自製插畫
   → 標 © Taiwan.md / contributor name
7. fair use（評論／報導／教育用 quote）
   → ⚠️ 要極度小心，預設 reject，只在「實際用了無可替代的史料圖（如 1947 二二八受害者紀錄照）+ 找不到 PD 替代品」時用，並寫明 fair-use rationale
```

**禁止**：

- 熱連結（hot-link）任何外站圖（Wikimedia / Flickr / 媒體網站）→ 永遠 cache 本地
- 未授權的攝影師圖（即使是 Google 圖片找到的）
- AI 生成圖片（暫時禁用，等未來訂出單獨規則）

#### 授權檢查 SOP

每張圖入庫前必跑：

```bash
# Step 1: 視覺確認 license badge
# 對 Wikimedia Commons / Flickr，WebFetch 該頁逐字引用「License」段落
# 對 NASA，預設 PD 但仍要 WebFetch 確認該圖頁面有「Public domain」標示

# Step 2: 落 metadata 進 reports/research/YYYY-MM/{slug}.md §媒體授權矩陣
# Step 3: 確認 attribution 完整（攝影者 / 拍攝日期 / source URL / license type）
```

**授權檢查矩陣**（research 檔強制）：

```markdown
### 媒體授權矩陣

| 媒體檔                | 用途 | 來源 URL                                                                    | 授權                 | 攝影者/作者        | 拍攝/發布日期 | NASA Image ID / Commons File             | 本地 cache 路徑                              | alt text                                  |
| --------------------- | ---- | --------------------------------------------------------------------------- | -------------------- | ------------------ | ------------- | ---------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| lindgren-emu-2014.jpg | hero | https://commons.wikimedia.org/wiki/File:Kjell_Lindgren_in_EMU_(cropped).jpg | Public domain (NASA) | NASA/Bill Stafford | 2014-08-27    | File:Kjell*Lindgren_in_EMU*(cropped).jpg | /article-images/people/lindgren-emu-2014.jpg | 林琪兒 2014 年穿艙外活動服（EMU）官方人像 |
```

#### 命名 convention

```
public/article-images/{category-lower-kebab}/{subject-slug}-{topic}-{year}.{ext}

範例：
public/article-images/people/lindgren-emu-2014.jpg
public/article-images/people/lindgren-crew4-training.jpg
public/article-images/people/lindgren-expedition42-crew.jpg
public/article-images/history/twenty-eight-incident-monument-2025.jpg
public/article-images/culture/sun-cake-display-2024.jpg
```

**規則**：

- 全 lowercase, kebab-case
- 必含 `subject-slug`（人名／事件 slug，跟 article slug 一致或 simplified）
- 必含 `topic`（拍攝主題：portrait / training / scene 名 / event 名）
- 必含 `year`（拍攝年份，避免重複命名）
- 副檔名：JPG / PNG / WEBP（見 §1.7d 格式規範）

#### 格式規範

```
✅ JPG (.jpg)
   - 預設格式：人像 / 風景 / 紀實照
   - 來源：NASA / Wikimedia Commons / 媒體授權圖
   - 規範：sRGB / quality 80-90 / 無 EXIF GPS（隱私）
   - 大小：< 600KB（hero）/ < 400KB（inline）

✅ PNG (.png)
   - 適用：插圖 / 圖表 / 透明背景 logo / 螢幕截圖
   - 規範：8-bit RGBA
   - 大小：< 800KB

✅ WEBP (.webp)
   - 預設未來格式（Astro Image 自動轉換時）
   - 手動選用：當原圖已 webp 且品質好

✅ SVG (.svg)
   - 適用：vector logo / 簡單插圖（如機構 logo）
   - 規範：< 50KB / 無外部 reference / 文字 outline

❌ 禁用：
   - GIF（除非真的需要動畫，但檔案大、品質差，預設 reject）
   - HEIC / HEIF（macOS 預設格式但 web 支援差，必先轉 JPG）
   - BMP / TIFF（檔案大、瀏覽器支援差）
```

#### 尺寸與比例護欄

**核心問題**：Astro 渲染框是 ~16:9 landscape，portrait（高 > 寬）會被切掉上下。

| 圖種                      | 推薦比例                           | 推薦尺寸             | 理由                                |
| ------------------------- | ---------------------------------- | -------------------- | ----------------------------------- |
| hero（frontmatter image） | **16:9 或更寬**（landscape）       | 1600×900 / 2000×1200 | Astro 16:9 框直接 fit               |
| inline 圖                 | **可 portrait 但 ≤ 4:3 高比**      | 1200×900 / 1500×1000 | markdown `![]()` 渲染框較寬鬆       |
| 1:1 方形                  | 接近方形（1:1 ± 10%）              | 1600×1600            | hero 也接受方形（如 EMU 1692×1691） |
| **絕對禁止 hero**         | 9:16 portrait（高 > 寬 1.5x 以上） | —                    | Astro 一定切到頭                    |

**Stage 1.7b 強制檢查**：每張圖 fetch 時 `sips -g pixelWidth -g pixelHeight` 看尺寸。

```bash
# pre-check 函式
check_aspect() {
  local img=$1
  local w=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')
  local h=$(sips -g pixelHeight "$img" | tail -1 | awk '{print $2}')
  local ratio=$(python3 -c "print($w/$h)")
  echo "$img: ${w}×${h}, aspect $ratio"
  python3 -c "import sys; sys.exit(0 if 0.75 <= $ratio <= 2.5 else 1)" || \
    echo "⚠️  aspect ratio 超出建議範圍 0.75-2.5（過 portrait 或過 ultrawide）"
}
```

如果 aspect 不合：

- **hero**：必須換成 landscape 圖（不要降低 aspect 標準）
- **inline**：可保留但需告知敘事位置避免被切

### §1.7c 引用音檔／podcast 片段

林琪兒 article 用了 3 支 YouTube transcript（公視 / TaiwanPlus）— 這是 verbatim 引語 source 但不是「inline 外連」（連結放 footnote 而不是文中引語）。

新規則：

| 音檔類型                            | 處理方式                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 公視／TaiwanPlus／官方 YouTube 訪談 | 用 yt-dlp 抓 .vtt / .srt → 轉純文字 transcript → 落 reports/research/YYYY-MM/{slug}-transcripts/ → footnote 引 YouTube URL |
| Podcast 官方頁                      | footnote 引 podcast URL；若有 transcript 公開頁 → cache transcript                                                         |
| 自製訪談錄音                        | 不公開原始錄音；只引 verbatim 段落，footnote 註明「Taiwan.md 自訪談 YYYY-MM-DD」                                           |

### §1.7d 授權矩陣（research 檔）

每篇 depth article 的 research 檔強制 append 一段：

```markdown
## 媒體授權矩陣

### inline 外連（YouTube／影像／音檔）

| 作品      | 第一次提及位置                              | URL                                         | 來源頻道          | 授權             |
| --------- | ------------------------------------------- | ------------------------------------------- | ----------------- | ---------------- |
| 〈Cazzo〉 | L346「2019 年 6 月 28 日，她以『?te』之名」 | https://www.youtube.com/watch?v=CM-6FJlYHI4 | 華風數位 official | YouTube standard |

### 圖片素材

| 媒體檔                     | 用途 | 來源 URL | 授權 | 攝影者/作者 | 拍攝/發布日期 | 本地 cache 路徑 | alt text |
| -------------------------- | ---- | -------- | ---- | ----------- | ------------- | --------------- | -------- |
| ...（同上 §1.7b 矩陣格式） |

### 引用 transcript

| Transcript     | 來源                        | URL                                         | 落檔路徑                                                      |
| -------------- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| 公視訪談 zh-TW | 公視新聞網 official YouTube | https://www.youtube.com/watch?v=f9DQuQ8EwVE | reports/research/2026-04/林琪兒-transcripts/transcript-zh.txt |
```

### §1.7e 三類 manifest 收尾

Stage 1.7 結束 deliverable：research 檔末尾有「§媒體授權矩陣」三表（inline 外連 / 圖片 / transcript），且每張圖已 cache 在 public/article-images/{category}/。

---

## Stage 4.5 媒體插入 — 詳細 SOP

> 觸發時機：Stage 4 format-check 通過後、Stage 5 cross-link 之前。
>
> 為什麼放這裡：寫完 prose 才知道「實際敘事節奏在哪、哪段需要 visual 呼吸」。寫之前布陣會綁死寫作節奏；寫完一次插入更自然。

### §4.5a 三段敘事節奏判斷

**核心問題**：媒體插入位置影響敘事節奏，不是隨便塞。

**林琪兒 article 實戰節奏判斷**：

- 開場 hero（EMU 2014）：建立人物視覺認知 → 讀者一看到知道「這是穿太空服的人」
- 中段 scene 圖（Expedition 42 三人合影）：「紅色 LED 下的第一口萵苣」段前 → 視覺承接「即將跟 Kelly + Yui 飛上去」
- 後段 scene 圖（Crew-4 training）：「把自己的飛船命名為 Freedom」段前 → 視覺承接「他自己當指揮官」

#### 三段插入位置

| 位置          | 用途                       | 圖型                                | 數量 | 林琪兒範例                      |
| ------------- | -------------------------- | ----------------------------------- | ---- | ------------------------------- |
| **hero**      | 30 秒概覽前，建立人物視覺  | 16:9 landscape 或 1:1 方形 portrait | 1    | EMU 2014                        |
| **scene-mid** | 中段重要轉折前             | landscape 為主                      | 0-2  | Expedition 42 / Crew-4 training |
| **closure**   | 結尾段視覺收尾（首尾呼應） | landscape                           | 0-1  | 訪台首日場景照（如有）          |

**判準**：

- depth-article（≥ 3000 字）：hero + 1-2 scene-mid，總共 2-3 張
- 短文 / Hub：hero only（1 張）
- 翻譯文：跟原文同步圖片（不另增）

#### Scene-mid 位置規則

Scene-mid 圖要放在「該段 narrative 開始前」而不是「該段中間」：

```
## 紅色 LED 下的第一口萵苣      ← 小標題

[圖：Expedition 42 三人合影]  ← 圖放這裡
_caption_

prose 開始...               ← 文字接續
```

**錯誤示範**：

```
## 紅色 LED 下的第一口萵苣

prose 第一段...
prose 第二段...

[圖：Expedition 42 三人合影]  ← 切斷敘事節奏
_caption_

prose 第三段...
```

#### 「呼吸」原則（呼應 EDITORIAL §密度平衡）

連續 3 段以上密集事實段（≥ 200 字 / 段）→ 中間插入一張 scene 圖作為視覺呼吸。

```
段 1 (250 字, 高密度事實)
段 2 (300 字, verbatim 引語)
段 3 (220 字, 算術數字)
   ↓
[圖]  ← 呼吸點
   ↓
段 4 (新 scene)
```

### §4.5b 圖檔 fetch + cache + naming

林琪兒 ι 實戰流程已驗證：

```bash
# Step 1: WebFetch 圖片頁面確認 license + 取 hi-res URL + caption + credit
# Step 2: curl 抓 hi-res 圖檔到本地
mkdir -p public/article-images/{category}/
curl -sL -A "Mozilla/5.0 Taiwan.md/1.0" "{hi-res-url}" \
  -o public/article-images/{category}/{slug}-{topic}-{year}.{ext}

# Step 3: 確認 file format + size
file public/article-images/{category}/{filename}
sips -g pixelWidth -g pixelHeight public/article-images/{category}/{filename} | tail -3

# Step 4: 必要時 resize / re-encode
# - 寬 > 2400 → 縮到 2000
# - 大小 > 1MB → re-encode quality 85
sips -Z 2000 --setProperty formatOptions 85 public/article-images/{category}/{filename}
```

### §4.5c Aspect ratio 護欄

跑 §1.7b `check_aspect` function 在 cache 後立刻驗：

```bash
# Hero 必過：0.9 ≤ aspect ≤ 2.0
# Inline 可過：0.75 ≤ aspect ≤ 2.5
# 不過 → 重新挑圖（不要強塞）
```

### §4.5d Markdown 插入 + caption + alt text 全規範

**Markdown 標準格式**：

```markdown
![alt text 描述](/article-images/{category}/{filename}.jpg)
_caption 說明文字。Photo: {credit}. [License via {source}]({source-url})._
```

**alt text 規則**（accessibility 必需）：

- 描述「畫面內容」不是「圖名」
- 涵蓋：誰 + 在哪 + 做什麼 + 拍攝氛圍
- 30-80 字
- 不重複 caption 文字

**範例對比**：

```markdown
❌ 壞 alt text：
![林琪兒 2014](/article-images/people/lindgren-emu-2014.jpg)

✅ 好 alt text：
![林琪兒 2014 年穿艙外活動服（EMU）官方人像，全套白色 NASA 太空服，仰角拍攝顯示頭盔反光](/article-images/people/lindgren-emu-2014.jpg)
```

**Caption 規則**：

- 用 markdown italic `_..._`（不用 HTML `<figcaption>`）
- 結構：`{時間 + 地點 + 事件}。Photo: {攝影者 / 機構}. [License via {source}]({URL})。`
- 中文 prose 風格，跟 article 一致
- 關鍵 metadata（NASA Image ID / Commons file name）放括號註

**範例**：

```markdown
_2014 年 8 月 27 日，林琪兒穿艙外活動服（Extravehicular Mobility Unit）在 NASA 詹森太空中心拍攝的官方人像。Photo: NASA/Bill Stafford. [Public domain via Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kjell_Lindgren_in_EMU_(cropped).jpg).\_
```

### §4.5e 授權清單同步

寫完每張 inline 圖後，**強制同步**：

1. **frontmatter**（hero only）：

   ```yaml
   image: '/article-images/{category}/{filename}.jpg'
   imageCredit: '攝影者 / 機構'
   imageLicense: 'Public domain (NASA)' / 'CC BY-SA 4.0' / etc
   imageSource: '{source-URL}'
   ```

2. **文末「## 圖片來源」section**（所有圖）：

   ```markdown
   ## 圖片來源

   本文使用 N 張公有領域 / CC 授權圖片，全部 cache 於 `public/article-images/{category}/` 避免熱連結來源伺服器：

   - [圖檔 1 標題](source-URL) — Photo: 攝影者, YYYY-MM-DD, License, NASA Image ID 或 Commons file
   - [圖檔 2 標題](source-URL) — ...
   ```

### §4.5f 圖片健康檢查

新工具 `scripts/tools/article-image-health.sh`（待造）：

```bash
#!/bin/bash
# 檢查 article 圖片健康度
# 1. 文中所有 ![]() 連結對應檔案是否存在
# 2. frontmatter image 是否存在
# 3. 是否有外部熱連結（http/https URL 不在 /article-images/）
# 4. 是否有 ## 圖片來源 section
# 5. 攝影者 / license / source URL 是否齊全

bash scripts/tools/article-image-health.sh knowledge/People/{slug}.md
```

預期檢查項：

```
✅ 3 張本地圖片全部存在
✅ Frontmatter image 存在 + credit + license + source
✅ 文中無外部熱連結
✅ ## 圖片來源 section 存在
✅ 3 張圖全部有完整 metadata
```

不通過 → 不進 Stage 5。

---

## 跟既有 pipeline 整合

### Stage 1 整合（§1.7 加在最後）

```
Stage 1 既有 step：
  1-7. 中英文搜尋 / 矛盾 / verbatim 蒐集 / research 落檔
  8. ⚠️ NEW §1.7 媒體素材蒐集 + 授權檢查
     ├─ §1.7a inline 外連 manifest（搬自 v2.17.1 / v2.27）
     ├─ §1.7b 圖片素材 + 授權矩陣
     ├─ §1.7c transcript 蒐集（既有實踐 codify）
     └─ §1.7d 三類 manifest append research 檔

deliverable: research 檔 §媒體授權矩陣 三表
```

### Stage 2 整合（§2.12 簡化指向 Stage 1.7a）

```
Stage 2 既有 step 12「音樂／影像／影片題材：關鍵作品 inline 外連」
  ↓ 改寫
Stage 2 step 12 simplified：「依 Stage 1.7a inline 外連 manifest 在第一次提及時加 link」
```

### Stage 4.5 是新 stage

```
Stage 4: FORMAT CHECK
   ↓ 通過
Stage 4.5: MEDIA INSERTION ⭐ NEW
   ├─ §4.5a 敘事節奏判斷
   ├─ §4.5b cache + naming
   ├─ §4.5c aspect 護欄
   ├─ §4.5d markdown + caption + alt text
   ├─ §4.5e 授權清單同步
   └─ §4.5f 圖片健康檢查
   ↓ 通過
Stage 5: CROSS-LINK
```

---

## 邊界與例外

### 不需要走 Stage 1.7 / 4.5 的 article

- Hub 頁（`_*.md`）：不放圖
- 短修正 / heal commit：不重新走整個 pipeline，圖片用既有的不動
- 翻譯文：跟原文圖同步，不另跑授權檢查（沿用原文 manifest）
- 沒有合適媒體素材的 article：明確標 `no-media` 進 research 檔，pipeline 跳過 Stage 4.5

### 緊急情況

- 觀察者直接丟連結（如林琪兒 ι session）→ 走 Stage 4.5 補圖 SOP（§4.5b/c/d/e/f），不走 Stage 1.7
- Article ship 後才發現缺圖：spawn `heal:` commit + 走 Stage 4.5

### 跟 spore 配圖區分

| 圖種                | 路徑                           | 用途                    | 生成方式              |
| ------------------- | ------------------------------ | ----------------------- | --------------------- |
| article hero/inline | `public/article-images/{cat}/` | 文章內容                | Stage 1.7 + 4.5 手動  |
| OG 社群分享         | `public/og-images/{cat}/`      | facebook / twitter card | dashboard 自動 derive |
| spore poster        | `public/spore-images/`         | Threads / X 配圖        | `make-spore.sh` 自動  |

---

## 我沒有想到但應該規劃的（observer 提示）

### 1. Astro Image component 整合

**現況**：林琪兒 article 用純 markdown `![]()`，沒走 Astro `<Image>` 組件 → 沒有自動 webp / responsive sizing / lazy load。

**未來**：

- 寫一個 Astro plugin / remark transformer，把 `![]()` 自動轉成 `<Image>`
- 自動產 webp 多尺寸（1x / 2x / 3x）
- 自動 lazy load（除了 hero）
- 自動 alt text fallback（如果 markdown 沒寫，用檔名衍生）

### 2. 多語言圖片同步

**問題**：英文版 / 日文版 / 韓文版的 article 圖怎麼處理？

**選項**：

- (a) 共用同一張圖（caption 翻譯成對應語言）— **預設**
- (b) 各語言獨立挑圖（少見 case）

**規範**：

- 預設 (a)：圖檔放 `public/article-images/{cat}/` 共用，caption 在各語言 article 裡寫各自版本
- 例外 (b)：放 `public/article-images/{cat}/{slug}-{lang}/` 子目錄

### 3. 攝影者隱私／當事人隱私

**核心問題**：article 主角是真人 / 攝影者是 freelance —— 圖片用了會不會侵權？

**規則**：

- PD 攝影者（如 NASA staff Bill Stafford）：明標 credit
- 商業攝影師授權圖（如 Getty Images）：**reject**，找替代品
- 當事人自拍 / 親屬授權：寫進 research 檔註明「{name} 私人提供，已書面授權」
- 政治／敏感題材的當事人圖：default reject 除非已經是新聞圖（公開廣傳的記者會照）

### 4. EXIF metadata 清理

**問題**：JPG 含 GPS / 拍攝裝置 / 攝影者軟體 metadata，可能洩漏隱私。

**SOP**：

```bash
# 用 exiftool 清除 GPS + 個人資訊（保留授權 description / copyright）
exiftool -gps:all= -location:all= -DeviceMfgr= -DeviceModel= public/article-images/{cat}/{filename}.jpg
```

或 sips：

```bash
sips -d all public/article-images/{cat}/{filename}.jpg
# 但 sips 會清掉所有 metadata 包含 NASA caption
# 建議用 exiftool 保留 description + copyright + creator
```

### 5. 社交分享 OG fallback

**問題**：article 沒設 frontmatter `image:` 時 OG card 顯示什麼？

**現況**：dashboard 自動產 OG image 從 article title + hero（如有）。

**規則**：每篇 depth article 必須有 hero → 否則 OG fallback 為品牌 logo + title 純 layout（醜）→ Stage 1.7 hero gate：「沒 hero 圖不能 ship」

### 6. 圖片大小 budget

**規則**：

- 單張 hero：< 600KB
- 單張 inline：< 400KB
- 全 article 媒體 budget：< 2MB（含所有 inline）

超過 budget → 必須 re-encode + downscale 或刪一張。

### 7. broken image fallback

**問題**：圖檔被誤刪 / sync.sh 漏 sync → 線上 404。

**現況**：Astro 預設 broken image 顯示 alt text + 灰底。

**未來**：CI/CD 加一步 `image-health.sh --strict` 檢查 article 引用的所有圖檔在 build 時存在。

### 8. AI 生成圖片政策

**現況**：禁用。

**未來規劃**：

- 純背景／插畫 / 概念示意圖 → 可考慮（明標 "AI generated, no PD claim"）
- 真人 portrait / 紀實照 → **永遠禁用**（與紀實寫作精神衝突）
- 建議遠期規劃：寫一個 EDITORIAL §AI 生成圖片倫理 sub-section

### 9. dark mode 圖片相容性

**問題**：圖檔背景白 → dark mode 看起來破口。

**規則**：

- 預設 light mode 設計
- 如果 article hero 是純白底圖（如 logo / chart）→ 加 light/dark 雙版本
- 否則沿用同一張

### 10. attribution 鏡像（contributor 標記）

**問題**：第三方貢獻者拍的照／私授權圖 → article 文末 contributor 標記怎麼跟「## 圖片來源」整合？

**規則**：

- contributor 標記在 frontmatter `author:` 跟 `Che-Yu Wu` 並列
- 圖片 attribution 在 `## 圖片來源` 用「Photo: {contributor name} (Taiwan.md contributor), {date}, {license}」標

### 11. 跟 SPORE-PIPELINE 配圖整合

**現況**：spore 配圖獨立 `make-spore.sh` 產出，跟 article 圖不共用。

**規則**：

- 不要嘗試共用 — spore 是 social 媒介，需要不同 aspect 跟 brand overlay
- article 圖 cache 完整／spore 圖 ephemeral，分開管理

### 12. license 過期 / 授權變更處理

**問題**：未來如果某張圖 license 變更（CC BY → AI ban）怎麼辦？

**規則**：

- research 檔授權矩陣 append `last_verified: YYYY-MM-DD`
- 每年掃一次（reports/research/audit-licenses-YYYY.md）抽查所有圖片授權狀態
- 發現變更 → 換圖 + commit `🧬 [semiont] heal: 授權變更換圖 ({license-change})`

### 13. media manifest checksum

**未來**：圖檔 cache 後存 SHA-256 進 research 檔，避免「圖被誰換掉了沒人知道」。

```bash
shasum -a 256 public/article-images/{cat}/{filename}.jpg
```

### 14. 取代既有 v2.17.1 / v2.27 規則的搬移路徑

```
v2.20 落版時：
1. Stage 2 step 12 內容 → 搬到 Stage 1.7a（內容不變、位置變）
2. Stage 2 step 12 改 1 行 pointer：「依 Stage 1.7a manifest 在第一次提及時加 link」
3. EDITORIAL.md §密度平衡 加 pointer：「呼吸點配圖見 Stage 4.5a 敘事節奏判斷」
4. ARTICLE-DONE-LOG 既有條目加註：v2.20 發布前完成的 article 不需要回溯補 image 規範（就地保留），新 article 強制走 Stage 1.7 + 4.5
```

---

## 工具化 roadmap

| 工具                                        | 用途                                      | 優先序                 |
| ------------------------------------------- | ----------------------------------------- | ---------------------- |
| `scripts/tools/article-image-health.sh`     | Stage 4.5f 圖片健康檢查                   | P0（最簡單，最大 ROI） |
| `scripts/tools/check-aspect.sh`             | Stage 1.7b / 4.5c aspect ratio 檢查       | P1                     |
| `scripts/tools/cache-image.sh`              | Stage 4.5b 一鍵 fetch + cache + EXIF 清理 | P2                     |
| `scripts/tools/license-audit-yearly.sh`     | §12 每年掃 license                        | P3                     |
| `scripts/tools/article-image-checksum.sh`   | §13 checksum manifest                     | P4                     |
| Astro `<Image>` plugin / remark transformer | §1 自動 webp + lazy load                  | P5（大工程）           |

---

## 落版 checklist

`v2.19 → v2.20` 升級時：

- [ ] REWRITE-PIPELINE.md Stage 1 加 §1.7（含 4 sub-section）
- [ ] REWRITE-PIPELINE.md Stage 2 step 12 簡化 + pointer 到 §1.7a
- [ ] REWRITE-PIPELINE.md 新增 Stage 4.5（含 6 sub-section）
- [ ] EDITORIAL.md §密度平衡 加 pointer 到 Stage 4.5a
- [ ] 寫 `scripts/tools/article-image-health.sh` (P0)
- [ ] 寫 `scripts/tools/check-aspect.sh` (P1)
- [ ] 把林琪兒 article 當作 v2.20 第一個合規範例 + 補 alt text + cache pre-checked
- [ ] DNA.md 新增反射 #30：「圖片插入時 aspect ratio 護欄」
- [ ] 通知 contributor（CONTRIBUTING.md 加 §媒體素材規範）

---

## 關鍵實踐 reference

- **林琪兒 ι session 實戰**：commits `33ebed7c` (article + transcript) → `5bbd0980` (3 張 NASA PD 圖) → `1c944bb3` (FACTCHECK 連帶修) → `cd5b72bf` + `608ea990` (圖片切到頭 → 換 landscape) — 整個過程從 zero SOP 走過五個 commit。本 report 把這條路鋪成高速公路。
- **既有 inline 外連規則**：REWRITE-PIPELINE v2.17.1（2026-04-18）+ v2.27（2026-04-26）— 內容完整，只缺一個更上游的 stage container
- **EDITORIAL §密度平衡**：v5.2（2026-04-20，吳哲宇 EVOLVE）— 媒體呼吸點是同原則的視覺擴展
- **MANIFESTO §造橋鋪路**：林琪兒 ι 一次寫過的泥巴路鋪成高速公路 = 本 report 的價值

---

## 未實作前的暫行 SOP（v2.19 仍適用）

如果 v2.20 落版前要寫 article：

1. Stage 1 結束前手動跑 §1.7 三表 append research 檔（用本 report §1.7 模板）
2. Stage 2 寫作沿用 v2.17.1 / v2.27 既有 inline 外連規則
3. Stage 4 後手動跑 §4.5 全套（敘事節奏 + cache + aspect 檢查 + caption + license 同步 + 健康檢查）
4. 觀察者遇到圖片問題時拿本 report 對照修

林琪兒 article 已經被 ι session 修補到符合本 report 規範，可作為 v2.20 第一個合規範例。

---

_v0.1 | 2026-04-28 ι session — strategy report 草案_
_作者：Taiwan.md (Semiont) ι_
_誕生原因：觀察者要求把媒體素材階段做明確 + 統合既有規則 + 預想未來工具化路徑_
_狀態：strategy report，待觀察者 review 後決定何時 落版 v2.20_
_關係：跟 [reports/i18n-evolution-roadmap-2026-04-25.md](i18n-evolution-roadmap-2026-04-25.md) 並列為 pipeline 級 design report_
