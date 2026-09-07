# 教學影片產線

教案 pptx → 國小 1~6 年級教學動畫影片。

## 開工前一定要讀

1. `.claude/skills/teaching-video-pipeline/SKILL.md` — 主規則（年級分級、角色、版面、配音）
2. `.claude/skills/teaching-video-pipeline/references/teaching-rhythm.md` — **寫講稿前**：段落切分、提問四拍法則
3. `.claude/skills/teaching-video-pipeline/references/agent-orchestration.md` — **開工前**：哪些開 Agent、閘門怎麼判
4. `.claude/skills/teaching-video-pipeline/references/codebrainy-capture.md` — **要實機截圖補素材時**：CodeBrainy 練習場操作 runbook
5. `PIPELINE.md` — 執行時：各階段指令與踩過的坑
6. `tools/README.md` — 每支腳本能不能單獨用、吃什麼吐什麼

## 不能違反的三件事

**① 講稿沒給使用者確認過，不要開始組動畫。**
組完才發現方向錯要整支重來，配音的錢也白花。

**② 執行順序是硬依賴，不能顛倒。**

```text
改台詞 → gen-voice → build-composition → mk-audio-bed → lint → render
```

- `gen-voice` 必須早於 `build`：build 要讀實際語音長度排時間軸，顛倒會退回字數估算，字幕跟聲音對不上
- `mk-audio-bed` 必須晚於 `build`：它讀的是 build 產生的 `sfx-cues.json`

用 `tools/run-pipeline.mjs` 跑就不會錯，順序寫死在裡面。

**③ 三個角色的配音要串行，不要平行。**
每支 `gen-voice.mjs` 內部已經併發 4 條，三個一起就是 12 條打向 voai。
**掉句是靜默的**——2A4 實測 311 句掉了 52 句，一行失敗訊息都沒印。

## 兩個閘門

| 閘門 | 上限 | 超過怎麼辦 |
|---|---|---|
| 講稿審核（`qc/check-questions.py` + 人工看過） | 3 次 | **停止產線**，輸出報告 |
| 紅框抽格（`qc/check-frames.mjs`） | 2 次 | **停止產線**，輸出報告 |

超過上限**不強制放行**——強制通過等於閘門失效。
若第 2 輪的 FAIL 項目與第 1 輪完全相同，代表沒讀懂退稿理由，提前中止。

## 單一事實來源

`lessons/<slug>/scripts/script-data.mjs`。一句台詞同時決定四件事：

```js
{ who: 'Cooper', action: 'thinking', text: '不按滑鼠時老鼠在哪裡？', hold: 4 }
//  ↑ 角色動畫      ↑ 表情動作           ↑ 字幕內容             ↑ 講完停幾秒
```

改它就重跑產線，不要手動去改十個地方。`grade1-3.md` 是產物，不要手改。

## 共用腳本的執行位置

一律 `cd lessons/<slug>/scripts/` 之後再執行——課程脈絡由 cwd 推導。
新增課程**不要整包複製 `tools/` 的腳本**（2A4 複製過一份，修好的 bug 沒回流到 2A5）。
