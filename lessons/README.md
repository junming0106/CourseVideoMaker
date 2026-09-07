# 課程資料夾

每一堂課一個資料夾，代號用英數短字（例如 `2A6`、`scratch-loop-intro`），不要用中文或空白。

## 開新一堂課

```bash
node tools/analyze/prep-course.mjs <教案.pptx> [slug]
```

會建好底下的結構並產出逐頁摘要。接著讀 `scripts/教案摘要.md` 寫講稿，
再 `cd lessons/<slug>/scripts && node ../../../tools/run-pipeline.mjs`。

## 結構

```text
lessons/<slug>/
├── slides/       原始教案 pptx（唯讀，不要改原檔）
├── scripts/
│   ├── 教案摘要.md            prep-course 抽出的逐頁內容
│   ├── course.json            這門課的路徑與參數
│   ├── script-data.mjs        ★ 講稿單一事實來源（人／AI 寫）
│   ├── build-composition.mjs  ★ 版面（從 _reference-2A5 那份改）
│   ├── grade1-3.md            由 script-data 產生的可讀講稿（勿手改）
│   ├── voice-durations-*.json 各角色語音長度（gen-voice 產生）
│   └── sfx-cues.json          音效時間點（build-composition 產生）
└── output/       渲染成品與抽驗影格
```

★ 這兩份是每門課要自己寫的，其餘都是腳本產生或共用的。

## 兩份參考範例

都只有原始碼、沒有素材，**不能直接跑**，是拿來對照的。

| | 看什麼 |
|---|---|
| `_reference-2A5/` | **結構最完整**（八章、九段實作示範、六段程式碼展示）。寫新課從它複製 `build-composition.mjs` |
| `_reference-2A4/` | **踩坑紀錄**：CodeBrainy 實機拍攝、帶變數名的積木、低解析度素材怎麼處理 |

產線文件裡「2A4 踩過⋯」「2A5 初版漏了⋯」的說法，都能翻回這兩份對照實際的程式碼。
