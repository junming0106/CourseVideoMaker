# 產生滑鼠點擊音效 assets/sfx/click.wav。
#
# ⚠️ 重建版：原始檔在 2A4 抽共用腳本時被誤刪，這份是依現有 click.wav 的量測值重寫的
#    （44100Hz / 單聲道 / 0.12 秒 / 峰值 0.92 / 主頻約 13kHz / 約 3ms 就衰減到三成）。
#    產出的音檔與原版聽感一致，但不保證位元組相同。原本的 click.wav 未被覆蓋過。
#
# 點擊聲的重點是「短、脆、沒有尾音」：高頻噪音爆點 + 極快的指數衰減。
# 衰減太慢會變成「噗」的一聲，蓋掉旁白。
#
# 用法：python3 ../../../tools/produce/mk-click-sfx.py
import array
import math
import os
import random
import wave

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "lib"))
from course import proj

SR = 44100
DUR = 0.12        # 總長；實際發聲只有前 20ms 左右，後面留空避免接上其他音效時卡住
DECAY = 0.0028    # 指數衰減時間常數，越小越脆
PEAK = 0.92

n = int(SR * DUR)
random.seed(1234)   # 固定種子，重跑產出一致

buf = []
for i in range(n):
    t = i / SR
    env = math.exp(-t / DECAY)
    if env < 1e-4:
        buf.append(0.0)
        continue
    # 高頻噪音爆點（脆度來源）＋ 一點 13kHz 正弦（讓它有明確音高、不是純沙沙聲）
    noise = random.uniform(-1.0, 1.0)
    tone = math.sin(2 * math.pi * 13150 * t)
    buf.append((0.72 * noise + 0.28 * tone) * env)

peak = max(abs(v) for v in buf) or 1.0
buf = [v / peak * PEAK for v in buf]

dst = proj("assets/sfx/click.wav")
os.makedirs(os.path.dirname(dst), exist_ok=True)
with wave.open(dst, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(array.array(
        "h", (int(max(-1.0, min(1.0, v)) * 32767) for v in buf)).tobytes())
print(f"已寫出 {dst}（{DUR}s / 峰值 {PEAK}）")
