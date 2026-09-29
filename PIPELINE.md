# 教學影片產線

從教案到 MP4 的完整流程、指令、閘門與平行策略。
以 `lessons/_reference-2A5`（貓抓老鼠，23 分 57 秒）為基準整理——那門課的講稿與版面就在包裡，新課照著改。

> 底下是**每一階段在做什麼**。實際執行時，④~⑧ 用 `tools/run-pipeline.mjs` 一行跑完就好：
> `cd lessons/<slug>/scripts && node ../../../tools/run-pipeline.mjs`
> 順序是硬依賴，那支已經寫死了，不會跑錯。

---

## 核心觀念

**所有東西都從 `lessons/<slug>/scripts/script-data.mjs` 長出來。**
它是講稿、畫面指定、停頓秒數的單一事實來源；改它就重跑產線，不要手動去改十個地方。

一句台詞同時決定四件事：

```js
{ who: 'Cooper', action: 'thinking', text: '不按滑鼠時老鼠在哪裡？', hold: 4 }
//  ↑ 哪個角色動畫      ↑ 什麼表情動作        ↑ 字幕內容           ↑ 講完停幾秒
```

---

## 八個階段

```
① 讀教案
      ↓
② 寫大綱 ＋ 講稿
      ↓
③ ★閘門★ 審核 Agent ──FAIL──→ 退回 ②（上限 3 次）
      ↓ PASS
④ ├─ 素材取得（內部串行）
   └─ 語音合成（三角色串行，見「平行策略」）
      ↓ 合流
⑤ 回填紅框座標 → 組建 composition → 混音效床
      ↓
⑥ ★閘門★ 抽影格檢查 ──FAIL──→ 退回 ⑤（上限 2 次）
      ↓ PASS
⑦ 渲染 MP4
      ↓
⑧ 成品抽驗
```

### ① 讀教案

```bash
node tools/analyze/prep-course.mjs <教案.pptx> [slug]
#   → lessons/<slug>/{slides,scripts,output}/
#   → scripts/教案摘要.md（逐頁文字＋每張圖的尺寸與長寬比）
#   → scripts/course.json、script-data.mjs（骨架）
#   → hyperframes-project/assets/<slug>/raw/（教案裡所有圖片與影片）

# 只想先看看這份教案在教什麼，什麼都不要建：
node tools/analyze/prep-course.mjs <教案.pptx> --summary-only
```

抽出來之後**人工判讀**，確認每頁要教什麼、哪幾張是「學生要照著排的程式截圖」。

> ⚠️ 這一步不能跳。2A5 就是靠 p.14 的圖看出 `touching Sprite1?`，
> 才推斷出計分程式必須寫在**角色**身上——舞台根本沒有這塊積木。

### ② 寫大綱 ＋ 講稿

編輯 `scripts/script-data.mjs`。**這是設計的主體，不建議拆給多個 Agent 寫**（見下方「平行策略」）。

紅框在這階段只寫**語意**（要框什麼），數值等素材到手再回填。

### ③ 閘門：審核 Agent

規格見 `scripts/review-script.md`。硬性項目任一 FAIL 就退回 ②。

```bash
cd lessons/<slug>/scripts
node ../../../tools/produce/gen-script-md.mjs grade1-3.md   # 產出可讀講稿
python3 ../../../tools/qc/check-questions.py           # 提問收尾複查（機器可驗的部分）
```

### ④ 素材取得 ∥ 語音合成

**這兩條可以同時跑**，寫入目標完全不重疊。

素材（內部串行，不可再拆）：

```bash
python3 ../../../tools/produce/crop-code.py <整頁截圖> <輸出> <x> <y> <w> <h>   # 裁程式碼圖
python3 ../../../tools/produce/measure-code.py <程式碼圖>...                    # 量紅框座標
```

語音（**三個角色要串行**，理由見下方「平行策略」）：

```bash
node ../../../tools/produce/gen-voice.mjs Cooper --dry     # 先估配額
for w in Cooper Max Cora; do node ../../../tools/produce/gen-voice.mjs $w; done
```

> 檔名用台詞內容的雜湊，插一句話不會讓後面全部失效，只重新合成新增的幾句。

### ⑤ 組建

```bash
node build-composition.mjs ../../../hyperframes-project/index.html
python3 ../../../tools/produce/mk-audio-bed.py
cd ../../../hyperframes-project && npx hyperframes lint .    # 需 0 error
```

> `build-composition.mjs` 是**課程專屬**的，每門課一份，從 `lessons/_reference-2A5/scripts/` 那份改。
> 它會整份覆寫 `hyperframes-project/index.html`——同時只能有一門課的母帶在裡面。

### ⑥ 閘門：抽影格檢查

```bash
node ../../../tools/qc/check-frames.mjs
```

自動找出每個紅框的淡入時間，各截一格存到 `output/frame-check/`，人或 Agent 逐張確認「框有沒有標到重點」。

> 2A5 這關抓到 3 個真錯誤：紅框指向空白處、沒指到目標、被對話框遮住。
> 在 render 之前跑，改完重建即可，不用重跑 18 分鐘的渲染。

### ⑦ 渲染

```bash
cd hyperframes-project && npm run render     # 23 分鐘的片約需 18 分鐘
```

輸出在 `hyperframes-project/renders/*.mp4`，完成後複製到 `lessons/<slug>/output/`。

### ⑧ 成品抽驗

```bash
node ../../../tools/qc/verify-output.mjs ../output/grade1-3.mp4
```

時長對不對得上時間軸、有沒有破音、人聲夠不夠亮、停頓時音樂有沒有壓低，
再抽 8 格到 `output/verify-frames/` 供目視。判準見 [tools/README.md](tools/README.md#verify-outputmjs--成品閘門渲染後)。

---

## ⚠️ 執行順序不能亂

```
改台詞 → gen-voice → build-composition → mk-audio-bed → lint → render
```

- **`gen-voice` 必須在 `build-composition` 之前**：build 要讀 `voice-durations-*.json`
  用實際語音長度排時間軸。順序顛倒會退回字數估算，字幕跟聲音就對不上。
- **`mk-audio-bed` 必須在 build 之後**：它讀的是 build 產生的 `sfx-cues.json`。

---

## 平行策略

**能平行的只有三處**，加上跨課程：

| 可平行 | 說明 |
|---|---|
| 素材的三條線 | 拍操作截圖／裁程式碼圖／檢查角色素材 |
| 檢查閘門 | lint ∥ 提問複查 ∥ 影格檢查分段 |
| **不同課程** | 2A5、2A6、2A7 各一條產線，完全獨立 ← 效益最大 |

> ⚠️ **三個角色的配音「不要」平行**（2A4 修正）。
> 它們的**寫入目標**確實不衝突（各寫各的 `voice-durations-<角色>.json`），
> 但每個 `gen-voice.mjs` 內部併發 4 條，三個一起就是 **12 條打向 voai**。
> 2A4 實測 311 句掉了 52 句。改成串行：
> `for w in Cooper Max Cora; do node ../../../tools/produce/gen-voice.mjs $w; done`

**不能平行的：**

- `寫稿 → 配音 → 組建 → 音效床 → 渲染` 是硬依賴鏈
- **操作截圖內部**：是一條連續的狀態流（先刪角色才能加貓、先加貓才能寫貓的程式），拆給兩個 Agent 只會打架
- **寫稿本身**：分章節給不同 Agent 會讓角色語氣飄、紅框關鍵字撞、前後呼應斷

**跟渲染同時做的應該是「下一堂課的前段」**，不是這堂課的檢查——檢查是閘門，發現問題就要重跑渲染。

---

## 閘門與重試上限

| 閘門 | 上限 | 超過怎麼辦 |
|---|---|---|
| ③ 講稿審核 | 3 次 | **停止產線**，輸出報告 |
| ⑥ 影格檢查 | 2 次 | **停止產線**，輸出報告 |

- 超過上限**不強制放行**——強制通過等於閘門失效。
- **原地打轉偵測**：若第 2 輪的 FAIL 項目與第 1 輪完全相同，代表沒讀懂退稿理由，提前中止。
- 每輪要帶**累積**的 FAIL 清單，避免「修好 A 弄壞 B、修好 B 又弄壞 A」。
- 稽核紀錄寫進 `review-log.json`（輪次、判定、FAIL 項目、講稿雜湊）。

---

## 工具清單

腳本分兩層：**共用在 `tools/`（再依用途分 analyze／produce／qc），課程專屬在 `lessons/<slug>/scripts/`**。
共用腳本一律從課程的 `scripts/` 執行，脈絡由 cwd 推導（讀該目錄的 `course.json` 與 `script-data.mjs`）。

**每支腳本能不能單獨用、吃什麼吐什麼，見 [`tools/README.md`](tools/README.md)。**

| 檔案 | 位置 | 用途 |
|---|---|---|
| `script-data.mjs` | 課程 | 講稿單一事實來源 |
| `build-composition.mjs` | 課程 | 產生 `index.html` 與 `sfx-cues.json` |
| `course.json` | 課程 | 路徑與參數（`voiceDir`／`bgm`／`stepsDir`／`checkIns`／`minDuration`⋯） |
| `crop-regions.py` | 課程 | 每張操作截圖要裁哪一塊 |
| `analyze/prep-course.mjs` | 共用 | 教案 pptx → 逐頁摘要＋課程骨架（`--summary-only` 只讀不寫） |
| `run-pipeline.mjs` | 共用 | 把配音→組建→音樂床→檢查→渲染→抽驗串成一條 |
| `lib/course.mjs` `lib/course.py` | 共用 | 由 cwd 解析課程脈絡 |
| `produce/gen-voice.mjs` | 共用 | TTS，內容雜湊快取、缺檔保護 |
| `produce/mk-audio-bed.py` | 共用 | 音樂＋音效預混成一條音樂床 |
| `produce/gen-script-md.mjs` | 共用 | 產出可讀講稿 |
| `produce/crop-step.py` | 共用 | 整頁截圖裁成編輯器 16:9 |
| `produce/crop-code.py` | 共用 | 從整頁截圖裁出單段程式碼 |
| `produce/measure-code.py` | 共用 | 從程式碼圖量出紅框百分比座標 |
| `produce/mk-click-sfx.py` | 共用 | 產生滑鼠點擊音效 |
| `qc/check-questions.py` | 共用 | 找出有停頓卻沒收尾的提問 |
| `qc/check-frames.mjs` | 共用 | 抽出每個紅框那一格供檢查 |
| `qc/check-boxes.py` | 共用 | 紅框畫回原圖＋疊網格，**渲染前**確認座標有沒有對準 |
| `qc/verify-output.mjs` | 共用 | 成品抽驗（時長／音量／抽格） |

> **新增課程不要整包複製腳本**。2A4 複製了一份，結果修好的缺檔保護沒回流到 2A5——
> 這正是抽出 `tools/` 的原因。新課程只要一份 `course.json` ＋ 自己的講稿與版面。

## 踩過的坑

**音效必須預混，不能逐顆掛 `<audio>`**
composition 每多一個長音訊元素，載入就會超過框架的 10 秒上限（跟檔案大小無關，是元素數量）。

**`sfx-cues.json` 的寫檔時機**
必須在 `customJS` 跑完之後才寫，否則客製動畫裡登記的音效會被整批丟掉。

**Scratch 素材裡的空白是不換行空格**
`data_changevariableby.svg` 的「my variable」用的是 U+00A0，直接字串比對會失敗，要用 `\s` 正規表示式。操作遊樂場抓積木時也是同一個坑。

**換程式碼圖要一併重算紅框**
紅框是百分比定位，換圖就全部失準。用 `measure-code.py` 重量，不要目測。

**紅框別放畫面最左邊**
會被 Cooper 的對話框整個蓋住（2A5 的 d07 踩過）。

**素材要等稿定才拍**
2A5 邊拍邊想，拍了 37 張只用約 30 張，7 張白工。

---

### 2A4 新增的坑

**配音掉句是「靜默」的，不會印失敗**
三角色併發（12 條）打 voai，2A4 掉了 52/311 句，`重試 3 次` 一次都沒觸發、`失敗` 一行都沒印——
是進程直接崩在後面的轉 m4a 迴圈（`ffmpeg` 找不到那幾個缺的 wav）。
崩掉的代價是 `voice-durations-<角色>.json` 整個寫不出來，前面幾百句的配額形同白花。
**轉檔前一定要擋缺檔**：`existsSync(wav) && statSync(wav).size >= 1024`，缺的收集起來最後報出來並 `process.exitCode = 1`。
內容雜湊當檔名，補跑只會重打缺的那幾句。

**`GET /Key/Usage` 的標頭與欄位**
用 `x-api-key`（不是 `Authorization: Bearer`，後者回 401）。
回傳 `current` 是**剩餘**額度、`total` 才是總額。

**通用 Scratch 積木 SVG 上的變數名不是課程的變數名**
`data_setvariableto` / `data_changevariableby` / `data_variable` 寫的是 `my variable`、`score`。
直接拿來教「把 steps 設成 0」，學生在自己螢幕上找不到對應的積木。
優先用教案原始截圖或從程式截圖裁出的單塊積木；真的要改 SVG 文字，
**比對一定要用 `\s`**（Scratch 匯出的空白是 U+00A0，`'my variable'` 字串比對必定失敗，
而且失敗是靜默的——只會看到寬度被改、文字沒換，畫面上變成被裁掉的「ny variabl」）。

**`measure-code.py` 會把相鄰同色積木併成一塊**
`go to x y` 和 `set rotation style` 都是藍色，會量成一個大框。
遇到就改用「疊 4% 網格輸出成圖、目視讀百分比」，比跟腳本纏鬥快。

**教案素材不一定還存在於學生系統**
2A4 教案用 `Sprite1`（經典 Scratch 貓），但系統角色庫顯示
「Some items that contained Scratch trademarks are no longer listed here」，實際只有 `Cat 2`。
**開拍前先在系統裡搜一次教案提到的角色與背景**，對不上就同時改講稿與畫面。

---

### 2A1 新增的坑

**接長影片一定要重設關鍵影格間隔**
音樂或示範影片用 `ffmpeg -stream_loop` 接長之後，關鍵影格會相隔好幾秒（2A1 實測 3.8~8.3 秒）。
渲染是**逐格 seek**，關鍵影格太稀疏代表每要一張影格都得從上一個關鍵影格重新解碼一路追上來。
2A1 第一次渲染 34 分鐘只跑到 29%（換算全片 117 分），加上 `-r 30 -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart`
重編後降到 54 分鐘。hyperframes 在編譯階段其實會警告
（`sparse keyframes ... causes seek failures`、`is variable frame rate (VFR)`），
但那行訊息很容易被管線吞掉——**渲染時不要把輸出接給 `tail`**，要完整落檔再看。

**影片一定要比它所在的段落長**
clip 播完就消失，露出底下的白卡。2A1 的成品影片只有 3.78 秒卻放在 18.4 秒的段落，
後半整段是白框，抽格才發現。`build-composition.mjs` 現在會在影片比段落短時直接丟例外。

**純音樂比片長短是靜默失敗**
`mk-audio-bed.py` 舊版只把音樂複製到它自己的長度為止，後面整段沒有音樂、什麼都不印。
2A1 用 2 分 11 秒的曲子配 21 分的片，19 分鐘無配樂。現在會擋下來並印出接長指令。

**光靠 composition 的 0.68 增益壓不住音樂**
那只降 3.3 dB。2A1 實測停頓 -21.5 dB、人聲 -16.3 dB，只差 5 dB（規範要求 ≥12），成品抽驗判不過。
`mk-audio-bed.py` 現在依實際 RMS 把音樂正規化到 -26.6 dBFS，播出後約 -30 dB。

**去背不能用「顏色接近就挖掉」**
教案積木截圖的背景是 `#F9F9F9`(249)、積木上的字是純白(255)，只差 6。
容差設 8 就會把字一起挖成透明，綠板從筆畫裡透出來。
改成**從四邊 flood fill**，只清跟邊界相連的背景，字被積木包在中間就不會被誤傷。

**操作截圖的長寬比差很多，容器不能固定**
教案裁出來的截圖比例從 0.84（直式登入頁）到 6.23（超寬的面板）都有。
固定 16:9 容器配 `background-size: cover` 會把圖裁掉大半；改成 `contain` 又會變成大白卡裡一條細線。
正解是**卡片跟著圖的比例走**——用 build 期讀到的原始尺寸算出每張的顯示方框，卡片就是那個方框。

**紅框要放進「圖片」的容器，不是卡片的容器**
紅框是百分比定位。圖片一旦被裁切或置中留白，相對卡片的百分比就跟圖片座標對不起來，整組框全歪。

**紅框座標不要目測**
2A1 第一版 26 個框全部目測，使用者回報「有些沒精準選取物件」，實際重量發現 14 個要修
（`code_snowman` 與 `ui_editor` 各 4 個全錯，框到隔壁區域或溢出到空白處）。
`tools/qc/check-boxes.py` 會直接從 `build-composition.mjs` 解析座標、把框畫回原圖並疊 5% 網格
（座標只留一份，不會兩邊記不同步）。改完重跑就能確認——比渲染 50 分鐘後才發現便宜太多。

**素材路徑錯了只會印一行 404**
`assets/scratch角色素材/` 底下其實還有一層同名目錄（背景素材則沒有）。
路徑寫錯時畫面靜靜開天窗，lint 不會擋、渲染照跑，只有渲染日誌裡一行
`[FileServer] 404 Not Found`。2A1 的結尾星星就是這樣整支不見。

**畫面上的介面用字要跟學生的螢幕一致**
第三章才剛帶學生把語言改成英文，後面的畫面與旁白就不能再說「動作」「音效」，
要說 `Motion`、`Sound`；右鍵選單是 `duplicate` / `export` / `delete`（順序也要照實際介面）。

**每個停頓都要有倒數圈**
不只練習題。學生看不到剩幾秒會以為畫面卡住。
`fx.mjs` 補了 `countdown3` / `countdown2`，段落組裝時依 `hold` 秒數自動掛上去，
但 `quiz` 段落要跳過——那裡的畫面已經自己畫了一個。

**這台機器的渲染基準**
i5-13420H / 7.6 GB RAM / Intel 內顯：21 分鐘的片、38,064 格，
`low-memory-mode`（固定 1 worker）下約 54 分鐘，逐格擷取佔 91%。
記憶體不足會強制單 worker，這是主要的速度差異來源。

### 2A1 第二輪修正（使用者回報後才發現的）

這四項都是**渲染完才被使用者指出來的**——代表抽格檢查漏掉了它們。
共同教訓：**抽格要挑「剛改過的段落」，不要只挑固定的等距時間點**。

**HTML 模板裡打成全形角括號，畫面會直接印出原始碼**
`＜div class="cratelid"＞` 這種全形 `＜＞` 瀏覽器不會當成標籤，整串當文字印在畫面上。
lint 不會擋（它是合法的文字節點）、渲染照跑。
產生 HTML 的樣板字串裡，**加一條 `grep -c "＜\|＞" index.html` 的檢查**，應該是 0。

**換了標籤文字就要重算容器尺寸**
家族名從中文（2~3 字）改成英文（`My Blocks`、`Operators`）後，原本 190px 的卡片會擠爆或換行，
換行又把卡片撐高、兩排對不齊。改文字時一併調寬度、字級，並加 `white-space: nowrap`。

**旋轉一個「圓」是看不出在動的**
第一版用虛線圓框當迴圈動畫並讓它 `rotation: 360` ——圓轉了還是同一個圓，畫面上完全靜止。
要有**缺口與箭頭**才看得出方向。
讓三角形沿著看不見的圓跑也不好：切線方向要自己算，稍有偏差就像掉在旁邊。
最穩的是直接畫一個「圓弧 + 箭頭尖」的 SVG，整個旋轉。

**片尾也要放片頭動畫**
`opening.mp4` 不是只放開頭。片尾再放一次收得住，而且它有原音，
背景音樂要在它開始前先壓到 0.22、結束前再淡到 0。
時間軸要分成 `CONTENT`（講稿內容結束）與 `TOTAL`（含片尾），不要混用。
