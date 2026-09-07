# 從整頁截圖裁出單段程式碼圖（透明留白邊），產生 assets/code/code_*.png。
# 截圖是 Retina 2 倍，所以瀏覽器回報的 CSS 座標要乘以 2。
import sys
from PIL import Image

SCALE = 2      # Retina
PAD = 14       # CSS px，四周留白

src, dst, x, y, w, h = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
im = Image.open(src).convert("RGBA")
box = (
    max(0, (x - PAD) * SCALE),
    max(0, (y - PAD) * SCALE),
    min(im.width, (x + w + PAD) * SCALE),
    min(im.height, (y + h + PAD) * SCALE),
)
out = im.crop(box)
out.save(dst)
print(f"{dst}  {out.width}x{out.height}")
