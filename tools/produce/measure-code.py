# 量測程式碼圖裡每一塊積木的位置，輸出成 hl() 要用的百分比座標。
#
# 為什麼要這支：紅框是用「佔圖片寬高的百分比」定位的，換了程式碼圖就全部失準。
# Scratch 積木每個分類都是固定的純色，所以直接依顏色分群、再依 y 切列，
# 就能算出每一列積木的方框，不用人工目測。
import sys
from collections import defaultdict

from PIL import Image

# Scratch 各分類積木的主色
COLORS = {
    "events": (255, 191, 0),
    "looks": (153, 102, 255),
    "motion": (76, 151, 255),
    "control": (255, 171, 25),
    "sensing": (92, 177, 214),
    "data": (255, 140, 26),
    "operators": (89, 192, 89),
}
TOL = 26          # 色差容忍值（抗鋸齒邊緣）
MIN_PIX = 400     # 太小的色塊視為雜訊（例如積木上的小圖示）
GAP = 6           # y 方向間隔超過這麼多列，就算不同一列積木


def close(p, c):
    return all(abs(p[i] - c[i]) <= TOL for i in range(3))


def analyse(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    px = im.load()
    rows = defaultdict(lambda: defaultdict(list))  # 分類 -> y -> [x...]
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            for name, c in COLORS.items():
                if close(p, c):
                    rows[name][y].append(x)
                    break
    out = {}
    for name, ys in rows.items():
        if sum(len(v) for v in ys.values()) < MIN_PIX:
            continue
        # 把連續的 y 併成一列
        bands, cur = [], None
        for y in sorted(ys):
            if cur and y - cur[-1] <= GAP:
                cur.append(y)
            else:
                if cur:
                    bands.append(cur)
                cur = [y]
        if cur:
            bands.append(cur)
        segs = []
        for b in bands:
            xs = [x for y in b for x in ys[y]]
            if len(xs) < MIN_PIX // 4:
                continue
            segs.append({
                "x": round(min(xs) / W * 100, 1),
                "y": round(b[0] / H * 100, 1),
                "w": round((max(xs) - min(xs) + 1) / W * 100, 1),
                "h": round((b[-1] - b[0] + 1) / H * 100, 1),
            })
        if segs:
            out[name] = segs
    return W, H, out


for path in sys.argv[1:]:
    W, H, res = analyse(path)
    print(f"\n=== {path.split('/')[-1]}  {W}x{H} ===")
    for name in sorted(res):
        for i, s in enumerate(res[name]):
            print(f"  {name}[{i}]  [{s['x']}, {s['y']}, {s['w']}, {s['h']}]")
