---
name: teaching-video-pipeline
description: 將國小教案投影片轉化為 1~6 年級教學動畫短片的完整產線。當使用者提供教案 PDF/PPTX 並要求做成教學影片、或說「幫我把這堂課做成 O 年級的教學影片」時使用。整合 hyperframes（動畫渲染）與 video-use（後製剪輯），並依年級調整口語講稿難度。
---

# 教學動畫影片產線

把 `lessons/<課程代號>/slides/` 裡的教案投影片，轉成適合國小 1~6 年級的口語講稿，再用 HyperFrames 組出動畫短片。

## 參考文件

| 文件 | 什麼時候讀 |
|---|---|
| [`references/teaching-rhythm.md`](references/teaching-rhythm.md) | **寫講稿前** — 課程骨架、段落切分、概念→實作交錯、等待學生的秒數、提問四拍法則 |
| [`references/agent-orchestration.md`](references/agent-orchestration.md) | **開工前** — 哪些開 Agent、哪些用腳本、兩個閘門的判定與重試上限 |
| [`references/codebrainy-capture.md`](references/codebrainy-capture.md) | **實機補素材前** — CodeBrainy 練習場的網址、16:9 尺寸、疊積木 API、裁切與命名 |
| `lessons/PIPELINE.md` | 執行時 — 各階段的實際指令與踩過的坑 |

## 整體流程

1. **讀取投影片** → 2. **依年級改寫講稿** → 3. **用 HyperFrames 組裝動畫** → 4. **渲染 MP4** → 5.（有真人口白/需精修時）**用 video-use 後製**

未經使用者確認講稿內容前，不要進入 HyperFrames 組裝步驟——先把講稿給使用者看過，避免組完動畫後才發現內容方向錯誤要重工。

## 資料夾慣例

```
lessons/<slug>/
├── slides/            使用者放入的教案 PDF/PPTX（唯讀，不要修改原檔）
├── scripts/
│   └── gradeN.md       每個年級一份講稿（N = 1~6，依需求產出，不必六個年級都做）
└── output/
    └── gradeN.mp4       最終渲染影片
```

`<slug>` 用課程主題的英文/拼音短代號（例如 `scratch-loop-intro`），不要用中文空白當資料夾名稱。

若 `lessons/<slug>/` 不存在，先建立好上述子資料夾再開始。

## 步驟 1：讀取投影片

用既有的 PDF/PPTX 解析能力（.pdf 用 pdf skill，.pptx 用 pptx skill）取出投影片的文字內容與頁面順序。保留投影片編號，之後講稿要能對應回「這段對應第幾頁投影片」。

### 一定要把投影片裡的程式碼截圖抽出來

**這是最容易漏掉、但對學生最重要的東西。** 程式課的投影片上會有「學生要照著排出來的完整程式」截圖，只放素材圖或自己拼的積木，學生根本不知道最後的程式長什麼樣子。

`.pptx` 本質是 zip，圖片都在 `ppt/media/`，用 `ppt/slides/_rels/slideN.xml.rels` 對回頁碼：

```bash
unzip -q -o <課程>.pptx -d /tmp/pptx && cd /tmp/pptx
python3 -c "
import re, os
for i in range(1, 40):
    f = f'ppt/slides/_rels/slide{i}.xml.rels'
    if not os.path.exists(f): continue
    imgs = re.findall(r'Target=\"\.\./media/([^\"]+)\"', open(f).read())
    print(f'p.{i}:', [x for x in imgs if x.endswith('.png')])
"
```

抽出來後**一定要用 Read 逐張看過**，分辨哪些是程式碼截圖、哪些只是角色圖或舞台圖，再複製到 `assets/code/` 並取有意義的檔名。

影片裡的處理方式：每教完一段積木，緊接一個「看完整程式碼」段落，把原始截圖放大展示（高度 480~500px），老師逐塊講解排列順序，最後留 3 秒讓學生抄。課程尾聲再放一個三段程式並排的總覽，並提示「暫停影片，照著螢幕排排看」。

程式碼截圖卡要**依原圖比例算寬度**（`width = height × 原圖寬/原圖高`），只給高度而讓容器用 `background-size: contain`，程式會縮成中間一小塊。

## 步驟 2：依年級改寫口語講稿

這是本 skill 的核心價值，不是逐字照唸投影片文字，而是「教學轉譯」。

### 年級難度分級原則

- **低年級（1~2 年級）**：短句（一句不超過 15 字）、用具體物品/生活比喻取代抽象詞、語氣像在跟小朋友聊天、重複關鍵詞加深印象、避免專有名詞（若必須出現要用比喻先鋪陳）。
- **中年級（3~4 年級）**：可以開始用簡單專有名詞但要搭配一句白話解釋、句子可稍長、可以問簡單的引導問題製造互動感。
- **高年級（5~6 年級）**：可用抽象概念與正式術語、可以講「為什麼」而不只是「是什麼」、句子結構可以更複雜、可以做前後單元的知識連結。

### 旁白對話風格（每支影片都要遵守）

- **角色定位固定**：Cooper 扮演「老師」主角，Cora 和 Max 是配角（學生/助教），三人「一搭一唱」對話推進教學——配角負責發問、答錯、驚呼、附和，老師負責引導與解答。不要讓單一角色從頭講到尾變成單純教課。
- **課程要可愛有趣**：以對話情境帶出知識點，不是照唸投影片。配角可以裝傻、搞笑、故意猜錯，讓老師糾正。
- **每個程式概念都要配一個生活化的生動例子**，先問小朋友、再用具體物品比喻、最後收斂回術語。範例（變數）：「小朋友你們知道變數是什麼嗎？你們是不是有很多爸爸媽媽買的玩具呢？每次玩完是不是都要收起來？賽車放賽車的收納箱、書本放書本的收納箱……變數就是一個箱子，可以幫你儲存東西！」
- **畫面要有大量動畫**：對話用「對話框」呈現、提問時冒出「問號符號」動畫、答對時有星星/勾勾、關鍵詞要有彈跳/蓋章等進場效果，避免靜態字卡。這類常用素材（對話框、問號、驚嘆號、星星等）直接在 HyperFrames 內以 CSS/GSAP 實作。
- **視覺風格要符合小學生喜好**：色彩鮮明（高飽和、活潑配色），圖卡與大字都要搭配動畫進場，不要沉悶的商務風。
- **嚴禁使用 emoji 當畫面元素**。畫面上的每個東西都要是：
  1. `assets/scratch角色素材/`（338 個 Scratch 官方角色：貓 043_Cat_2、老鼠 162_Mouse1、樹 232_Trees、麵包 029_Bread、鈴鐺 025_Bell、星星 217_Star、綠旗 114_Green_Flag、停止 219_Stop、氣球 015_Balloon1、禮物 107_Gift⋯⋯）
  2. `assets/scratch背景素材/`（86 張官方背景：樹林長椅 082_Woods_And_Bench、黑板 020_Chalkboard 等）
  3. `assets/scratch-blocks/` 官方積木 SVG
  4. 以上都沒有的（對話框、流程圖、收納箱、滑鼠游標、倒數圈、紅綠燈、跑道、勾／叉、分數板、想像雲朵⋯⋯）用 **CSS 精細繪製**，要畫得精美，不要草率的色塊
- **講解程式積木時**，直接調用官方積木 SVG，不要自己畫積木；積木寬度要夠大（1920 畫布下建議 300px 以上），否則積木上的字看不清楚。
- **但只要積木上帶「變數名」就不能用通用 SVG**。`data_setvariableto`／`data_changevariableby`／`data_variable` 上面寫的是 `my variable`、`score`，不是課程的變數名，學生在自己螢幕上對不起來。改用教案原始截圖，或從教案的程式截圖裁出那一塊。萬不得已要改 SVG 文字，**比對一定要用 `\s`**——Scratch 匯出的空白是 U+00A0，`'my variable'` 字串比對必定靜默失敗（結果是寬度被改、文字沒換，畫面上出現被裁掉的「ny variabl」）。
- **Scratch 角色 SVG 的長寬比差很多，不要塞進正方形容器**。貓咪（`043_Cat_2`）是 133×72 的橫長形，放進 170×170 的框再 `contain`，只會用到中間一條、看起來縮成一個小點。一律從 SVG 的 `width`／`height` 屬性換算容器尺寸（`width = height × w0/h0`），放進卡片後再用 snapshot 確認一次。
- **講解程式原理／學術內容的段落用統一背景**：用一張生成的教學背景圖（存於 `hyperframes-project/assets/backgrounds/`）跨段落、跨影片重複使用，維持「上課中」的一致感；開場、遊戲展示等情境段落才換情境背景。

### 片長與節奏

> **📐 完整的上課節奏標準見 [`references/teaching-rhythm.md`](references/teaching-rhythm.md)**
> —— 課程骨架、段落切分、「概念→立刻操作」的交錯結構、等待學生的秒數分級、
> 提問四拍法則、檢查點設計、易錯點的正面處理。寫講稿前先讀那份。

- 一堂課的教學影片**目標 15 分鐘以上**。時長要靠「內容」撐，不是把字幕停久——把每句停到 5 秒只會讓畫面看起來卡住。
- 撐長度的正確做法：把操作步驟拆細（怎麼找角色、怎麼拖積木、按綠旗執行）、每個概念多給一個生活例子、演示段落實際演完（調數字比快慢、真的追到加分）、**每個大段落後面放一題練習題**。
- 練習題要有真正的**思考時間**：題目講完後畫面倒數 5 秒（複習題 3~4 秒）再公布答案，不要一問完就揭曉。
- 帶做型段落（例如呼吸法）要留完整的帶做秒數，並做滿兩輪。
- **有配音時，每句停留一律用實際語音長度**（`voice-durations-<角色>.json`），不要用字數估算——估算會讓字幕跟聲音對不上。參數：語音長度 + 0.05 秒安全邊界，換人接話間隔 0.2 秒。
- 字數估算公式只在「還沒配音」的草稿階段用：每句 `1.7 + 0.15 × 字數` 秒（最短 3 秒）。
- 實際量測（2A5）：60 段 / 352 句 / 75 處停頓 ≈ **24 分鐘**。其中 9 段是實作示範。

### 講稿與畫面資料分離

講稿與時間軸不要寫死在同一個檔。建議：

```
lessons/<slug>/scripts/
├── script-data.mjs        講稿資料（角色、動作、台詞、hold 停留秒數、對應畫面 id）—— 唯一事實來源
├── build-composition.mjs  讀 script-data 產生 composition HTML（時間軸、CSS 元件、動畫）
└── gradeN.md              由 script-data 產生的人類可讀講稿（勿手動編輯）
```

改講稿只改 `script-data.mjs`，重跑 build 就能重建影片，不會出現「md 與實際影片對不上」。

### 角色動作要先驗證

每個角色只有特定幾個動作，用了不存在的組合（例如 `Cora` 沒有 `eureka`）會讓建置直接失敗或畫面開天窗。在 build 腳本裡放一份合法動作清單擋下來：

```js
const ACTIONS = {
  Cooper: ['greeting','talking','thinking','guide_left','guide_right','goodbye'],
  Cora:   ['greeting','talking','listening','encourage','goodbye'],
  Max:    ['greeting','talking','thinking','eureka','goodbye'],
};
```

### 講稿格式

每個 `scripts/gradeN.md` 用以下結構，逐段撰寫（每段對應一小段動畫，建議每段 5~15 秒）。一段內可有多位角色對話，每句對白標明角色與動作：

```markdown
## 段落 1（對應投影片 p.1）
對白：
  - Cooper（thinking）：「為什麼你的貓咪，怎麼點都不會動？」　hold 2
  - Max（thinking）：「我按了好多下都沒反應耶！」
字幕分段：
  - 為什麼你的貓咪
  - 怎麼點都不會動？
  - 我按了好多下都沒反應耶！
畫面提示：痛點字卡 `card({ text: '怎麼點都不會動？', tone: 'red', size: 'lg', fx: 'shake', at: 0 })`；Max 頭上冒出問號動畫
```

> **第一句不可以是問候語。** 前 3 秒必須是痛點提問或反常識的問題，
> 自我介紹排到第 8 秒之後，片頭動畫最長 2 秒且不可放在第一句之前——
> 這是學生退出率最高的位置，規則與句型見 [`references/teaching-rhythm.md`](references/teaching-rhythm.md)（一之二）。

- 「動作」欄位只能填 [[角色動作對照表]] 裡列出的動作名稱，不要發明不存在的動作。build script 要把不合法的組合**當成錯誤印出並 `process.exitCode = 1`**，只收集不回報等於沒擋。
- **每個觀念都要有一句直接問螢幕前學生的話，配 `hold` 給思考時間**（3~5 秒），再由 Max／Cora 示範回答。例如「換你想一個：如果天黑了，你就做什麼？」→ hold 5 →「想到了嗎？跟旁邊的人說說看。」單向講述的段落會讓低年級學生很快失去注意力。
- 講稿先產出後，**跟使用者確認內容是否符合該年級程度**，通過後才進入步驟 3。

## 角色動作對照表

素材位置：`hyperframes-project/assets/characters/`（**v3_Anchored 版**），12fps，畫布 2048×2048（包內縮成 512×512，版面上只有 420px，原尺寸是浪費）。

每個動作資料夾裡有三種形式，**用哪一種取決於要不要逐格控制**：

| 形式 | 用途 |
|---|---|
| `keyframes/keyframe_0N.png` ＋ `timing.json` | **預設用這個**。4 張關鍵格 + 播放順序，用 GSAP 子 timeline 切換（見下方寫法）|
| `*_alpha.webm` | 整段透明影片（VP9 alpha），不需要逐格對位時比較省事 |
| `manifest.json` | 16 組動作的 fps／秒數／影格數／播放順序總表 |

> **v3 修掉的是 Cora 的跳動。** 舊版 Cora 的 4 張關鍵格裡有 2 張腳底貼齊畫布底、2 張在 78~82%，
> 每個動畫週期腳底位置會跳 **18.8~21.7%**（420px 容器裡約 80~91px），看起來像角色在原地彈跳。
> v3 把所有關鍵格的雙腳下方中心鎖在 (1024, 1900)、統一 88% 縮放，實測 16 組動作的腳底位置
> 全部落在 93.2~93.4%，最大晃動 0.2%。
>
> 副作用：角色在容器裡佔的高度從貼底變成 77%，**會比舊版小一點、離容器底部高約 28px**。
> 新課排版面時把角色容器從 420px 放大到 460~480px 就能補回來。

| 角色 | action 值 | 中文 | 時長(秒) | 適合用途 |
|---|---|---|---|---|
| Cooper | greeting | 打招呼 | 1.5 | 開場 |
| Cooper | thinking | 思考 | 2.0 | 提出問題、停頓思考 |
| Cooper | guide_left | 向左指導 | 2.0 | 指向左側畫面重點 |
| Cooper | guide_right | 向右指導 | 2.0 | 指向右側畫面重點 |
| Cooper | talking | 說話嘴型 | 2.0 | 一般講解 |
| Cooper | goodbye | 再見揮手 | 1.5 | 結尾 |
| Cora | greeting | 打招呼 | 1.5 | 開場 |
| Cora | listening | 聆聽點頭 | 2.0 | 回應/附和 |
| Cora | encourage | 鼓勵比讚 | 2.0 | 鼓勵、稱讚學生 |
| Cora | talking | 說話嘴型 | 2.0 | 一般講解 |
| Cora | goodbye | 再見揮手 | 1.5 | 結尾 |
| Max | greeting | 打招呼 | 1.5 | 開場 |
| Max | thinking | 思考 | 2.0 | 提出問題 |
| Max | eureka | 恍然大悟 | 2.0 | 揭曉答案、恍然大悟時刻 |
| Max | talking | 說話嘴型 | 2.0 | 一般講解 |
| Max | goodbye | 再見揮手 | 1.5 | 結尾 |

若該課程涉及 Scratch 程式教學，`hyperframes-project/assets/scratch-blocks/` 內有 control/data/event/looks/motion/operator/sensing/sound 八大類積木圖示可直接用於畫面。

### 角色素材的三個坑（已實測踩過，務必照做）

1. **不要用 `*_alpha.webm`**：那些檔案實際是 `yuv420p`（沒有 alpha 通道）且缺 duration metadata，瀏覽器解不出來，畫面會完全空白。改用同資料夾的 `keyframes/keyframe_01~04.png`（真正的 RGBA），配合 `timing.json` 的 `keyframe_order_zero_based` 與 `fps` 逐格切換，就能做出口型／動作動畫。
2. **素材必須是專案內的實體檔案**：`assets/` 下若是指向專案外的 symlink，preview/render 伺服器不會提供該檔案（靜默 404、畫面空白）。用 `rsync -aL` 把實際檔案複製進 `assets/`，並把 2048×2048 的 keyframe 用 `sips -Z 512` 縮到 512px——否則上百張 1.5MB 大圖會載不完。
3. **角色 clip 要排在全屏段落 clip 之後**：HyperFrames 的堆疊順序看 DOM 先後，`data-track-index` 較大不會自動蓋過先出現的元素。角色若寫在全屏背景 clip 前面，會被背景整片蓋掉。

另外，clip 內的圖片一律用 `<div style="background:url(...)">` 而非 `<img>`，避免被框架的媒體探索接管（會觸發 `duplicate_media_discovery_risk` 且可能不渲染）。

### 角色逐格動畫的寫法

用 GSAP 子 timeline 疊 4 張 keyframe，依 `timing.json` 的播放順序切換顯示：

- 子 timeline 用**有限的** `repeat: N`（`N = Math.ceil(clip長度 / cycle) - 1`），不可用 `repeat: -1`
- 一輪結尾要補一組「重置回第一幀」的 `sub.set(...)`，讓子 timeline 長度剛好等於 cycle、repeat 能無縫接續
- **不要用 `sub.set({}, {}, cycle)` 這種空目標來補長度**——GSAP 會讓整條子 timeline 失效，結果是 4 張圖全部停在 `autoAlpha: 0`，角色完全不出現（這個症狀看起來很像素材壞掉，實際上是 timeline 問題）

## 步驟 3：用 HyperFrames 組裝動畫

### 動畫與字卡一律套共用模組，不要重寫

進場／離場動畫與字卡樣式都已經抽成模組，**寫 `build-composition.mjs` 時直接引用**：

```js
import { makeFx, makeFxOut, fxRuntimeJS } from '../../../tools/lib/fx.mjs';
import { makeCard, hi, CARD_CSS, FONT_CSS } from '../../../tools/lib/cards.mjs';
import { makePointers, POINTER_CSS } from '../../../tools/lib/pointers.mjs';
const fx = makeFx(hit), fxOut = makeFxOut(hit);
const card = makeCard(fx, fxOut);
const { arrow, circle, underline } = makePointers(fx, fxOut);
```

- 進場：`fadeIn` `pop` `zoomIn` `slideL` `slideR` `rise` `drop` `bounce` `stamp` `flip` `float` `twinkle` `qmark` `shake` `pulse`
- 離場：`fadeOut` `slideOutL` `slideOutR` `popOut`（用 `fxOut()`，且**必須搭配一個進場**）
- 字卡：`shape` 二選一（`box` 實心白框／`text` 純文字白描邊），`tone` 六色語意（`red` 專給警告），`size` 四級
- 關鍵字：`hi('詞')` 放大 22% ＋ 換色，**一句只標一個**；倍率與顏色可覆寫（`hi('詞', { color: '#FF00AA', scale: 1.9 })`），整片預設改 `HI_DEFAULT`
- 視線引導：`arrow` 指一個小目標／`circle` 圈一小群／`underline` 畫一行字，**同一時間只能有一個**
- 字型：內嵌 `FONT_CSS`，只用圓體與黑體，**禁止新細明體、細明體、標楷體**

**不要把投影片整頁貼上去當畫面。** 教案的 PPT 是內容來源，不是畫面來源——
低年級學生不讀畫面上的字，只看會動的東西。概念要用 CSS 畫的示意圖逐項進場，
程式截圖要配 `circle()` 圈出正在講的那塊，講「按左上角那個」就要有 `arrow()` 指過去。

**動手寫版面之前先跑 `node tools/preview-kit.mjs` 看過一輪**——效果名稱看字面猜不出差別。
完整用法與清單見 [`tools/README.md`](../../../tools/README.md#動畫與字卡模組)。

要新增效果就改 `tools/lib/fx.mjs` 的 `FX`，全部課程一起受惠；**不要在課程的版面碼裡自己寫一套**。

呼叫 `/hyperframes` skill（它是入口 router，會再路由到 `hyperframes-core`、`hyperframes-animation` 等）。組裝時：

- 專案位置固定在 `hyperframes-project/`，composition 寫成 **`hyperframes-project/index.html`**（`hyperframes render .` 的入口）。
  **全產線只有這一份**，每門課的 build 都整份覆寫它——所以兩門課不能同時組建或渲染，
  詳見 [`tools/README.md`](../../../tools/README.md#多門課共用一個包)
- 角色 webm 用 `assets/characters/<Character>/<action>/<action>_alpha.webm`，`data-track-index` 給角色一個固定軌（例如軌 1），文字/字幕另開軌（例如軌 2）
- 依講稿的「字幕分段」逐句加上字幕卡（本階段無配音，字幕即主要文字呈現方式，時長可用該段講稿字數估算，不要低於 2 秒/句）
- 依「畫面提示」加上對應的標題卡/示意圖/積木圖示動畫
- 遵循 `hyperframes-core` 的 data-* 時間屬性規則與 `motion-doctrine` 的運鏡連貫原則

### 背景音樂

每支教學影片都要有墊底的背景音樂。`media-use` 的 BGM 走 HeyGen catalog，需要先裝好 `heygen` CLI；沒有的話可以自己合成一段乾淨的循環（音樂盒／鐵琴音色最適合國小低年級）：正弦波疊 2、3 倍泛音搭配指數衰減包絡當旋律，低八度長音當鋪底，走 C–G–Am–F 這種明亮的和弦進行，做成 16 秒循環後用 `ffmpeg -stream_loop` 拉到全片長度，再加 `aecho` 混響與頭尾淡入淡出。

接進 composition 的方式：

```html
<audio id="bgm" class="clip" data-start="0" data-duration="<全片長>" data-track-index="8"
  src="assets/bgm.m4a" data-volume="0.16"></audio>
```

`data-volume` 是靜態基準音量，要做淡入淡出或閃避就在 timeline 上 tween `volume`（不要換 `data-volume`）。片頭若本身有聲音，記得在片頭期間把 BGM 壓到 0.05 左右，片頭結束再回到墊底音量，結尾淡出。

### 浮水印（每支影片必加，不可省略）

每個 composition 都要在右下角疊加 CodePro 標誌浮水印，`data-duration` 等於整支影片總長（從頭到尾常駐），素材位於 `assets/codepro_logo_white.webp`：

```html
<img
  id="codepro-watermark"
  class="clip"
  data-start="0"
  data-duration="<整支影片總秒數>"
  data-track-index="9"
  src="assets/codepro_logo_white.webp"
  style="position: absolute; right: 40px; bottom: 40px; width: 160px; height: 50px; opacity: 0.85; z-index: 999"
/>
```

- `data-track-index` 給浮水印固定用最高的軌號（例如 9），確保永遠疊在最上層、不被其他畫面元素蓋住
- 不需要動畫進場/離場，維持靜態常駐即可
- 尺寸與透明度可依畫面調整，但不可拿掉或改放其他位置
- **`width` 和 `height` 都要明確指定**（原圖比例約 2084:650，例如 160×50），只設 `width` 會讓 HyperFrames 版面計算錯誤、渲染成直向拉伸/旋轉的錯誤畫面（已實測驗證過這個坑）

## 步驟 4：渲染

```bash
cd hyperframes-project
npx hyperframes lint .                                  # 先看結構錯誤
npx hyperframes check . --at <各段中點> --timeout 20000  # 版面／對比／動態驗證
npx hyperframes snapshot . --at <各段中點> -o <暫存目錄> # 一定要親眼看過畫面再渲染
npx hyperframes render . -o ../lessons/<slug>/output/gradeN.mp4 --fps 30
```

`check` / `render` 吃的是專案目錄與 `index.html`，`--composition` 只接受檔案路徑（如 `compositions/x.html`），不是 composition id。lint 剩下的 `composition_file_too_large`、`timeline_track_too_dense`、`duplicate_media_discovery_risk` 屬提醒等級，不影響渲染。

**一定要親眼看過畫面才能渲染。** 只跑 lint / check 會漏掉一整類問題——它們在技術上合法，但畫面很醜。這次實際踩到的：

- 視覺元素全部擠在畫面上半部，教室綠板下半整片空著 → 視覺容器要垂直置中（`top` + 固定 `height` + `justify-content: center`），不要每段各給一個 `top`
- 積木、卡片、角色在 1920 畫布下都比想像中小，積木上的字完全看不清 → 積木統一放大約 1.45 倍，舞台裡的角色要 150px 以上
- 同一個舞台裡的兩個角色初始位置重疊，動畫結束回到原點後疊在一起 → 靜止狀態也要排得好看
- 卡片一排排太寬會撞到左右的對話框 → 四張以上改 2×2 排列

流程：`lint` → `snapshot` 看每段中點 → 修版面 → 再 `check` → 渲染。抓中點的方式是用講稿資料重算各段起訖，取 `start + dur/2`。

常見 lint 錯誤與修法：

- `gsap_exit_missing_hard_kill`：每個淡出 tween 之後補一個 `tl.set(sel, { autoAlpha: 0 }, <淡出結束時間>)`。
- `overlapping_clips_same_track`：時間累加務必先四捨五入到小數 2 位再輸出，否則 `toFixed(2)` 會讓前一個 clip 的結尾比下一個開頭大 0.01 秒。
- `font_family_without_font_face`：系統中文字型要補 `@font-face { font-family: "PingFang TC"; src: local("PingFang TC"); }`。
- `video_missing_muted`：片頭這類要保留聲音的影片加 `data-has-audio="true"`，靜音影片才加 `muted`。

## 步驟 5：後製（video-use，視情況）

目前尚未串接語音配音（TTS/ElevenLabs API key 留待未來設定），所以大多數課程影片只需要 HyperFrames 渲染即可交付。只有在以下情況才呼叫 `video-use`：

- 使用者提供真人錄製的口白/示範影片，需要剪輯、去除贅字、調色
- 已渲染的 HyperFrames 影片需要跟其他真實錄影片段合併剪接

`video-use` 的規則見其自身 SKILL.md（Ask → Confirm → Execute → Iterate → Persist，字幕一定放在濾鏡鏈最後套用）。最終輸出統一放回 `lessons/<slug>/output/`。

## 畫面音效

每個進場動畫配一顆音效，畫面才有「打到點」的感覺。音效可以用 Python 合成（正弦波 + 諧波 + 指數衰減包絡），不必找素材：

| 動畫 | 音效 | 長度 | 音量 |
|---|---|---|---|
| pop / flip（圖卡彈出） | 短促上行 blip | 0.16s | 0.30 |
| rise（積木滑入） | 低通噪音 swoosh | 0.34s | 0.22 |
| stamp（蓋章／答對） | 明亮雙音鈴 | 0.85s | 0.28 |
| countdown（每秒） | 木魚感短音 | 0.10s | 0.18 |
| float / twinkle | 三顆上行小星星 | 0.70s | 0.26 |
| qmark | 上揚疑問二音 | 0.45s | 0.30 |

倒數圈是每秒一聲滴答、數完補一聲鈴。

### 音效必須預混進背景音樂，不能逐顆掛 audio

**composition 的元素數量有上限。** 實測：語音 260 句已經逼近極限，再多掛一個長音訊元素（不管檔案多小）頁面就會超過 puppeteer 的導覽逾時。所以：

- 音效**不要**逐顆掛 `<audio class="clip">`（上百顆必定爆）
- 也**不要**單獨開一條音效軌（多一個長音訊元素就爆）
- 正解：`build-composition.mjs` 只輸出 `sfx-cues.json`（觸發時間 + 音量），再由 `mk-audio-bed.py` 把音樂與所有音效離線混成單一 `assets/bgm.m4a`。純音樂保留在 `assets/bgm-music.m4a` 當混音來源。
- 混音時音效增益要除以 composition 給 `#bgm` 的音量（0.68），播出來才是設計音量。
- 混完檢查峰值，超過 0.98 就整軌等比衰減，不要硬切（會爆音）。

如果元素數量真的下不來，加大逾時：

```bash
PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS=180000 PRODUCER_PLAYER_READY_TIMEOUT_MS=180000 \
  npx hyperframes render . --browser-timeout 180 -o out.mp4
```

`snapshot` 沒有 `--browser-timeout` 參數，只能靠環境變數（它的 `--timeout` 是 runtime 初始化，管不到導覽）。

## 章節段落感

每一個章節開頭都要有一張**大圖卡滑進畫面 + 語音唸出章名**，讓學生知道「換單元了」。沒有這個，17 分鐘的影片會糊成一片。

作法：在 `script-data.mjs` 每一部分的第一段前面插一段獨立的章節卡：

```js
{ id: 'c4', title: '章節卡：寫老鼠的程式', part: '第四部分：偵測滑鼠與老鼠的程式',
  vis: 'chapter', chapter: true, chapNo: '4', chapTitle: '寫老鼠的程式', lines: [
  { who: 'Cooper', action: 'talking', text: '第四章，寫老鼠的程式。' },
]},
```

`chapter: true` 的段落要**不出角色、不出對話框**，只有大圖卡與旁白；背景換成鮮明的斜紋漸層，跟教室黑板明顯區隔。動畫是從左滑入、停住、再從右滑出：

```js
tl.fromTo('#<id>-card', { x: -1500 }, { x: 0, duration: 0.9, ease: 'power3.out' }, S);
tl.to('#<id>-card', { x: 1500, duration: 0.7, ease: 'power3.in' }, S + E - 0.8);
```

章名要用小朋友聽得懂的講法（「寫老鼠的程式」），不要照抄內部的分部名稱（「第四部分：偵測滑鼠與老鼠的程式」）。

## 講到工具介面，一定要用教案裡的真實截圖

**不要自己畫介面示意圖。** 學生是照著影片操作的，自繪的示意圖跟他螢幕上的畫面對不起來就會卡住。教案 PPT 裡通常已經有：

- Scratch 舞台與控制列（綠旗／暫停／停止）
- 角色與背景的選擇卡
- 單塊積木的實際截圖

先把 pptx 解壓（`unzip` 後看 `ppt/media/`），挑出介面截圖存進 `assets/code/ui_*.png`，用 `shot()` 以指定高度放置，寬度由原始比例換算。

兩個處理要點：

- **截圖多半是黑底**（PPT 去背殘留），要把純黑挖成透明再存，否則貼在白卡上會出現黑框。
- **只框得到 5% 的小東西就先裁再放大**。例如綠旗在整張舞台截圖裡只佔 3%，紅框框上去根本看不見；把控制列裁出來成獨立素材。
- **裁完不要預先放大存檔**。把 230×60 的區域存成 920×240 只會得到一張糊掉的圖；維持原生解析度存檔，在版面上最多放大到 2 倍，超過就會看出馬賽克。
- **整張編輯器截圖不能當一張圖用**。1920 畫布上的示範卡最多約 1000px 寬，整個 Scratch 編輯器塞進去後，程式區只剩約 350px、積木字高只剩約 10px，完全不能讀。**每一張都要先裁到該步驟真正要看的區域**（積木清單／程式區／舞台／跳出的小視窗／右下角按鈕），裁完長寬比會每張都不同，所以卡片要固定大小、圖片用 `background-size: contain` 置中，不要 `cover`（會把重點裁掉）。裁切後紅框多半就不需要了——裁切本身就是最強的重點提示。
- **低解析度的程式截圖救不回來，要拆**。2A4 的加速程式原圖只有 217px 寬，整張放到滿版字還是糊的。正解是拆成兩張高解析原圖並排（出發五塊＋加速迴圈）；課程尾聲的總覽同理，用三段並排取代把整支程式縮成一條。
- **積木截圖不要套白卡**。積木本身有形狀和顏色，白底卡只會多出一圈礙眼的白框。只有淺色底的截圖（例如淺藍底的控制列）放在深色背景上時才需要白卡。

### 教案沒有的步驟圖，開瀏覽器實機拍

教案只有靜態結果圖，「怎麼一步一步做出來」要自己到 CodeBrainy
（`https://exam.codepro123.online/playground/practice/`）操作並逐步截圖。

**這一段可以由 Agent 用 `mcp__chrome-devtools__*` 直接邊做邊拍**，不需要人工手動截圖：
`evaluate_script` 用 `ScratchBlocks` API 疊積木（Blockly 吃不到合成滑鼠事件，不要用拖曳），
`take_screenshot` 帶 `filePath` 寫出原始解析度 PNG，再交給 `crop-step.py` 裁成 1620×911。

`mcp__Claude_Browser__*` 只能拿來看，它的截圖是回傳給模型的縮圖、不落檔，拍不出可用的素材。

帳號密碼**一律由使用者自己輸入**，Agent 不代打；請使用者先登入好再接手。
完整流程、16:9 的取得方式與三個必問的規格見
[`references/agent-orchestration.md`](references/agent-orchestration.md)（Agent A）。

## 紅框與箭頭

講到哪一塊就框哪一塊，這是教學影片最有效的引導手段。

```js
const hl = ([x, y, w, h], at, until, arrow = null) => { ... }
```

- 座標是**相對於容器的百分比**，容器要 `position: relative`
- `at` / `until` 是相對段落起點的秒數，跟講到那一句的時間對齊
- 紅框樣式：`border: 7px solid #FF2D20` + 外圈半透明光暈 + 內圈白線（在橘色積木和綠色黑板上都看得見）
- 箭頭的定位 `transform` 要放在**外層 wrapper**，內層才不會跟 GSAP 的 transform 打架（否則 lint 報 `gsap_css_transform_conflict`）；箭頭本身只做 `autoAlpha` 進出，不要 tween scale
- **箭頭尖端一定要指向被框起來的東西**。CSS 三角形容易做反：`border-right: solid` 產生的三角形是**朝左**、`border-left: solid` 才是**朝右**。擺在目標左側的箭頭要用 `border-left`，右側的用 `scaleX(-1)` 翻轉。做完務必抽一格畫面放大確認，這個方向錯了在縮圖上看不出來

### 紅框綁在台詞內容上，不要綁索引

**這是會反覆咬人的坑。** 紅框的時間點若寫成 `L[3].rel`，只要之後在那一段中間插一句話（例如補一句互動提問），後面每個紅框都會對錯句子——講「這裡的二十」時框到 `touching`。實測踩過一次。

```js
// 依台詞內容找句子，插句子、搬句子都不會錯位
const say = (L, kw) => {
  const ln = L.find((l) => l.text.includes(kw));
  if (!ln) throw new Error(`紅框對不到台詞：「${kw}」`);   // 找不到要當場爆掉，不要靜默略過
  return ln;
};

hl([60, 31, 18, 12], say(L, '這裡的二十').rel + 0.3, say(L, '碰到貓咪').rel, 'right')
```

關鍵字挑台詞裡獨一無二的片段就好。找不到就丟例外，讓 build 直接失敗——比渲染 20 分鐘後才發現框錯行便宜太多。

### 對位方法

用 PIL 把截圖疊上網格輸出成圖片，直接讀百分比（列與列的差距只有 3~4%，網格要畫到 4% 才夠細）；改完再把紅框畫上去輸出一張確認圖。這個迴圈比渲染影片快得多，不要用渲染來對位。

對完位還要**抽出成品的每一個紅框畫面放大檢查**——框偏一列在縮圖上看不出來，放大才看得到框住的是上一行。

程式截圖記得**先裁到內容邊界**（`Image.getbbox()`），否則透明邊會讓百分比座標全部失準，卡片上也會留一圈空白。

## 開課前先播專題成品

**動手做之前，要先讓學生看到「做完長什麼樣子」。** 沒有這一段，學生做到一半不知道自己在做什麼。

教案 pptx 裡通常附了成品錄影，解壓後在 `ppt/media/` 找 `media*.mp4` / `*.mov`。抽出來轉成 h264 mp4 放進 `assets/`，安排在第一部分結尾、進入正式教學之前，搭配「你看，貓咪一直追著老鼠跑」這類旁白指出重點。

注意 `ppt/media/` 裡也常有卡通、電影片段之類的版權素材（例如整段湯姆貓與傑利鼠），那些不要放進成品。

成品影片是 `<video class="clip">`，沒有音軌就要加 `muted`（否則 lint 報 `video_missing_muted`）。

## 講程式的地方，畫面就要出現程式

這是整份 skill 最重要的一條：**只要在講程式，畫面上就要出現真的積木或真的程式截圖，不要用中文字描述。**

最容易犯的是複習題：

```
✗  讓角色 ＿＿ 到滑鼠游標     ← 純中文填空，學生對不回 Scratch 畫面
✓  放出整段程式截圖 → 問「這是誰的程式？在做什麼？」→ 逐段用紅框解答
```

總結卡也一樣：「如果／迴圈／變數」三張卡不要放自己畫的圖示，直接放 `control_if`、`control_forever`、`data_setvariableto` 三塊積木，學生看到的就是他等下要在 Scratch 裡找的東西。

### 複習題的正確形式：一次一塊積木 → 猜用途 → 說出答案

複習不是挖空考單字，也不是丟一整段程式讓學生讀。**一次放大顯示一塊教過的積木，問「這個程式是用來做什麼的呢？」，停頓讓學生想，再由配角說出用途，Cooper 確認並完整覆述一次。**

```
畫面：  ？
        [ turn ↻ (15) degrees ]      ← 放大到 190px 高，不加白卡
        (5)                          ← 倒數圈，配 hold: 5

Cooper：最後一個，這塊你認得嗎？
Cora：  是讓角色轉圈圈的！
Cooper：對，沒錯！這個程式是用來讓角色向右旋轉十五度的。
        → 同時蓋出答案卡「讓角色向右旋轉十五度 ✓」
```

一塊積木一個段落，教過幾塊就複習幾塊（4 塊左右剛好）。答案卡的文字寫在講稿資料裡，畫面與旁白共用同一份事實：

```js
{ id: 's32c', vis: 'reviewQ', teach: true, quiz: true,
  blockKey: 'turn15', answer: '讓角色向右旋轉十五度',
  qLine: 0, aLine: 2, lines: [ ... ] },
```

`qLine` / `aLine` **要明確寫出哪一句在提問、哪一句公布答案**，不要用 `L.length - 2` 這類位置推算——只要某一段多加或少加一句話，倒數圈和答案卡就會對錯時間點。

## 動畫要符合直覺

示意動畫要動「該動的東西」。例如用操場跑步解釋迴圈時，**應該是跑者繞著跑道跑，不是整個跑道在轉**——後者做起來比較省事（旋轉一個元素就好），但學生看了會困惑。

如果軌跡是圓形的，容器就要是正圓（`border-radius: 50%` 且長寬相等），旋轉外層 wrapper 帶著跑者走，軌跡才會貼合跑道線。橢圓跑道配旋轉會讓跑者跑到跑道外面。

## 版面對齊統一背景

用統一教學背景時，**要先讀背景圖的實際幾何，把內容容器對齊可用區的中心**，不要憑感覺放。`classroom-board.svg` 的綠板內緣是 `y 196~904`，中心在 550，所以：

```css
.vis { position: absolute; left: 50%; top: 230px; height: 640px; transform: translateX(-50%); }
```

一開始放在 `top:150px; height:600px`（中心 450）整片內容就會偏上 100px，視覺上「浮在黑板上方」。

## Scratch 積木尺寸

**積木 SVG 的長寬比彼此差很多**（實測 0.29~0.71：`sensing_mousedown` 是 158×46、`control_if` 是 166×118），所以絕對不能套一個固定比例算高度——那會同時造成「被壓扁」和「大小不一」兩個問題。

正解是從 SVG 的 `viewBox` 讀原始尺寸，全部乘同一個放大倍率，積木上的字級才會一致：

```js
const BLOCK_UNIT = 2.15;
const viewBox = (p) => readFileSync(...).match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
const block = (path, scale = 1) => { const [w0, h0] = viewBox(path); /* w0*UNIT*scale × h0*UNIT*scale */ };
```

`scale` 只在版面真的塞不下時才調小（例如選項卡內、積木堆疊區），不要拿來當「這塊比較重要所以放大」用。

**積木素材要用英文版。** 中文版積木跟學生螢幕上的 Scratch（多半是英文介面）對不起來。素材換成英文版後 viewBox 會變（英文字比較長），但只要尺寸是從 viewBox 換算的就會自動適應，不用改任何座標。

## 何時改用 Remotion

**這個專案包只帶 HyperFrames，沒有 Remotion 專案。** 對話框、問號、星星等裝飾一律用
CSS/GSAP 在 composition 裡實作——那些東西不值得為它另外開一條 React 產線。

只有「同一套 React 元件要在網站與多支影片之間共用」時才值得補一個 Remotion 專案，
補了之後把輸出的透明背景 webm 放進 `hyperframes-project/assets/` 給 composition 取用。

## 角色配音（voai TTS）

中文配音走 **voai**（<https://connect.voai.ai/doc-vocal/index.html>），API key 放在專案根目錄 `.env` 的 `voaiAPI`，**絕對不要寫進任何輸出檔或印出來**。

### 三位角色的固定配音設定

| 角色 | 語者 | 年齡／聲線 | 模型版本 |
|---|---|---|---|
| Cooper（老師） | 子睿 | 5 歲男聲・演繹聲線 | Classic |
| Max（學生） | 軒軒 | 8 歲男聲・真實聲線 | Neo |
| Cora（學生） | 泡泡 | 7 歲女聲・真實聲線 | Neo |

style 一律「預設」，speed／pitch_shift／style_weight／breath_pause 全部用預設值。**語者只存在於特定模型版本，不能混用**——先呼叫 `GET /TTS/GetSpeaker` 確認語者在哪個 `models[].info.version` 底下，用錯版本會直接失敗。

### 字幕文字與語音文字必須分開

**這是最容易被忽略、但影響最大的一點。** TTS 會把標點當成停頓指令唸：`「」` 會讓句子中間硬停一拍，句尾的 `。` 會拖出一段長尾音，`……` 和 `——` 也各自造成不必要的斷點。但這些標點對「字幕好不好讀」是必要的。

所以 `script-data.mjs` 裡的 `text` 只負責字幕，送進 TTS 前一律先過 `speechText()`：

```js
export const speechText = (t) => t
  .replace(/[「」『』（）《》〈〉]/g, '')   // 引號會讓 TTS 在中間硬停一拍
  .replace(/＿+/g, '什麼')                  // 填空底線唸不出來，改成疑問詞
  .replace(/[—–]+/g, '，')                  // 破折號改成短停頓
  .replace(/[…⋯]+/g, '，')                  // 刪節號同上
  .replace(/，{2,}/g, '，')
  .replace(/[。，、]+$/, '')                 // 句尾句號會拖出一段長尾音
  .trim();
```

句尾的 `！`／`？` **要保留**，它們帶語氣、不是停頓。

### 語音檔名用內容雜湊，不要用句序

```js
export const voiceId = (t) => createHash('sha1').update(speechText(t)).digest('hex').slice(0, 10);
```

用 `<段落id>_<句序>.wav` 當檔名有個很貴的坑：在講稿中間插一句話，後面每一句的句序都會位移，快取全部失效、整批重跑一次 TTS 配額。用內容雜湊當檔名後，插入／搬移句子完全不影響快取，只有真的改字才會重新合成；重複出現的同一句話還會自動共用同一個音檔。

判斷是否需要合成就只剩「檔案存在且非空」，不必另外維護 manifest。

### 產生流程

`lessons/<slug>/scripts/gen-voice.mjs <角色> [--dry]` 會讀 `script-data.mjs`、逐句打 `POST /TTS/Speech`，輸出 `assets/voice/<角色>/<雜湊>.wav`，並寫出 `voice-durations-<角色>.json`。重點：

- **動手合成前先跑 `--dry`**，印出這次會花多少字，再對照 `GET /Key/Usage`。
- `GET /Key/Usage` 要用 `x-api-key` 標頭（`Authorization: Bearer` 會回 401）；回傳的 `current` 是**剩餘額度**，不是已用量（`total` 才是總額）。看反了會誤判成配額快用完。
- 併發 4 條、失敗重試 3 次即可，不要打太兇。
- **三個角色一定要串行跑，不要用 shell `&` 同時開**。它們的寫入目標確實不衝突，但每個進程內部就併發 4 條，三個一起＝ 12 條打向 voai。2A4 實測 311 句掉了 52 句，而且**完全沒有印出失敗訊息**——重試一次都沒觸發，是進程直接崩在後面的轉檔迴圈。
- **轉 m4a 前一定要擋缺檔**（`existsSync(wav) && size >= 1024`），缺的收集起來最後報出來並 `process.exitCode = 1`。少了這道保護，只要一句沒拿到音檔，`ffmpeg` 就會炸掉整支腳本，`voice-durations-<角色>.json` 整個寫不出來，前面幾百句的配額形同白花。內容雜湊當檔名，補跑只會重打缺的那幾句。
- `new URL(...).pathname` 在含中文／空白的路徑會有 percent-encoding，餵給 `ffprobe` 會找不到檔案——一律用 `fileURLToPath()`。
- **合成完要轉一份 m4a**（`-c:a aac -b:a 96k`）給 composition 用，wav 只留著當快取來源。原因見下面「composition 的元素數量上限」。

### 接進時間軸

有配音時，**直接用語音長度排時間，不要再跟字數估算取較大值**——取較大值會在每句話講完後留下一段死寂，對話聽起來一句一句斷掉。

```js
const VOICE_PAD = 0.05;  // 語音檔尾端安全邊界
const GAP = 0.2;         // 換人接話的間隔
const d = vd ? r2(vd + VOICE_PAD) : durOf(ln.text);
```

A 講完約 0.25 秒 B 就接上，這是自然對話的節奏。需要學生思考的地方改用 `hold` 明確指定停頓秒數，不要靠「每句都拖長一點」來製造停頓——那會讓整支影片都黏黏的。

字幕氣泡的淡出要**完全留在該句自己的時間窗內**（`b.at + b.dur - 0.2` 開始淡、`- 0.02` 硬關），間隔縮到 0.2 秒後，尾巴一跨過下一句起點，lint 就會報 `gsap_exit_missing_hard_kill`。

## 完成度檢查表

渲染一次要 15~20 分鐘，渲染前逐項確認，任何一項沒過就不要開始：

- [ ] `npx hyperframes lint .` 零錯誤
- [ ] 每一章開頭有大圖卡 + 語音唸出章名
- [ ] 動手做之前有播專題成品影片
- [ ] 講到工具介面用的是教案原始截圖，不是自繪示意圖
- [ ] 講到程式的畫面都有真實積木或程式截圖，沒有用中文字代替
- [ ] 複習題是「一塊積木 → 猜用途 → 說出答案」，不是中文填空也不是丟整段程式
- [ ] 每個要學生對焦的地方有紅框，箭頭尖端指向目標
- [ ] 紅框綁的是台詞內容（`say(L, '關鍵字')`）而不是索引；每個框都放大確認過框對行
- [ ] 積木素材是英文版，尺寸從 viewBox 換算、全片一致
- [ ] **積木上的變數名是課程用的名字**（不是 `my variable` / `score`）
- [ ] **操作截圖已裁到該步驟的重點區域**，不是整張編輯器縮小塞進卡片
- [ ] **教案提到的角色／背景在學生系統裡確實找得到**（名稱也要一致）
- [ ] 配音句數 ＝ 講稿句數（`voice-durations-*.json` 的鍵數對得上，沒有靜默掉句）
- [ ] 每個觀念都有一句直接問螢幕前學生的話，配 `hold` 停頓
- [ ] 抽 6~8 格 `snapshot` 確認沒有空白畫面（元素進場太晚／退場太早）
- [ ] 片長 ≥ 15 分鐘，且是靠內容而不是拉長留白撐出來的

渲染後：

- [ ] `ffprobe` 確認時長與 `data-duration` 一致
- [ ] 抽格確認章節卡、紅框、截圖、積木都正確
- [ ] `astats` 確認全片峰值 ≤ 0 dBFS
- [ ] 人聲平均 -15~-19 dB、思考停頓（只有音樂）-30 dB 上下，兩者相差 12 dB 以上

## 這條產線的腳本

腳本分成兩層：**共用的放 `tools/`，課程專屬的留在 `lessons/<slug>/scripts/`**。
共用的那層再依用途分三格——`tools/analyze/`（分析教案）、`tools/produce/`（產製）、
`tools/qc/`（品管閘門），細節見 [`tools/README.md`](../../../tools/README.md)。
共用腳本一律**從課程的 `scripts/` 目錄執行**（`node ../../../tools/<層>/xxx.mjs`），
課程脈絡全部由 cwd 推導——`course.mjs` / `course.py` 會讀該目錄下的 `course.json` 與 `script-data.mjs`。

課程專屬（每門課一份）：

| 檔案 | 做什麼 |
|---|---|
| `script-data.mjs` | 單一事實來源：段落、台詞、動作、停頓、章節；另含 `speechText()` 與 `voiceId()` |
| `build-composition.mjs` | 讀講稿產生 `index.html`，同時輸出 `sfx-cues.json`；版面組件都在這 |
| `course.json` | 這門課的路徑與參數：`voiceDir`、`bgm`、`bgmMusic`、`stepsDir`、`capture`、`checkIns` |
| `crop-regions.py` | 每張操作截圖要裁哪一塊（區域對照表是逐課設計的） |

共用（`tools/`，改一次所有課程都受惠）：

| 檔案 | 做什麼 |
|---|---|
| `lib/course.mjs` `lib/course.py` | 由 cwd 解析課程脈絡，載入 `course.json` 與 `script-data.mjs` |
| `analyze/prep-course.mjs` | 丟一份 pptx 進來，抽出逐頁摘要＋建好課程骨架（`--summary-only` 只讀不寫） |
| `run-pipeline.mjs` | 把配音→組建→音樂床→檢查→渲染→抽驗串成一條，順序寫死不會跑錯 |
| `produce/gen-voice.mjs` | voai TTS 批次合成（內容雜湊快取、`--dry` 估算配額、缺檔保護、順便轉 m4a） |
| `produce/mk-audio-bed.py` | 把音樂與音效預混成單一音樂床 |
| `produce/gen-script-md.mjs` | 產生人類可讀的講稿 markdown（含配音唸法與實際秒數） |
| `qc/check-questions.py` | 找出有停頓卻沒收尾的提問 |
| `qc/check-frames.mjs` | 抽出每個紅框那一格供檢查 |
| `produce/crop-step.py` | 把整頁截圖裁成編輯器的 16:9 畫面 |
| `produce/measure-code.py` `produce/crop-code.py` | 量紅框座標／從整頁截圖裁出單段程式碼 |
| `produce/mk-click-sfx.py` | 產生滑鼠點擊音效 |

> **新增一門課**：複製一份 `course.json` 改路徑，寫自己的 `script-data.mjs` 與 `build-composition.mjs`，
> 其餘直接用 `tools/` 的。不要再整包複製腳本——2A4 就是因為複製了一份，
> 修好的 bug 沒有回流到 2A5。範例課在 `lessons/_reference-2A5/scripts/`。

改完講稿的執行順序：

全部在 `lessons/<slug>/scripts/` 底下執行（共用腳本靠 cwd 找到這門課）：

```bash
node ../../../tools/produce/gen-voice.mjs Cooper --dry               # 先估配額
for w in Cooper Max Cora; do node ../../../tools/produce/gen-voice.mjs $w; done   # 一定要串行
node build-composition.mjs ../../../hyperframes-project/index.html
python3 ../../../tools/produce/mk-audio-bed.py
node ../../../tools/produce/gen-script-md.mjs grade1-3.md
python3 ../../../tools/qc/check-questions.py
cd ../../../hyperframes-project && PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS=180000 \
  npx hyperframes render . --browser-timeout 180 -o ../lessons/<slug>/output/gradeN.mp4
```
