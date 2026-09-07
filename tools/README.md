# tools／腳本層

腳本依**用途**分三格，每一格都能單獨拿出來用，不必跑整條產線：

| 目錄 | 什麼時候用 | 能不能單獨用 |
|---|---|---|
| [`analyze/`](#analyze教案分析) | 拿到一份教案，想先知道它在教什麼 | ✅ 完全獨立，只要有 pptx |
| [`produce/`](#produce產製) | 講稿定稿後，把聲音與素材做出來 | ⚠️ 要有課程資料夾（`course.json` + `script-data.mjs`） |
| [`qc/`](#qc品質管控) | 每一關卡住不讓爛東西往下走 | ⚠️ 同上，且各有前置產物 |
| [`lib/`](#lib) | 不直接執行，其他腳本靠它認出「現在在跑哪一門課」 | — |
| [`lib/fx.mjs` `lib/cards.mjs` `lib/pointers.mjs`](#動畫與字卡模組) | 寫版面時：套現成的動畫、字卡與視線引導，不要每支課重寫 | ✅ 純模組，`preview-kit.mjs` 可預覽 |
| [`run-pipeline.mjs`](#run-pipelinemjs編排) | 把上面三格串成一條線 | ✅ 一行跑完 |

**執行位置的鐵則：共用腳本一律 `cd lessons/<slug>/scripts/` 之後再執行。**
課程脈絡完全由 cwd 推導——`lib/course.mjs` 會讀當前目錄的 `course.json` 與 `script-data.mjs`。
在別的地方跑會找不到課，或更糟：讀到另一門課的設定。

---

## 動畫與字卡模組

`lib/fx.mjs`（動畫）、`lib/cards.mjs`（字卡與字型）、`lib/pointers.mjs`（視線引導）。
**寫 `build-composition.mjs` 時直接套，不要自己重寫一份。**

### 先看過長什麼樣子

```bash
node tools/preview-kit.mjs          # → ./kit-preview.html
```

用瀏覽器打開，可以拖時間軸逐格看每個效果。名稱看字面猜不出差別（`rise` 和 `drop`、`pop` 和 `bounce`），
寫講稿前先看一輪，才知道哪一句該配哪個。

### 接進 build-composition.mjs

```js
import { makeFx, makeFxOut, fxRuntimeJS } from '../../../tools/lib/fx.mjs';
import { makeCard, hi, CARD_CSS, FONT_CSS } from '../../../tools/lib/cards.mjs';
import { makePointers, POINTER_CSS } from '../../../tools/lib/pointers.mjs';

const fx = makeFx(hit);          // hit 是課程自己的音效登記函式
const fxOut = makeFxOut(hit);
const card = makeCard(fx, fxOut);
const { arrow, circle, underline } = makePointers(fx, fxOut);
```

三個地方要接：

1. **HTML**：`${card({ ... })}`、`${arrow({ ... })}`，或把 `${fx('slideL', 1.2)}` 貼到任何自訂元素的標籤上
2. **`<style>`**：內嵌 `${FONT_CSS}${CARD_CSS}${POINTER_CSS}`
3. **`<script>`**：在 `const tl = gsap.timeline(...)` 之後內嵌 `${fxRuntimeJS()}`

build 時 `fx()` 只吐 `data-fx` / `data-at` 兩個屬性並登記音效，真正的 GSAP 動畫是 runtime
掃 `[data-fx]` 統一套上去的。所以**加一個新效果只要在 `FX` 加一筆，不必動任何課程的版面碼**。

### 動畫效果

| 類別 | 名稱 |
|---|---|
| 基本進場 | `fadeIn` 淡入・`pop` 彈出・`zoomIn` 放大 |
| 方向進場 | `slideL` 左滑入・`slideR` 右滑入・`rise` 下方升起・`drop` 上方落下 |
| 有個性的 | `bounce` 彈跳落下・`stamp` 蓋章・`flip` 翻牌 |
| 進場後持續 | `float` 漂浮・`twinkle` 搖擺・`qmark` 問號跳・`shake` 警告晃・`pulse` 心跳強調 |
| SVG 線條 | `draw` 一筆畫出來（給 `pointers.mjs` 的圈選與底線用，元素要帶 `pathLength="1000"`）|
| 離場 | `fadeOut` 淡出・`slideOutL` 左滑出・`slideOutR` 右滑出・`popOut` 縮小消失 |
| 特殊 | `countdown`（5 秒）・`countdown4`（4 秒），元素裡要有 `.cdnum` |

**離場要用 `fxOut()`，而且必須搭配一個進場。** 元素預設是隱藏的（等進場動畫喚醒），
只掛離場等於對看不見的東西做淡出——畫面上什麼都不會發生。這兩件事寫錯會直接丟例外，
不會讓你渲染 18 分鐘之後才發現開天窗。

```js
// 左滑進來，停 4 秒後右滑出去
card({ text: '變數', size: 'xl', shape: 'text', fx: 'slideL', at: 2, out: 'slideOutR', outAt: 6 })
```

### 字卡

兩種形態：

| shape | 長相 | 什麼時候用 |
|---|---|---|
| `box`（預設） | 實心漸層底 + 白色粗框 + 厚投影 | 一句完整的說明 |
| `text` | 只有字，字身自帶白色描邊 | 疊在操作畫面上的短標、關鍵詞、狀聲詞——不會把底下的畫面遮掉一大塊 |

六種語意色（`tone` 決定「這句話是什麼性質」，不是挑好看的）：

| tone | 用途 |
|---|---|
| `orange` | 重點／主標 |
| `yellow` | 一般說明 |
| `red` | **警告／注意** |
| `green` | 正確／完成 |
| `blue` | 補充／提示 |
| `purple` | 想一想 |

四級尺寸 `sm` 34px／`md` 46px／`lg` 64px／`xl` 92px（1920 畫布下 `sm` 是最小可讀）。

```js
card({ text: '變數就是一個箱子', tone: 'orange', size: 'lg', fx: 'bounce', at: 1.2 })
card({ text: '小心！這裡最容易錯', tone: 'red', fx: 'shake', at: 3.0 })
card({ text: '按下綠旗', sub: '程式就會開始跑', tone: 'blue', fx: 'pop', at: 5 })
card({ text: '答對了！', tone: 'green', size: 'lg', shape: 'text', fx: 'stamp', at: 8 })
```

其他選項：`sub` 副標・`icon` 左側小圖（HTML 片段）・`id`・`style`（定位用）。

> 白框與白描邊都是為了讓字在任何背景上都跳出來——教學影片的底常常是彩色的 Scratch 舞台
> 或教室背景，沒有白邊會糊在一起。

### 字型與關鍵字

`FONT_CSS` 已經定好全片字型，內嵌就好，**不要自己寫 `font-family`**。
只用圓體與黑體（`Yuanti TC` → `PingFang TC` → `Noto Sans TC`），字重 800 以上。
**禁止新細明體、細明體、標楷體**——明體在 1080p 上會斷筆畫，楷體讀起來像公文。

句內關鍵字用 `hi()`，放大 22% ＋ 換色：

```js
card({ text: `為什麼你背了 ${hi('一百個單字')}，隔天就忘光？`, tone: 'red', size: 'lg', fx: 'shake', at: 0 })
card({ text: `程式要寫在 ${hi('貓咪', 'white')} 身上`, tone: 'orange', at: 3.2 })
```

顏色、倍率、字重都能調，第二個參數給色名、色碼或設定物件：

```js
hi('迴圈')                       // 預設：yellow，放大 22%
hi('迴圈', 'red')                // 表列色：yellow white red orange green navy
hi('迴圈', '#FF00AA')            // 任意色碼
hi('迴圈', { scale: 1.9 })       // 只調大小
hi('迴圈', { color: 'white', scale: 1.5, stroke: 4 })   // stroke = 白描邊 px，疊在複雜背景上才需要
```

整片想統一改預設值，改 `cards.mjs` 的 `HI_DEFAULT`（`{ color, scale, weight }`），不用每一句傳參數。

黃底卡片上只有 `navy` 讀得清楚。**一句只標一個詞**——標兩個以上等於沒標。

### 視線引導

學生的眼睛不會自己找到重點。畫面上一次有五樣東西時，純文字說明沒有用，
要有個動態的東西指過去。座標是 1920×1080 畫布上的絕對位置（px）。

```js
arrow({ x: 820, y: 430, dir: 'right', at: 3.2, out: 'fadeOut', outAt: 6 })  // 箭尖指到 x,y
circle({ x: 640, y: 380, w: 300, h: 160, at: 4.0 })                        // 圈住一小群東西
underline({ x: 500, y: 700, w: 420, at: 2.5 })                             // 強調一行字
```

| 用哪個 | 指什麼 |
|---|---|
| `arrow` | 單一小目標（一顆積木、一個按鈕）。`dir` = `right`／`left`／`up`／`down` |
| `circle` | 一小群東西（一整段程式、一組數字）。`w`／`h` 要比目標大一點 |
| `underline` | 一行字。`y` 放在基線下方 8~12px |

顏色 `tone`：`red`（預設）・`orange`・`yellow`・`green`・`blue`。
圈選與底線刻意畫得歪一點——正圓與直線看起來像 UI 元件，手繪感才像老師拿筆在螢幕上畫。

**畫面上同時只能有一個引導。** 兩個箭頭指兩個地方，等於沒有引導。

---

## analyze／教案分析

### `prep-course.mjs`

丟一份教案 pptx 進來，把「動手寫講稿之前」的機械工作一次做完。

```bash
# 快速分析：只想知道這份教案在教什麼，不建任何東西
node tools/analyze/prep-course.mjs ~/Downloads/2A6.pptx --summary-only
#   → ./2A6-教案摘要.md（逐頁文字 + 每張圖的尺寸與長寬比）
#   → 原檔不動、不建資料夾、不抽素材

# 正式開課：建好骨架
node tools/analyze/prep-course.mjs ~/Downloads/2A6.pptx
#   → lessons/2A6/{slides,scripts,output}/
#   → lessons/2A6/scripts/教案摘要.md、course.json、script-data.mjs（骨架）
#   → hyperframes-project/assets/2A6/raw/（教案裡所有圖片與影片）
```

`[slug]` 可帶第二個參數指定代號，省略時用檔名。只吃英數與 `-_`。

**它刻意不做的事**：寫講稿、設計版面。那兩件要看著教案判斷，不是腳本能生的。

> 尺寸資訊是拿來分辨用途的：寬高比很扁的多半是程式碼截圖，方正的多半是角色圖。

---

## produce／產製

執行順序是硬依賴，不能顛倒（理由見 [PIPELINE.md](../PIPELINE.md)）。

| 腳本 | 吃什麼 | 吐什麼 |
|---|---|---|
| `gen-voice.mjs <角色> [--dry]` | `script-data.mjs`、`.env` 的 `voaiAPI` | `<voiceDir>/<角色>/<雜湊>.{wav,m4a}`、`voice-durations-<角色>.json` |
| `gen-script-md.mjs <輸出.md>` | `script-data.mjs`、`voice-durations-*.json` | 人類可讀講稿（含每句實際秒數與配音唸法） |
| `mk-audio-bed.py` | `course.json` 的 `bgmMusic`、`sfx-cues.json` | `course.json` 的 `bgm`（音樂＋音效預混成一條） |
| `crop-step.py <整頁截圖> <檔名>` | 整頁操作截圖 | `<stepsDir>/<檔名>`（裁成編輯器的 16:9） |
| `crop-code.py <來源> <輸出> <x> <y> <w> <h>` | 整頁截圖 | 單段程式碼圖（四周留白 14px） |
| `measure-code.py <程式碼圖>...` | 程式碼圖 | 紅框的百分比座標（印在終端機，貼進 `build-composition.mjs`） |
| `mk-click-sfx.py` | — | `assets/sfx/click.wav` |

**三個角色的配音一定要串行**：

```bash
for w in Cooper Max Cora; do node ../../../tools/produce/gen-voice.mjs $w; done
```

平行跑會變成 12 條併發打 voai，**掉句是靜默的**——2A4 實測 311 句掉了 52 句，
一行失敗訊息都沒印。檔名是內容雜湊，補跑只會重打缺的那幾句，不會重複計費。

---

## qc／品質管控

三個閘門，**任何一關 FAIL 都不要往下跑**——後面的步驟吃前面的產物，硬跑只會做出對不上的影片。

### `check-questions.py` — 講稿閘門

找出「有停頓、但沒有收尾」的提問。Cooper 問一句、留了 `hold` 秒數給學生想，
下一句卻直接換話題——小孩會停在那裡不知道答案是什麼（實際踩過 7 次）。

```bash
node ../../../tools/produce/gen-script-md.mjs grade1-3.md   # 先產出可讀講稿
python3 ../../../tools/qc/check-questions.py                # 再複查
```

帶做時的確認語（「你也打開了嗎？」）不算問題，寫在 `course.json` 的 `checkIns`。
有問題會 `exit 1` 並列出是哪幾句。

### `check-frames.mjs` — 版面閘門（渲染前）

自動找出每個紅框的淡入時間，各截一格存到 `output/frame-check/`，逐張確認「框有沒有標到重點」。

```bash
node ../../../tools/qc/check-frames.mjs [輸出目錄]
```

**要在 render 之前跑。** 整支片有四萬多張影格，逐張看不切實際；只抽紅框那幾格，
2A5 這關就抓到 3 個真錯誤（指向空白處、沒指到目標、被對話框遮住）。改完重建即可，
不用重跑 18 分鐘的渲染。

> 前置：要先跑過 `build-composition.mjs`；chrome-headless-shell 由 hyperframes 首次 render 時下載。
> 時間軸 id 會自動從 `index.html` 讀回來，不同課程都適用。

### `verify-output.mjs` — 成品閘門（渲染後）

```bash
node ../../../tools/qc/verify-output.mjs ../output/grade1-3.mp4
```

| 檢查 | 判準 |
|---|---|
| 時長 vs `sfx-cues.json` 的 `total` | 差 ≤ 0.5 秒（超過代表時間軸與影片對不上） |
| 片長下限 | `course.json` 的 `minDuration`（秒）；設 `0` 關閉 |
| 全片峰值 | ≤ 0 dBFS（未破音） |
| 人聲平均 | −15 ~ −19 dB |
| 純音樂停頓 | 比人聲低 ≥ 12 dB |
| 抽 8 格 | 存到 `output/verify-frames/`，章節卡與紅框仍需人目視 |

---

## lib

`fx.mjs` / `cards.mjs` / `pointers.mjs` 見上方[動畫與字卡模組](#動畫與字卡模組)。

`course.mjs` / `course.py`。不直接執行，提供 `cfg`（讀 `course.json`）、
`here()`（課程 `scripts/`）、`proj()`（`hyperframes-project/`）、`loadScript()`（動態載入講稿）。

新增共用腳本時從這裡取路徑，不要自己拼相對路徑。

---

## 多門課共用一個包

每開一門課，`prep-course.mjs` 會建一組**只屬於這門課**的東西：

```text
lessons/2A1/{slides,scripts,output}/          講稿、版面碼、成品
hyperframes-project/assets/2A1/{raw,voice,steps,bgm*.m4a}   這門課的素材與語音
```

共用腳本沒有「目前課程」這種全域設定，全部**由 cwd 推導**（`lib/course.mjs` 的
`COURSE_DIR = process.cwd()`），所以一律在 `lessons/<slug>/scripts/` 底下執行。
換一門課就是換一個目錄跑，2A1 和 2A2 的講稿、語音、截圖、成品互不相干。

### ⚠️ 唯一共用且會互相覆寫的：`hyperframes-project/index.html`

它是 `hyperframes render .` 的入口，**全產線只有一份**。每門課的 `build-composition.mjs`
都是整份覆寫它。所以：

- ✅ **一門一門做**：完全沒問題
- ❌ **兩門同時做**：後建的會蓋掉先建的。最糟的情況是 2A1 正在渲染的那 20 分鐘裡
  對 2A2 跑 build——渲染**不會報錯**，只是產出的影片內容變成 2A2 的

因此 build 完會在 index.html 第一行蓋上 `<!-- course: <slug> -->`，
而 **lint、render、check-frames 三關都會先驗這個戳記**，對不上就中止：

```
Error: index.html 現在是「2A1」這門課的，不是「2A2」。
  同一個包裡兩門課不能同時組建／渲染——等 2A1 渲染完，或先跑 --from build 重建這門課。
```

要真的平行做兩門課，就複製兩份專案包，不要共用。

---

## run-pipeline.mjs／編排

講稿寫完之後，一路跑到 MP4 並驗收。順序寫死，不會跑錯。

```bash
cd lessons/<slug>/scripts
node ../../../tools/run-pipeline.mjs              # 全跑
node ../../../tools/run-pipeline.mjs --dry        # 只估 TTS 配額
node ../../../tools/run-pipeline.mjs --to lint    # 跑到檢查就停，渲染前先自己看畫面
node ../../../tools/run-pipeline.mjs --from build # 從某一步接著跑
```

階段：`voice → build → audio → lint → render → verify`。

配音跑完會**比對句數**：三個角色的 `voice-durations-*.json` 少任何一句就中止，
因為往下跑會做出「字幕對不上聲音」的影片。再跑一次只會補缺的那幾句。
