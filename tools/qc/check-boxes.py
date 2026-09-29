# 紅框對位檢查：把講稿裡的紅框畫回原始截圖，疊上百分比網格，一眼看出哪幾個沒對準。
#
# 為什麼需要這支：紅框座標是「相對圖片的百分比」，用目測設幾乎一定會偏。
# 2A1 第一版 26 個框全部目測，實際重量發現 14 個要修——其中兩張圖的 4 個框全錯，
# 框到隔壁區域或整個溢出到空白處。渲染一次要 50 分鐘，發現得越早越好。
#
# 座標直接從課程的 build-composition.mjs 解析，不另外維護一份清單
# （兩邊各記一份，改了一邊忘了另一邊，驗證就失去意義）。
#
# 用法（在 lessons/<slug>/scripts/ 底下）：
#   python3 ../../../tools/qc/check-boxes.py
#   → 輸出到 lessons/<slug>/output/box-check/，逐張看過再決定要不要改座標
import os
import re
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from course import cfg, here, proj  # noqa: E402

GRID = 5          # 每 5% 一條淡格線；列與列的差距常常只有 3~4%，網格太粗就讀不出來
SMALL = 700       # 小於這個邊長的圖先放大，否則框線會蓋住要看的東西
OUT = here("../output/box-check")

BUILD = here("build-composition.mjs")
if not os.path.exists(BUILD):
    raise SystemExit(f"找不到 {BUILD}")
src = open(BUILD, encoding="utf-8").read()

# 1) 資產代號 → 檔案路徑：  key: [`${A}/xxx.png`, w, h]  或  key: ['assets/...', w, h]
assets = {}
for m in re.finditer(r"(\w+):\s*\[\s*[`']([^`']+)[`']\s*,\s*\d+\s*,\s*\d+\s*\]", src):
    assets[m.group(1)] = m.group(2).replace("${A}", f"assets/{cfg['slug']}/code")

# 2) 每個畫面組件裡的 codeCard(UI.xxx / CODE.xxx, ...) 與其後的 hl([...], say(L, '關鍵字')
#    用「從 codeCard 出現的位置往後掃到下一個 codeCard」來歸屬紅框
cards = [(m.start(), m.group(1)) for m in
         re.finditer(r"codeCard\(\s*(?:UI|CODE)\.(\w+)", src)]
boxes = {}
for i, (pos, key) in enumerate(cards):
    end = cards[i + 1][0] if i + 1 < len(cards) else len(src)
    found = re.findall(r"hl\(\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*,\s*say\(L,\s*'([^']+)'",
                       src[pos:end])
    if found:
        boxes.setdefault(key, []).extend(
            (float(a), float(b), float(c), float(d), kw) for a, b, c, d, kw in found)

if not boxes:
    raise SystemExit("build-composition.mjs 裡找不到 codeCard(...) + hl(...) 的組合")

os.makedirs(OUT, exist_ok=True)
total = 0
for key, bs in boxes.items():
    rel = assets.get(key)
    if not rel or not os.path.exists(proj(rel)):
        print(f"  ✗ {key}：找不到素材（{rel}）")
        continue
    im = Image.open(proj(rel)).convert("RGB")
    w, h = im.size
    k = 2 if max(w, h) < SMALL else 1
    if k > 1:
        im = im.resize((w * k, h * k), Image.LANCZOS)
        w, h = im.size
    d = ImageDraw.Draw(im, "RGBA")
    for p in range(0, 101, GRID):
        d.line([(w * p / 100, 0), (w * p / 100, h)], fill=(0, 0, 255, 40))
        d.line([(0, h * p / 100), (w, h * p / 100)], fill=(0, 0, 255, 40))
    for (x, y, bw, bh, kw) in bs:
        box = [w * x / 100, h * y / 100, w * (x + bw) / 100, h * (y + bh) / 100]
        d.rectangle(box, outline=(255, 45, 32), width=max(2, k))
        d.text((box[0] + 5, box[1] + 5), kw[:12], fill=(255, 45, 32))
    im.save(f"{OUT}/{key}.png")
    print(f"  {key}.png  {w}×{h}（{len(bs)} 個框）")
    total += len(bs)

print(f"\n{total} 個紅框已畫出 → {OUT}")
print("逐張確認「框有沒有精準罩住要講的東西」，偏了就回 build-composition.mjs 改百分比再重跑。")
