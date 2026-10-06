"""2A1 素材準備：把教案抽出來的原圖整理成 composition 要用的檔案。

輸入：hyperframes-project/assets/2A1/raw/（prep-course.mjs 抽出的教案原圖與影片）
輸出：
  assets/2A1/img/      介面截圖（縮到最長邊 1800px，載入比較快）
  assets/2A1/blocks/   積木與程式截圖（去背：只清跟邊界相連的背景，字被積木包住不會被誤傷）
  assets/2A1/snowman.png  從成品動畫截一格的雪人去背圖（舞台動畫用）
  assets/2A1/demo-snowman.mp4  成品動畫循環成 40 秒（原檔只有 3.8 秒）

用法：cd lessons/2A1/scripts && python3 prep-assets.py
可以重複執行，不會重複處理已存在的檔案（加 --force 全部重做）。
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "tools", "lib"))
from course import proj

FORCE = "--force" in sys.argv
RAW = proj("assets/2A1/raw")
OUT = proj("assets/2A1")
for d in ("img", "blocks"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

# 介面截圖：不去背，只縮圖
UI = [4, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
      37, 38, 40, 42, 43, 45, 48, 54]
# 積木／程式截圖：去背（教案裡是 #F9F9F9 或純白底）
BLOCKS = [41, 44, 46, 47, 49, 50, 51, 52, 53, 55, 56]
MAX_SIDE = 1800


def done(p):
    return os.path.exists(p) and not FORCE


def shrink(im):
    w, h = im.size
    s = MAX_SIDE / max(w, h)
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im


def cutout(im, thresh=14):
    """從四個角 flood fill，只把跟邊界相連的淺色背景變透明。"""
    im = im.convert("RGBA")
    w, h = im.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if im.getpixel(seed)[3] == 0:
            continue
        ImageDraw.floodfill(im, seed, (0, 0, 0, 0), thresh=thresh)
    # 裁到內容邊界：百分比座標才不會被透明邊拖歪
    box = im.getchannel("A").getbbox()
    return im.crop(box) if box else im


n = 0
for i in UI:
    for ext in ("png",):
        src = os.path.join(RAW, f"image{i}.{ext}")
        dst = os.path.join(OUT, "img", f"image{i}.png")
        if os.path.exists(src) and not done(dst):
            shrink(Image.open(src).convert("RGBA")).save(dst)
            n += 1
for i in BLOCKS:
    src = os.path.join(RAW, f"image{i}.png")
    dst = os.path.join(OUT, "blocks", f"image{i}.png")
    if not done(dst):
        cutout(shrink(Image.open(src))).save(dst)
        n += 1
print(f"圖片：處理 {n} 張")
# 隱私：遊樂場首頁（image13/14）左上角是真實學生的姓名與頭像，用側欄底色整塊蓋掉。
# 座標是圖片寬高的百分比（用 5% 網格量的）。
MASKS = {13: (1.0, 11.0, 17.0, 18.5), 14: (1.5, 11.5, 17.5, 19.0)}
for i, (x0, y0, x1, y1) in MASKS.items():
    dst = os.path.join(OUT, "img", f"image{i}.png")
    flag = dst + ".masked"
    if os.path.exists(dst) and not os.path.exists(flag):
        im = Image.open(dst).convert("RGBA")
        w, h = im.size
        col = im.getpixel((int(w * 0.02), int(h * 0.26)))   # 側欄底色
        ImageDraw.Draw(im).rectangle([w * x0 / 100, h * y0 / 100, w * x1 / 100, h * y1 / 100], fill=col)
        im.save(dst)
        open(flag, "w").write("1")
        print(f"image{i} 姓名已遮蓋")

# 旋轉方式三張：從教案的程式截圖裡只切出「set rotation style」那一塊（第一段藍色橫帶）。
# 三張截圖的選項不同（left-right／don't rotate／all around），積木 SVG 沒辦法換下拉文字，所以用截圖。
import numpy as np
for name, i in (("leftright", 41), ("dontrotate", 44), ("allaround", 46)):
    dst = os.path.join(OUT, "blocks", f"rot-{name}.png")
    if done(dst):
        continue
    im = Image.open(os.path.join(OUT, "blocks", f"image{i}.png")).convert("RGBA")
    a = np.array(im).astype(int)
    blue = (abs(a[..., 0] - 76) < 30) & (abs(a[..., 1] - 151) < 30) & (a[..., 2] > 220) & (a[..., 3] > 0)
    rows = np.where(blue.mean(axis=1) > 0.35)[0]
    # 取第一段連續的藍色列（set rotation style 在 when flag clicked 下方，是畫面中第一個藍色區塊）
    start = rows[0]; end = start
    for r in rows[1:]:
        if r - end > 3: break
        end = r
    # set rotation style 和下一塊 move 都是藍色、上下相連；前者有下拉選單所以比較寬。
    # 每一列看「藍色像素橫向涵蓋到哪裡」（不能數像素個數：字是白的，文字那幾列藍色會變少）
    def extent(r):
        c = np.where(blue[r])[0]
        return (c[-1] - c[0]) if len(c) > 5 else 0
    ext = np.array([extent(r) for r in range(blue.shape[0])])
    peak = ext[start:end + 1].max()
    end = start
    while end + 1 < blue.shape[0] and ext[end + 1] >= 0.9 * peak:
        end += 1
    cols = np.where(blue[start:end + 1].mean(axis=0) > 0.3)[0]
    row = im.crop((int(cols[0]) - 2, int(start) - 1, int(cols[-1]) + 3, int(end) + 2))   # 只留藍色那一列，不帶到旁邊的橘色與下一塊
    row = row.crop(row.getchannel("A").getbbox())
    row.save(dst)
    print(f"rot-{name}.png", row.size)


# 成品動畫（gif 只有 3.8 秒）：循環成 40 秒，並重設關鍵影格間隔
# （渲染是逐格 seek，關鍵影格太稀疏會慢到不能用，見 PIPELINE.md「接長影片」）
gif = os.path.join(RAW, "image20.gif")
mp4 = os.path.join(OUT, "demo-snowman.mp4")
if not done(mp4):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", gif, "-t", "40",
                    "-vf", "scale=964:720:flags=lanczos,format=yuv420p", "-r", "30", "-g", "30",
                    "-keyint_min", "30", "-sc_threshold", "0", "-c:v", "libx264", "-crf", "18",
                    "-movflags", "+faststart", "-an", mp4], check=True)
    print("demo-snowman.mp4 完成")

# 雪人去背：取成品動畫裡雪人完整在畫面內的一格（第 84 格）。
# 背景有網格線與黃點（藍色通道都 >= 170），雪人的線條是黑的、帽子是黃橘（藍色通道很低），
# 所以用「不是墨線」當背景，從邊界往內傳播；雪人身體內部是被線圈住的，傳播不進去。
# （Pillow 的 floodfill 在這張圖上填了 0 個像素，所以自己用 numpy 傳播。）
import numpy as np

snow = os.path.join(OUT, "snowman.png")
if not done(snow):
    tmp = os.path.join(OUT, "_snow-frame.png")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", gif, "-vf", "select=eq(n\\,83)", "-frames:v", "1", tmp], check=True)
    im = Image.open(tmp).convert("RGB")
    a = np.array(im).astype(int)
    lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
    ink = (lum < 140) | (a[..., 2] < 100)
    bgok = ~ink

    def grow(m):   # 3x3 膨脹一圈
        n = m.copy()
        n[1:] |= m[:-1]; n[:-1] |= m[1:]; n[:, 1:] |= m[:, :-1]; n[:, :-1] |= m[:, 1:]
        n[1:, 1:] |= m[:-1, :-1]; n[:-1, :-1] |= m[1:, 1:]; n[1:, :-1] |= m[:-1, 1:]; n[:-1, 1:] |= m[1:, :-1]
        return n

    # 雪人身體的圓圈線很細、有斷點，背景會從斷點漏進身體裡，把肚子也挖成透明（使用者回報「肚子顏色不見了」）。
    # 所以先把墨線膨脹 3 圈封住斷點，再從邊界填滿；填完再把多封的那 3 圈還原回來。
    barrier = ink
    for _ in range(3):
        barrier = grow(barrier)
    reach = np.zeros_like(ink)
    reach[0, :] = reach[-1, :] = reach[:, 0] = reach[:, -1] = True
    reach &= ~barrier
    while True:
        n = grow(reach) & ~barrier
        n |= reach
        if (n == reach).all():
            break
        reach = n
    for _ in range(3):                      # 還原：沿著原本的背景往回長 3 圈，線條外側才不會留白邊
        reach = (grow(reach) & bgok) | reach
    rgba = np.array(im.convert("RGBA"))
    rgba[..., 3] = np.where(reach, 0, 255)
    out = Image.fromarray(rgba)
    out = out.crop(out.getchannel("A").getbbox())
    out.save(snow)
    os.remove(tmp)
    print("snowman.png 完成", out.size)

# 貓咪方向圖（image42 朝右／43 朝左／45 倒立）：原圖是整張白底、貓只佔一小塊，放進卡片會縮成一個小點，
# 所以裁到內容邊界再加一點留白。
import numpy as _np
for i in (42, 43, 45):
    dst = os.path.join(OUT, "img", f"cat{i}.png")
    if done(dst):
        continue
    im = Image.open(os.path.join(OUT, "img", f"image{i}.png")).convert("RGB")
    a = _np.array(im).astype(int)
    ys, xs = _np.where(a.min(axis=2) < 170)   # 門檻要比外框細線與網格線更暗，不然會量到整張圖
    pad = 24
    im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad))).save(dst)
    print(f"cat{i}.png", Image.open(dst).size)
