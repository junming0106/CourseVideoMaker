# 把背景音樂與所有音效預先混成一條 course.json 指定的音樂床。
#
# 為什麼要預混：composition 每多一個長音訊元素，載入就會超過框架的 10 秒導覽上限
# （實測過，跟檔案大小無關，是元素數量）。所以音效不能逐顆掛 <audio>，
# 也不能單獨開一條音效軌，只能併進既有的音樂床。
#
# 輸入：course.json 的 bgmMusic（純音樂）＋ sfx-cues.json（build-composition.mjs 產生）
# 用法：python3 mk-audio-bed.py
import array
import json
import math
import os
import subprocess
import wave

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "lib"))
from course import cfg, here, proj, PROJ

SFX_DIR = proj("assets/sfx")
SR = 44100
TMP = here("_bed")

# composition 會把 #bgm 的音量推到 0.68；音效要按設計音量播出，得先除掉這個係數
BGM_GAIN = 0.68
# 音樂床裡的音樂要正規化到這個 RMS；乘上 BGM_GAIN 之後約 -30 dB，
# 剛好落在 SKILL 要求的「停頓只有音樂 -30 dB 上下」
TARGET_MUSIC_DBFS = -26.6

with open(here("sfx-cues.json"), encoding="utf-8") as f:
    spec = json.load(f)
total = spec["total"]
n = int(total * SR)

os.makedirs(TMP, exist_ok=True)


def decode(src, out):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src,
                    "-ac", "1", "-ar", str(SR), "-t", f"{total:.3f}", out], check=True)
    with wave.open(out) as w:
        a = array.array("h")
        a.frombytes(w.readframes(w.getnframes()))
    return a


music = decode(proj(cfg["bgmMusic"]), os.path.join(TMP, "music.wav"))

# 純音樂比片長短的話，後面會整段沒有音樂——而且是靜默發生的（2A1 踩過：
# 2 分 11 秒的曲子配 21 分的片，後面 19 分鐘只剩音效，混音跑完什麼都沒印）。
# 這裡直接擋下來，並印出接長用的指令。
music_sec = len(music) / SR
if music_sec < total:
    src = proj(cfg["bgmMusic"])
    print(f"✗ 純音樂只有 {music_sec:.1f} 秒，片長 {total:.1f} 秒——後面 "
          f"{total - music_sec:.0f} 秒會沒有音樂。")
    print("  先接長再重跑（逐次加倍，用 3 秒交叉淡入避免硬接的音量落差）：")
    print(f'    for i in 0 1 2 3; do j=$((i+1)); ffmpeg -y -i in$i.m4a -i in$i.m4a \\')
    print(f'      -filter_complex "[0:a][1:a]acrossfade=d=3:c1=tri:c2=tri" \\')
    print(f'      -c:a aac -b:a 192k in$j.m4a; done   # 起點 in0.m4a = {src}')
    raise SystemExit(1)

ns = min(n, len(music))

# 音樂要壓在人聲底下：規範是「人聲 -15~-19 dB、只有音樂的停頓 -30 dB 上下，相差 ≥12 dB」。
# 不能只靠 composition 的 0.68 增益——那只降 3.3 dB，音樂大聲的曲子照樣蓋過旁白
# （2A1 實測：停頓 -21.5 dB、人聲 -16.3 dB，只差 5 dB，成品抽驗直接判不過）。
# 這裡依實際 RMS 正規化，換任何一首曲子都會落在同一個位置。
rms = (sum((music[i] / 32768.0) ** 2 for i in range(ns)) / ns) ** 0.5 if ns else 0
music_gain = 1.0
if rms > 0:
    target = 10 ** (TARGET_MUSIC_DBFS / 20)
    music_gain = target / rms
    print(f"音樂 RMS {20 * math.log10(rms):.1f} dBFS → 目標 {TARGET_MUSIC_DBFS} dBFS"
          f"（增益 {music_gain:.3f}，播出後約 {TARGET_MUSIC_DBFS + 20 * math.log10(BGM_GAIN):.1f} dB）")

buf = [0.0] * n
for i in range(ns):
    buf[i] = music[i] / 32768.0 * music_gain

samples = {}
for name in {c["file"] for c in spec["cues"]}:
    with wave.open(os.path.join(SFX_DIR, name + ".wav")) as w:
        a = array.array("h")
        a.frombytes(w.readframes(w.getnframes()))
        samples[name] = [v / 32768.0 for v in a]

for c in spec["cues"]:
    src = samples[c["file"]]
    off = int(c["at"] * SR)
    g = c["vol"] / BGM_GAIN
    for i, v in enumerate(src):
        if off + i < n:
            buf[off + i] += v * g

peak = max(abs(v) for v in buf)
if peak > 0.98:
    k = 0.98 / peak
    buf = [v * k for v in buf]
    print(f"混音峰值 {peak:.2f} → 全軌衰減 {k:.3f}")

raw = os.path.join(TMP, "bed.wav")
with wave.open(raw, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(array.array("h", (int(max(-1.0, min(1.0, v)) * 32767) for v in buf)).tobytes())

dst = proj(cfg["bgm"])
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-c:a", "aac", "-b:a", "128k", dst], check=True)
for f in os.listdir(TMP):
    os.remove(os.path.join(TMP, f))
os.rmdir(TMP)
print(f"音樂 + {len(spec['cues'])} 顆音效 → {dst}（{total:.1f}s）")
