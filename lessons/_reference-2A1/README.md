# 參考範例：2A1 會走路的雪人（現行標準）

一支做完的課（約 25 分鐘，1~3 年級，Scratch 設定＋畫雪人＋迴圈）。**新課請以這份為準**，
2A4／2A5 是更早的做法（版面風格、停頓規則都還沒收斂），只留著對照。

**這門課不能直接跑**——教案 pptx、操作截圖、語音、音樂床都沒有一起帶進包裡，只留下講稿與版面的原始碼。
要看它長什麼樣，用自己的教案跑一次 `prep-course.mjs`，再照這份的結構寫自己的講稿與版面。

## 打開來看什麼

| 檔案 | 看什麼 |
|---|---|
| `scripts/script-data.mjs` | 講稿怎麼寫：開場時間表（痛點→成品→15 秒內學習目標）、哪些問題才有 `hold`、`tone`／`lead` 語氣、章節卡、`question`／`opts`／`correct` 練習題格式 |
| `scripts/build-composition.mjs` | 版面怎麼組：**三層版面**（標題帶／內容區／字幕帶）、`guides()` 引導序列、`cropPlace()` 截圖裁切、`titles()` 標題帶取代、`say()` 依台詞內容對位 |
| `scripts/prep-assets.py` | 教案原圖怎麼整理成素材：縮圖、積木去背、**遮蓋真實學生姓名**、雪人去背（封線條斷點）、旋轉積木切圖 |
| `scripts/course.json` | 一門課要設定哪些路徑與參數 |
| `scripts/grade1-3.md` | 產出的可讀講稿長什麼樣（含每句實際秒數與配音唸法） |

## 外觀不用自己寫

手繪外框、字幕對話框、等待鬧鐘、收斂過的字卡與動畫，都在 **`tools/lib/sketch.mjs`**，
`build-composition.mjs` 只要：

```js
import { LAYOUT, SKETCH_DEFS, sketchCss, makeSketchKit, clockHtml, clockTimelineJS, bubbleHtml, bubbleTimelineJS }
  from '../../../tools/lib/sketch.mjs';
const { fx, fxOut, card } = makeSketchKit(hit);
```

設計規則與理由見 [`.claude/skills/teaching-video-pipeline/references/visual-style.md`](../../.claude/skills/teaching-video-pipeline/references/visual-style.md)。

## 寫新課時

複製 `scripts/` 底下的 `build-composition.mjs`、`script-data.mjs`、`course.json` 過去改，
**不要複製 `tools/` 的共用腳本**（`mk-clips`、`mk-bgm`、`gen-voice` 等）——2A4 就是複製了一份，
結果修好的 bug 沒回流到 2A5。`prep-assets.py` 是這門課專屬的（圖片編號寫死），照著改成自己的。
