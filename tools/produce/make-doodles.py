#!/usr/bin/env python3
"""產生影片用的手繪風 SVG：教室黑板背景＋星星／打勾／打叉小圖案。

筆觸沿用 CodePro 低年級課本（codepro-lower-grade-textbook/scripts/make_illustrations.py）：
平塗底色＋側光陰影＋排線＋點描紋理＋深咖啡雙筆手抖輪廓。種子固定，重跑會得到相同檔案。
課本因為要印刷所以禁用漸層與透明度；影片沒有這個限制，但維持同樣的「平塗」質感才會跟課本一致。

用法：python3 tools/produce/make-doodles.py
輸出：hyperframes-project/assets/doodles/{star,tick,cross}.svg
      hyperframes-project/assets/backgrounds/classroom-board.svg

黑板背景的版面座標刻意跟舊版完全一致（綠板內緣 x 238~1682、y 196~904），
所以 build-composition.mjs 裡對齊綠板中心的內容不用跟著動。
"""

from __future__ import annotations

import math
import random
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent.parent / "hyperframes-project" / "assets"

INK = "#6B4A3A"  # 手繪輪廓：深咖啡
# 色名 → (平塗, 陰影, 排線)
COLORS = {
    "sun": ("#FFC93C", "#F2A93A", "#D9822B"),
    "yellow_pale": ("#FFE58A", "#F9D062", "#D9AE3C"),
    "orange": ("#F59A4A", "#E07A3A", "#B85A2A"),
    "coral": ("#F07A68", "#D95C4E", "#B04438"),
    "pink": ("#F7B3B0", "#E8928F", "#C46C6A"),
    "magenta": ("#EF6AA8", "#D4508E", "#A83A6E"),
    "red": ("#E5584B", "#C4413A", "#9A2F2B"),
    "leaf": ("#5FC46B", "#3FA24E", "#2A7A38"),
    "teal": ("#35A0AD", "#278591", "#1B6772"),
    "blue": ("#4F9BE0", "#3A7FC4", "#2A62A0"),
    "wood": ("#C98B52", "#A8703E", "#80522A"),
    "white": ("#FFFFFF", "#F1E8D8", "#D9CDB6"),
    # 綠板要夠暗，上面疊的白字才讀得清楚
    "board": ("#2E8B5E", "#256F4A", "#1F5A3C"),
}


class Svg:
    def __init__(self, width, height, seed):
        self.w, self.h = width, height
        self.rng = random.Random(seed)
        self.parts: list[str] = []

    # ------------------------------------------------------------ 幾何
    def jitter(self, pts, amp):
        """沿法線方向抖動，模擬手畫時不穩的線條。"""
        p1, p2 = self.rng.uniform(0, 6.28), self.rng.uniform(0, 6.28)
        out = []
        n = len(pts)
        for i, (x, y) in enumerate(pts):
            a = self.rng.uniform(-1, 1) * 0.35 + math.sin(i * 0.9 + p1) * 0.65 + math.sin(i * 2.3 + p2) * 0.25
            px, py = pts[(i + 1) % n]
            qx, qy = pts[i - 1]
            tx, ty = px - qx, py - qy
            norm = math.hypot(tx, ty) or 1
            out.append((x + (-ty / norm) * a * amp, y + (tx / norm) * a * amp))
        return out

    @staticmethod
    def smooth(pts, closed=True):
        """Catmull-Rom 轉貝茲曲線，讓取樣點連成圓滑的筆跡。"""
        n = len(pts)
        ext = [pts[-1]] + list(pts) + [pts[0], pts[1]] if closed else [pts[0]] + list(pts) + [pts[-1]]
        d = [f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"]
        for i in range(1, n + (1 if closed else -1)):
            p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
            d.append(
                "C{:.1f},{:.1f} {:.1f},{:.1f} {:.1f},{:.1f}".format(
                    p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
                    p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1],
                )
            )
        return " ".join(d) + (" Z" if closed else "")

    @staticmethod
    def resample(pts, step=10.0, closed=True):
        """沿折線每隔 step 取點，供抖動與平滑使用。"""
        out = []
        seq = list(pts) + ([pts[0]] if closed else [])
        for (x0, y0), (x1, y1) in zip(seq, seq[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
            out += [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n)]
        if not closed:
            out.append(pts[-1])
        return out

    @staticmethod
    def inside(pt, poly):
        x, y = pt
        c, j = False, len(poly) - 1
        for i in range(len(poly)):
            xi, yi = poly[i]
            xj, yj = poly[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
                c = not c
            j = i
        return c

    @staticmethod
    def clip_halfplane(poly, nx, ny, d):
        """保留 nx*x+ny*y >= d 的部分（Sutherland–Hodgman）。"""
        out = []
        for i in range(len(poly)):
            a, b = poly[i], poly[(i + 1) % len(poly)]
            fa, fb = nx * a[0] + ny * a[1] - d, nx * b[0] + ny * b[1] - d
            if fa >= 0:
                out.append(a)
            if (fa >= 0) != (fb >= 0):
                t = fa / (fa - fb)
                out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        return out

    def hatch_lines(self, poly, angle, gap, inset=0.0):
        cx = sum(p[0] for p in poly) / len(poly)
        cy = sum(p[1] for p in poly) / len(poly)
        ca, sa = math.cos(-angle), math.sin(-angle)
        rot = [((x - cx) * ca - (y - cy) * sa, (x - cx) * sa + (y - cy) * ca) for x, y in poly]
        ys = [p[1] for p in rot]
        lines, y = [], min(ys) + gap / 2
        while y < max(ys):
            xs = []
            for i in range(len(rot)):
                (x0, y0), (x1, y1) = rot[i], rot[(i + 1) % len(rot)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for a, b in zip(xs[0::2], xs[1::2]):
                a, b = a + inset + self.rng.uniform(0, gap), b - inset - self.rng.uniform(0, gap)
                if b - a > gap:
                    ci, si = math.cos(angle), math.sin(angle)
                    lines.append([(cx + px * ci - py * si, cy + px * si + py * ci) for px, py in ((a, y), (b, y))])
            y += gap * self.rng.uniform(0.85, 1.2)
        return lines

    # ------------------------------------------------------------ 繪製
    def add(self, markup):
        self.parts.append(markup)

    def path(self, d, fill="none", stroke="none", sw=0):
        self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" '
                 f'stroke-linecap="round" stroke-linejoin="round"/>')

    def shape(self, pts, color, outline=True, shade=True, texture=True, amp=2.2, sw=3.2,
              light=(-0.6, -0.8), dots=0.012):
        """完整質感形狀：底色、側光陰影＋排線、點描、雙筆輪廓。pts 為多邊形頂點。"""
        base, shade_c, hatch_c = COLORS[color]
        dense = self.resample(pts, step=9)
        poly = self.jitter(dense, amp)
        size = ext_size(poly)
        self.path(self.smooth(poly), fill=base)
        if shade:
            # 受光面反方向的一側做陰影：以半平面切出陰影區
            cx = sum(p[0] for p in poly) / len(poly)
            cy = sum(p[1] for p in poly) / len(poly)
            lx, ly = light
            region = self.clip_halfplane(poly, -lx, -ly, -lx * cx - ly * cy + size * 0.12)
            if len(region) >= 3:
                self.path("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in region) + " Z", fill=shade_c)
        if texture:
            angle = math.radians(self.rng.choice([32, 38, 44, -32]))
            for a, b in self.hatch_lines(poly, angle, gap=max(7, size / 16), inset=4):
                self.path(f"M{a[0]:.1f},{a[1]:.1f} L{b[0]:.1f},{b[1]:.1f}", stroke=hatch_c, sw=1.1)
            minx, maxx = min(p[0] for p in poly), max(p[0] for p in poly)
            miny, maxy = min(p[1] for p in poly), max(p[1] for p in poly)
            count = int((maxx - minx) * (maxy - miny) * dots)
            placed = tries = 0
            while placed < count and tries < count * 12:
                tries += 1
                pt = (self.rng.uniform(minx, maxx), self.rng.uniform(miny, maxy))
                if self.inside(pt, poly):
                    self.add(f'<circle cx="{pt[0]:.1f}" cy="{pt[1]:.1f}" r="{self.rng.uniform(0.7, 1.5):.1f}" fill="{hatch_c}"/>')
                    placed += 1
        if outline:
            for k, w in enumerate((sw, sw * 0.45)):
                self.path(self.smooth(self.jitter(dense, amp * (1.0 if k == 0 else 1.5))), stroke=INK, sw=w)

    def line(self, pts, color=INK, sw=3.0, jitter=1.2, closed=False):
        dense = self.resample(pts, step=12, closed=closed)
        self.path(self.smooth(self.jitter(dense, jitter), closed=closed), stroke=color, sw=sw)

    def svg(self):
        body = "\n".join(self.parts)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
                f'viewBox="0 0 {self.w} {self.h}">\n{body}\n</svg>\n')


def ext_size(poly):
    return max(max(p[0] for p in poly) - min(p[0] for p in poly), max(p[1] for p in poly) - min(p[1] for p in poly))


# ---------------------------------------------------------------- 幾何形狀
def circle(cx, cy, r, n=24):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def rrect(x, y, w, h, r, n=5):
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def star(cx, cy, r, points=5, inner=0.5, rot=-90):
    pts = []
    for i in range(points * 2):
        rad = r if i % 2 == 0 else r * inner
        a = math.radians(rot + 180 * i / points)
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts


def hump(x, y, w, h, n=6):
    """朝上的小弧線（舊版的 q 曲線）。"""
    return [(x + w * t, y - 4 * h * t * (1 - t)) for t in (i / n for i in range(n + 1))]


def cross_poly(cx, cy, arm, thick):
    """X 形的 12 個頂點：四條 45° 的粗臂，臂與臂之間的內角落在角平分線上。"""
    hw = thick / 2
    pts = []
    for k in range(4):
        a = math.radians(45 + 90 * k)
        d, p = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
        pts += [(cx + d[0] * arm - p[0] * hw, cy + d[1] * arm - p[1] * hw),
                (cx + d[0] * arm + p[0] * hw, cy + d[1] * arm + p[1] * hw)]
        b = a + math.pi / 4
        j = hw * math.sqrt(2)
        pts.append((cx + j * math.cos(b), cy + j * math.sin(b)))
    return pts


# ---------------------------------------------------------------- 小圖案（200×200）
def make_star():
    s = Svg(200, 200, 21)
    s.shape(star(100, 106, 88), "sun", amp=2.4, sw=5, dots=0.006)
    s.shape(circle(80, 84, 8), "yellow_pale", outline=False, shade=False, texture=False)
    return s


def make_tick():
    s = Svg(200, 200, 22)
    # 左短右長的粗勾：由外緣頂點依序繞一圈
    s.shape([(22, 108), (48, 84), (80, 116), (152, 34), (180, 58), (84, 168)], "leaf", amp=2.2, sw=5, dots=0.006)
    return s


def make_cross():
    s = Svg(200, 200, 23)
    s.shape(cross_poly(100, 100, 82, 40), "red", amp=2.0, sw=5, dots=0.006)
    return s


# ---------------------------------------------------------------- 教室黑板背景（1920×1080）
def make_board():
    s = Svg(1920, 1080, 31)

    # 牆面：平塗＋點描
    s.add('<rect width="1920" height="1080" fill="#FFE9A8"/>')
    for _ in range(280):
        s.add(f'<circle cx="{s.rng.uniform(0, 1920):.0f}" cy="{s.rng.uniform(0, 1080):.0f}" '
              f'r="{s.rng.uniform(1.2, 2.8):.1f}" fill="#F2CF7C"/>')

    # 牆面裝飾（位置與舊版相同）
    for cx, cy, r, c in ((120, 130, 26, "coral"), (1830, 180, 20, "teal"), (240, 960, 18, "blue"), (1700, 980, 24, "orange")):
        s.shape(circle(cx, cy, r), c, amp=1.4, sw=3.4, texture=False)
    s.shape(rrect(1770, 70, 36, 36, 9), "coral", amp=1.2, sw=3.2, texture=False)
    s.shape(rrect(90, 880, 30, 30, 8), "teal", amp=1.2, sw=3.2, texture=False)
    s.shape(star(1650, 100, 42), "sun", amp=1.6, sw=3.6, texture=False)
    s.shape(star(200, 722, 28), "coral", amp=1.6, sw=3.6, texture=False)
    s.line(hump(60, 420, 40, 17), color="#5B8DEF", sw=8, jitter=1.0)
    s.line(hump(1820, 620, 40, 17), color="#FF9F43", sw=8, jitter=1.0)

    # 彩色三角旗串：拉線是 Q 曲線的取樣
    cord = []
    for (x0, y0, cx, cy, x1, y1) in ((0, 30, 480, 90, 960, 55), (960, 55, 1440, 20, 1920, 70)):
        for i in range(0, 13):
            t = i / 12
            cord.append(((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
                         (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1))
    s.line(cord, color=INK, sw=5, jitter=1.4)
    for x, y, c in ((180, 52, "coral"), (420, 72, "teal"), (660, 70, "sun"), (900, 58, "blue"),
                    (1140, 45, "orange"), (1380, 38, "magenta"), (1620, 45, "teal")):
        s.shape([(x, y), (x + 30, y + 66), (x - 32, y + 70)], c, amp=1.4, sw=3.6, texture=False)

    # 木框：外緣先畫平塗，再補上沿邊的木紋短線（中央會被綠板蓋掉，所以不整塊鋪紋理）
    s.shape(rrect(210, 170, 1500, 760, 38), "wood", amp=2.0, sw=5, texture=False, shade=False)
    for _ in range(46):
        x, y = s.rng.uniform(240, 1680), s.rng.choice([s.rng.uniform(176, 190), s.rng.uniform(910, 924)])
        s.line([(x, y), (x + s.rng.uniform(26, 70), y + s.rng.uniform(-1.5, 1.5))], color="#A8703E", sw=2.0, jitter=0.5)
    for _ in range(26):
        x, y = s.rng.choice([s.rng.uniform(216, 230), s.rng.uniform(1690, 1704)]), s.rng.uniform(220, 880)
        s.line([(x, y), (x + s.rng.uniform(-1.5, 1.5), y + s.rng.uniform(26, 70))], color="#A8703E", sw=2.0, jitter=0.5)

    # 綠板：中央維持乾淨留白（上面要疊積木與字幕），只在邊緣加粉筆擦痕
    s.shape(rrect(238, 196, 1444, 708, 26), "board", amp=1.6, sw=4.5, texture=False, shade=False)
    for pts in (((270, 232), (520, 224)), ((1380, 872), (1640, 880)), ((262, 840), (268, 640)), ((1656, 250), (1650, 420))):
        s.line(list(pts), color="#3C9B6A", sw=26, jitter=3.0)

    # 板角小裝飾（不佔中央）
    s.shape(star(315, 275, 30), "yellow_pale", amp=1.4, sw=3.4, texture=False)
    s.shape(star(1615, 865, 30), "yellow_pale", amp=1.4, sw=3.4, texture=False)
    s.line(hump(1580, 260, 28, 12), color="#FFFFFF", sw=6, jitter=1.0)
    s.line(hump(320, 850, 28, 12), color="#FFFFFF", sw=6, jitter=1.0)

    # 粉筆槽與粉筆
    s.shape(rrect(700, 930, 520, 26, 13), "wood", amp=1.2, sw=3.6, texture=False)
    for x, c in ((760, "coral"), (860, "white"), (960, "teal")):
        s.shape(rrect(x, 920, 70, 14, 7), c, amp=0.8, sw=2.8, texture=False, shade=False)
    return s


def main():
    out = ASSETS / "doodles"
    out.mkdir(parents=True, exist_ok=True)
    jobs = {out / "star.svg": make_star, out / "tick.svg": make_tick, out / "cross.svg": make_cross,
            ASSETS / "backgrounds" / "classroom-board.svg": make_board}
    for path, make in jobs.items():
        path.write_text(make().svg(), encoding="utf-8")
        print(f"{path.relative_to(ASSETS.parent.parent)}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
