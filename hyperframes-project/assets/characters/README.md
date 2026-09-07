# CodePro 角色動畫素材

本素材包供 HyperFrames 使用，包含 Cooper、Cora、Max 共 16 組循環動畫。

## 建議用法

- 直接使用：每個動作資料夾內的 `*_alpha.webm`，為 VP9 Alpha 透明影片。
- 逐格控制：使用 `png_sequence/frame_*.png`，畫布固定為 2048×2048 RGBA PNG。
- 動畫節奏：12 fps；每個動作的秒數、影格數與順序記錄於同資料夾的 `timing.json`。
- 原始關鍵格：`keyframes/` 內保留四張生成關鍵影格，方便調整節奏。

## HyperFrames 範例

```html
<video
  class="clip"
  data-start="0"
  data-duration="2"
  data-track-index="1"
  src="./assets/Cooper/talking/cooper_talking_alpha.webm"
  autoplay
  muted
  loop
></video>
```

## 動作清單

- Cooper：打招呼、思考、向左指導、向右指導、說話嘴型、再見揮手
- Cora：打招呼、聆聽點頭、鼓勵比讚、說話嘴型、再見揮手
- Max：打招呼、思考、恍然大悟、說話嘴型、再見揮手

`previews/` 為透明背景檢查用聯絡表；`qa_report.json` 記錄尺寸與 Alpha 自動檢查結果。

## V3 防晃動校正

所有關鍵幀皆以雙腳下方中心鎖定於 (1024, 1900)，並統一使用 88% 縮放。角色只在原地做肢體動作，不會因各張圖的構圖偏移而左右或上下晃動。
