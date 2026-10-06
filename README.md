# 教學影片產線

丟一份教案 pptx 進來，產出國小 1~6 年級的教學動畫影片（1920×1080 MP4，含三位角色配音、字幕、程式碼紅框標示與音效）。

```text
教案 pptx  →  逐頁摘要  →  講稿  →  ★閘門  →  配音＋素材  →  組建  →  ★閘門  →  渲染  →  ★抽驗  →  MP4
```

## 先確認環境

```bash
node -v          # 需 22 以上（腳本用到內建 WebSocket 與 globSync）
python3 -c "import PIL; print(PIL.__version__)"   # 裁圖與量座標要 Pillow
ffmpeg -version  # 音訊轉檔與抽格
```

```bash
python3 -m pip install -r requirements.txt   # Pillow、numpy（裁圖、去背、合成背景音樂）
npx --yes hyperframes --version               # 渲染引擎，第一次會自動下載
```

`.env` 放配音服務的金鑰（照 `.env.example` 建一份，**不要進版控，`.env.example` 的值一律留空**）：

```bash
cp .env.example .env    # 預設填 voaiAPI；備案 Gemini 填 GEMINI_API_KEY 與三個 VOICE_*
```

字型：畫面用圓體／黑體（macOS 內建 `Yuanti TC`、`PingFang TC`；Windows 會落到 `Microsoft JhengHei`），**不要改成明體或楷體**。

## 做一堂課

```bash
# ① 先看看這份教案在教什麼（不會動到任何東西）
node tools/analyze/prep-course.mjs ~/Downloads/2A6.pptx --summary-only

# ② 正式開課：建骨架、抽素材、產生逐頁摘要
node tools/analyze/prep-course.mjs ~/Downloads/2A6.pptx

# ③ 讀 lessons/2A6/scripts/教案摘要.md，寫講稿與版面
#    照著 lessons/_reference-2A1/scripts/ 那份改，不要從零寫（現行標準；2A4／2A5 是更早的做法）
#    這一步是設計，交給人或 Claude 判斷——腳本生不出來

# ④ 一路跑到 MP4
cd lessons/2A6/scripts
node ../../../tools/run-pipeline.mjs --dry     # 先估 TTS 配額
node ../../../tools/run-pipeline.mjs           # 確認後全跑（約 20 分鐘）
```

或直接跟 Claude 說：**「幫我把 ~/Downloads/2A6.pptx 做成三年級的教學影片」**——
`.claude/skills/teaching-video-pipeline/` 就是給它看的規則書，含年級難度分級、
角色動作對照表、節奏的四拍法則與兩個閘門的判定標準。

## 這個包裡有什麼

```text
tools/                 腳本，依用途分三層（每層都能單獨用，見 tools/README.md）
├── analyze/           教案分析：pptx → 逐頁摘要 + 課程骨架
├── produce/           產製：配音（voai／Gemini）、背景音樂合成、音樂床、錄影變速、裁圖、量紅框座標
├── qc/                品管閘門：提問複查、紅框抽格、成品抽驗
├── lib/               課程脈絡解析 ＋ 動畫／字卡／視線引導模組（fx.mjs、cards.mjs、pointers.mjs）
│                      ＋ sketch.mjs（手繪教室風：版面常數、字幕對話框、等待鬧鐘、收斂過的字卡）
├── preview-kit.mjs    產生動畫與字卡總覽網頁，寫版面前先看過
└── run-pipeline.mjs   編排：把三層串成一條線

.claude/skills/teaching-video-pipeline/   給 Claude 看的產線規則書
├── SKILL.md                      主規則：年級分級、角色、版面、配音
└── references/
    ├── teaching-rhythm.md        寫講稿前必讀：段落切分、提問四拍法則、哪些問題才停頓
    ├── visual-style.md           組畫面前必讀：三層版面、手繪風格、字卡收斂、等待鬧鐘、背景音樂
    └── agent-orchestration.md    開工前必讀：哪些開 Agent、閘門怎麼判

hyperframes-project/   動畫渲染專案（index.html 由各課的 build-composition.mjs 產生）
└── assets/            共用素材
    ├── characters/          Cooper／Cora／Max 共 16 組動作（v3_Anchored，已修掉 Cora 跳動）
    │                        每組含 keyframes + timing.json + alpha webm
    ├── scratch-blocks/      Scratch 積木 SVG（124 個，依分類）
    ├── scratch角色素材/      Scratch 官方角色（338 個，每個一個資料夾裝造型）
    ├── scratch背景素材/      Scratch 官方背景（86 張）
    ├── sfx/                 音效（pop／ding／swoosh／tick／magic／question／click）
    └── opening.mp4          片頭 10 秒（1920x1080 / 30fps / 含原音，intro-project 的成品）

intro-project/         片頭動畫的獨立 hyperframes 專案，要改片頭或剪短就在這裡重渲染

lessons/
├── _reference-2A1/    ★ 現行標準：會走路的雪人（約 25 分鐘，手繪教室風），新課照著改
├── _reference-2A5/    舊範例：貓抓老鼠（23分57秒），版面是更早的做法
├── _reference-2A4/    ★ 踩坑範例：CodeBrainy 實拍、變數名積木、低解析素材
└── <slug>/            每門課一個資料夾

PIPELINE.md            完整流程、指令、閘門、平行策略、踩過的坑
```

## 素材補充

為了讓這個包保持精簡，只帶了每支影片都會用到的東西（約 17MB）。以下要用時自行補：

| 缺什麼 | 怎麼補 |
|---|---|
| 背景音樂 | **不用自己找**：`run-pipeline` 缺音樂或音樂比片短時，會用 `tools/produce/mk-bgm.py` 自動合成輕快版（純合成，無版權問題） |
| Scratch 官方角色／背景素材庫 | 從 Scratch 編輯器匯出，或用教案原始截圖（更精準——教案用的角色學生系統裡不一定還有） |
| 操作截圖 | 開拍前先在學生實際用的系統裡走一次，用 `tools/produce/crop-step.py` 裁成 16:9 |

## 最重要的一句話

**所有東西都從 `lessons/<slug>/scripts/script-data.mjs` 長出來。**
它是講稿、畫面指定、停頓秒數的單一事實來源。改它就重跑產線，不要手動去改十個地方。

```js
{ who: 'Cooper', action: 'thinking', text: '不按滑鼠時老鼠在哪裡？', hold: 4 }
//  ↑ 哪個角色動畫    ↑ 什麼表情動作        ↑ 字幕內容            ↑ 講完停幾秒
```
