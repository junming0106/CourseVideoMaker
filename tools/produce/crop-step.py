# 把整頁截圖裁成只有 Scratch 編輯器 iframe 的 16:9 畫面。
# 實際尺寸以 course.json 的 capture.box 為準（CodeBrainy 是 (0,46) 起 1248x702、DPR=2）。
# 怎麼把畫面調到那個尺寸見 .claude/skills/teaching-video-pipeline/references/codebrainy-capture.md
import os
import sys

from PIL import Image

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "lib"))
from course import cfg, proj

DST = proj(cfg["stepsDir"])
DPR = cfg["capture"]["dpr"]
BOX = tuple(cfg["capture"]["box"])   # x, y, w, h（CSS px）；編輯器高度固定 702，寬度收成 1248 即 16:9

src, name = sys.argv[1], sys.argv[2]
im = Image.open(src)
x, y, w, h = (round(v * DPR) for v in BOX)
im = im.crop((x, y, x + w, y + h)).resize((1620, 911), Image.LANCZOS)
os.makedirs(DST, exist_ok=True)
im.convert("RGB").save(os.path.join(DST, name), quality=88)
print(name, im.size)
