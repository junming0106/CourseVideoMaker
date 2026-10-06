// 把教案附的螢幕錄影（media*.mp4）裁出要用的區段，變速到剛好撐滿段落，輸出 assets/<slug>/clip-<段落>.mp4
// 讀 build-composition.mjs 產生的 clip-plan.json（每筆 { id, src, from, to, need }）。
// 每段需要的秒數取決於配音長度，所以要先 build 再跑這支；run-pipeline 在 build 後會自動跑。
//
// 為什麼要變速：錄影是真實操作，長度跟旁白不一樣。clip 播完就會消失、露出底下的卡片
// （PIPELINE.md「影片一定要比它所在的段落長」），所以不是剪短而是拉伸／壓縮到剛好等於段落長度。
// 為什麼重編：渲染是逐格 seek，關鍵影格太稀疏會慢到不能用，所以固定每秒一個關鍵影格、30fps，
// 並去掉聲音（教案錄影帶有雜音）。
//
// 用法：cd lessons/<slug>/scripts && node ../../../tools/produce/mk-clips.mjs
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { cfg, here, proj } from '../lib/course.mjs';

const planFile = here('clip-plan.json');
if (!existsSync(planFile)) { console.log('沒有 clip-plan.json，這門課沒有要變速的錄影。'); process.exit(0); }
const plan = JSON.parse(readFileSync(planFile, 'utf-8'));
if (!plan.length) { console.log('clip-plan.json 是空的，不需要變速。'); process.exit(0); }

const assets = dirname(cfg.voiceDir);          // 例如 assets/2A1
for (const c of plan) {
  const src = proj(assets, 'raw', c.src);
  if (!existsSync(src)) throw new Error(`找不到錄影原檔：${src}（prep-course 會把教案裡的 mp4 抽到 ${assets}/raw/）`);
  const out = proj(assets, `clip-${c.id}.mp4`);
  const len = c.to - c.from;
  const need = Math.ceil(c.need * 100) / 100 + 0.3;   // 多留 0.3 秒，段落結尾不會露出底下
  const factor = need / len;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(c.from), '-t', String(len), '-i', src,
    '-vf', `setpts=PTS*${factor.toFixed(4)},scale=960:-2:flags=lanczos,fps=30,format=yuv420p`,
    '-t', need.toFixed(2), '-an', '-c:v', 'libx264', '-crf', '20', '-g', '30', '-keyint_min', '30',
    '-sc_threshold', '0', '-movflags', '+faststart', out]);
  console.log(`${c.id}: 錄影 ${len}s → ${need.toFixed(1)}s（速度 ×${(1 / factor).toFixed(2)}）→ clip-${c.id}.mp4`);
}
