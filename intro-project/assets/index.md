# assets ledger — codepro-intro

| role | frozen path | provenance |
| ---- | ----------- | ---------- |
| logo | `assets/logo/codepro_logo_white.webp` | 使用者素材（hyperframes-project/assets/），白色橫式 lockup 2084x650，雲朵圖標 + CodePro 字樣 |
| scratch-blocks | `assets/blocks/*.svg` (8 顆) | 使用者素材 hyperframes-project/assets/scratch-blocks/（event/motion/looks/control/operator/sensing） |
| characters | `assets/characters/{Cooper,Cora,Max}/keyframe_0[1-4].png + timing.json` | 使用者素材，greeting 揮手 4 幀循環（12fps、18 幀 ping-pong、1.5s loop），512x512 透明底 |
| bgm | `assets/bgm/intro-bgm.m4a` | 程式合成（numpy 8-bit 電玩風、130BPM C 大調、10s、5.6s logo 重音對齊）。HeyGen CLI 未安裝 → 音樂庫不可用，依降級策略本地合成；原專案 bgm.m4a 為 20 分鐘課程背景樂，不符「動感開場」需求 |
| sfx | `assets/sfx/{pop .16s, swoosh .34s, magic .70s, ding .85s, tick .10s, click .12s}.wav` | 使用者素材 hyperframes-project/assets/sfx/ |
