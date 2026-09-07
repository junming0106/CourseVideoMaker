# 複查講稿：找出「有停頓、但沒有收尾」的提問。
#
# 為什麼要這支：Cooper 問一句、留了 hold 秒數給學生想，
# 如果下一句直接換話題，小孩會停在那裡不知道答案是什麼（實際踩過 7 次）。
#
# 兩種情況不算問題，會自動排除：
#   1. 帶做時的確認語（「你也打開了嗎？」）——停頓是給學生跟上，本來就沒有標準答案
#   2. Cooper 自己接答案（「答對了，就是⋯」）——不一定要學生角色來回答
#
# 用法：node gen-script-md.mjs grade1-3.md && python3 check-questions.py
import os
import sys

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "lib"))
from course import cfg, here

MD = sys.argv[1] if len(sys.argv) > 1 else here(cfg["scriptMd"])

# Cooper 自己給答案／收尾時會用到的詞
CLOSERS = ["答對", "沒錯", "就是", "你們都", "可以呀", "不行", "很棒", "完全正確"]
# 帶做時的確認語，不需要答案
# 各課程的帶做確認語不同，寫在 course.json 的 checkIns
CHECK_INS = cfg["checkIns"]

lines = open(MD, encoding="utf-8").read().split("\n")
gaps = []
for i, ln in enumerate(lines):
    if "停頓" not in ln or "（thinking）" not in ln:
        continue
    nxt = [x for x in lines[i + 1:i + 4] if x.startswith("- **")][:2]
    answered = any(("Max" in x or "Cora" in x) for x in nxt) or \
        any(k in "".join(nxt) for k in CLOSERS)
    if not answered and not any(k in ln for k in CHECK_INS):
        gaps.append(ln.strip()[:60])

print(f"有停頓卻沒有收尾的提問：{len(gaps)}")
for g in gaps:
    print("  ", g)
sys.exit(1 if gaps else 0)
