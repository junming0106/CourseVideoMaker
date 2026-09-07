# 參考範例：2A4

第二支做完的課，跟 [`_reference-2A5`](../_reference-2A5/) 一樣**只留原始碼、不含素材，不能直接跑**。

## 為什麼兩支都留

產線文件裡「2A4 踩過⋯」的說法有十幾處，這份留著讓你能翻回去對照實際的程式碼：

| 文件裡的說法 | 在這裡看 |
|---|---|
| 三角色併發配音掉了 52/311 句 | `voice-durations-*.json` 的句數 |
| 教案的 `Sprite1` 已下架，只有 `Cat 2` | `script-data.mjs` 的角色名 |
| 積木帶變數名不能用通用 SVG | `build-composition.mjs` 的 `data2a4/` 素材路徑 |
| 低解析度程式截圖要拆成兩張並排 | `build-composition.mjs` 的加速程式段落 |
| CodeBrainy 實拍的裁切框與 DPR | `course.json` 的 `capture` |

`crop-regions.py` 是 2A4 自己的裁切腳本，沒有收進 `tools/`——它的座標是這門課專用的。

## 跟 2A5 的差別

2A5 是**結構最完整**的範例（八章、九段實作示範、六段程式碼展示），寫新課從它複製。
2A4 的價值在**踩坑紀錄**：CodeBrainy 實機拍攝、變數名積木、低解析度素材的處理都在這裡。
