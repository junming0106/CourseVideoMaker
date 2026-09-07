# 把整張編輯器截圖裁到「這一步真正要看的區域」。
#
# 為什麼要這支：整張編輯器塞進 1000px 寬的卡片後，積木字高只剩約 10px，學生根本看不到。
# 與其加紅框框一小塊，不如先裁再放大——這樣同一張卡片就能塞下清楚的積木。
#
# 區域是佔整張截圖的百分比 [x, y, w, h]。用法：python3 crop-regions.py
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "../../../hyperframes-project/assets/steps2a4"))

PALETTE = [0, 6, 30, 86]        # 左側積木分類 + 積木清單
PALETTE_TOP = [0, 6, 30, 40]    # 積木清單上半（Make a Variable 那一帶）
DIALOG = [30, 8, 40, 64]        # 中央跳出的小視窗
STAGE = [58, 5, 42, 66]         # 右上角舞台
STAGE_TL = [58, 6, 30, 26]      # 舞台左上角的變數牌子
ADD_BTN = [78, 70, 22, 30]      # 右下角的加入角色／背景按鈕
LIB = [0, 0, 62, 50]            # 素材庫的卡片列
LIB_BD = [0, 0, 42, 50]

REGIONS = {
    "A01-playground": None,                    # 全景，讓學生先認識整個畫面
    "A02-sprite-button": ADD_BTN,
    "A03-sprite-library": LIB,
    "A04-cat-added": STAGE,
    "A05-backdrop-button": ADD_BTN,
    "A06-soccer2-picked": LIB_BD,
    "A07-stage-ready": STAGE,
    "B01-variables-category": PALETTE,
    "B02-make-variable-btn": PALETTE_TOP,
    "B03-new-variable-dialog": DIALOG,
    "B04-typed-steps": DIALOG,
    "B05-steps-created": PALETTE,
    "B06-monitor-on-stage": STAGE_TL,
    "C01-events-palette": PALETTE,
    "C02-goto-dragged": [28, 14, 24, 26],
    "C03-xy-typed": [28, 14, 24, 26],
    "C04-field-editing": [28, 14, 24, 26],
    "C05-rotation-style": [28, 14, 26, 36],
    "C06-init-complete": [30, 16, 24, 38],
    "D01-control-palette": PALETTE,
    "D02-repeat-300": [30, 16, 24, 46],
    "D03-move-inside": [30, 16, 26, 52],
    "D04-steps-into-slot": [30, 16, 26, 52],
    "D05-loop-complete": [30, 16, 24, 60],
    "D06-running": STAGE,
    "E01-second-repeat": [30, 52, 24, 34],
    "E02-copy-inside": [30, 68, 26, 30],
    "E03-typed-minus-one": [30, 68, 26, 30],
    "E04-final-run": STAGE,
}

for name, box in REGIONS.items():
    p = os.path.join(SRC, name + ".jpg")
    orig = os.path.join(SRC, "_full", name + ".jpg")
    os.makedirs(os.path.dirname(orig), exist_ok=True)
    if not os.path.exists(orig):          # 只留一份未裁的原圖，重跑不會越裁越小
        Image.open(p).save(orig, quality=92)
    im = Image.open(orig)
    if box:
        W, H = im.size
        x, y, w, h = box
        im = im.crop((round(x / 100 * W), round(y / 100 * H),
                      round((x + w) / 100 * W), round((y + h) / 100 * H)))
    im.save(p, quality=90)
    print(f"{name}  {im.size[0]}x{im.size[1]}  ratio {im.size[0]/im.size[1]:.2f}")
