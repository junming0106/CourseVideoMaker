// 由 script-data.mjs 產生人類可讀的講稿 markdown。
// 用法：node gen-script-md.mjs <輸出路徑>
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { cfg, here, loadScript } from '../lib/course.mjs';

const { SEGS, voiceId, speechText } = await loadScript();

// 還沒 build 過就沒有 sfx-cues.json，這時只出講稿、不報總長
const cuesFile = here('sfx-cues.json');
const cues = existsSync(cuesFile) ? JSON.parse(readFileSync(cuesFile, 'utf-8')) : { total: 0, cues: [] };

const voiceDur = {};
for (const who of ['Cooper', 'Max', 'Cora']) {
  const f = here(`voice-durations-${who}.json`);
  if (existsSync(f)) voiceDur[who] = JSON.parse(readFileSync(f, 'utf-8'));
}

const lines = SEGS.flatMap((s) => s.lines);
const quiz = SEGS.filter((s) => s.quiz).length;
const code = SEGS.filter((s) => s.vis.startsWith('code')).length;
const mm = Math.floor(cues.total / 60);
const ss = Math.round(cues.total % 60);

const out = [
  `# ${cfg.title}`,
  '',
  '> 這份文件由 `script-data.mjs` 產生，**請勿手動編輯**。',
  '> 要改講稿請改 `script-data.mjs`，再依序跑 `build-composition.mjs` → `mk-audio-bed.py` → `gen-script-md.mjs`。',
  '',
  `- 目標年級：${cfg.grade}`,
  '- 角色：Cooper ＝ 老師（全程站左側）；Max ＝ 好奇搗蛋的學生；Cora ＝ 貼心附和的學生',
  `- 片頭：\`assets/opening.mp4\`（10 秒）／音樂床：\`${cfg.bgm}\`（音樂 + 音效預混）`,
  `- 總長：${mm} 分 ${ss} 秒／${SEGS.length} 段／${lines.length} 句對白／${quiz} 題練習／${code} 段程式碼展示／${cues.cues.length} 顆音效`,
  '- 節奏：每句停留＝實際語音長度 + 0.05 秒，換人接話間隔 0.2 秒；思考時間一律用 `hold` 明確指定',
  '- 配音：Cooper ＝ 子睿（Classic）／Max ＝ 軒軒（Neo）／Cora ＝ 泡泡（Neo）',
  '- 視覺：**完全不使用 emoji**，一律用 Scratch 官方素材、教案原始程式碼截圖與 CSS 繪製',
  '- ★ 標記的段落 = 展示教案 PPT 上的原始 Scratch 程式截圖，學生照著排',
  '',
];

for (const seg of SEGS) {
  if (seg.part) out.push('', `## ${seg.part}`, '');
  out.push(`### ${seg.vis.startsWith('code') ? '★ ' : ''}${seg.title}`, '');
  out.push(`畫面：\`${seg.vis}\`${seg.teach ? '（統一教室背景）' : ''}`);
  for (const ln of seg.lines) {
    const d = voiceDur[ln.who]?.[voiceId(ln.text, ln)];
    const tags = [d ? `${d.toFixed(2)}s` : '無配音', ln.hold ? `停頓 ${ln.hold}s` : null].filter(Boolean);
    out.push(`- **${ln.who}**（${ln.action}）：「${ln.text}」　\`${tags.join('・')}\``);
    // 字幕與送 TTS 的文字不同時要標出來，方便校對唸法
    if (speechText(ln.text) !== ln.text) out.push(`  - 配音唸法：${speechText(ln.text)}`);
    if (ln.tone || ln.lead) out.push(`  - 配音語氣：${[ln.tone, ln.lead].filter(Boolean).join(' ')}`);
  }
  out.push('');
}

writeFileSync(process.argv[2], out.join('\n'));
console.log(`已寫出 ${process.argv[2]}（${SEGS.length} 段 / ${lines.length} 句）`);
