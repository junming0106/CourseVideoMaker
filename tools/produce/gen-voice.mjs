// 用 voai TTS 產生角色配音
// 用法：node gen-voice.mjs [角色名稱] [--dry]     （預設 Cooper）
//
// - API key 從專案根目錄 .env 的 voaiAPI 讀取，不寫進任何輸出檔
// - 檔名＝口說文字的雜湊，只有台詞真的改了才會重新合成（插入/搬移句子不會失效）
// - --dry 只印出這次會花多少字，不呼叫 API
// - 輸出：<course.json 的 voiceDir>/<角色>/<雜湊>.wav（快取）與同名 .m4a（composition 實際引用）
//
// 共用腳本：從 lessons/<slug>/scripts/ 執行，課程脈絡由 cwd 推導。
import { writeFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { cfg, ROOT, proj, here, loadScript } from '../lib/course.mjs';

const { SEGS, speechText, voiceId } = await loadScript();

// 每個角色的配音設定（語者只存在於特定模型版本，不能混用）
const VOICES = {
  Cooper: { speaker: '子睿', style: '預設', version: 'Classic' },  // 5 歲男聲・演繹聲線
  Max:    { speaker: '軒軒', style: '預設', version: 'Neo' },      // 8 歲男聲・真實聲線
  Cora:   { speaker: '泡泡', style: '預設', version: 'Neo' },      // 7 歲女聲・真實聲線
};
const WHO = process.argv[2] ?? 'Cooper';
const DRY = process.argv.includes('--dry');
const { speaker: SPEAKER, style: STYLE, version: VERSION } = VOICES[WHO] ?? {};
if (!SPEAKER) throw new Error(`未定義 ${WHO} 的配音設定`);

const OUT_DIR = pathToFileURL(proj(cfg.voiceDir, WHO) + '/');

const env = readFileSync(new URL('.env', ROOT), 'utf-8');
const KEY = env.match(/^voaiAPI=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 裡找不到 voaiAPI');

mkdirSync(OUT_DIR, { recursive: true });

// 收集該角色的所有台詞。檔名就是內容雜湊，所以檔案存在＝內容沒變＝可以沿用。
// 同一句話出現在不同段落時會共用同一個音檔，不會重複計費。
const seen = new Set();
const jobs = [];
for (const seg of SEGS) {
  for (const ln of seg.lines) {
    if (ln.who !== WHO) continue;
    const id = voiceId(ln.text);
    if (seen.has(id)) continue;
    seen.add(id);
    jobs.push({ id, text: speechText(ln.text) });
  }
}

const isFresh = (job) => {
  const f = new URL(`${job.id}.wav`, OUT_DIR);
  return existsSync(f) && statSync(f).size > 1000;
};

const todo = jobs.filter((j) => !isFresh(j));
const cost = todo.reduce((a, j) => a + j.text.length, 0);
console.log(`${WHO}（${SPEAKER}／${VERSION}）：共 ${jobs.length} 句`);
console.log(`  需合成 ${todo.length} 句 / ${cost} 字，沿用快取 ${jobs.length - todo.length} 句`);
if (DRY) process.exit(0);

async function synth(job) {
  const file = new URL(`${job.id}.wav`, OUT_DIR);
  if (isFresh(job)) return 'cached';

  const res = await fetch('https://connect.voai.ai/TTS/Speech', {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'x-output-format': 'wav',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: VERSION,
      text: job.text,
      speaker: SPEAKER,
      style: STYLE,
      speed: 1,
      pitch_shift: 0,
      style_weight: 0,
      breath_pause: 0,
    }),
  });
  if (!res.ok) throw new Error(`${job.id}: HTTP ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`${job.id}: 音檔過小 (${buf.length} bytes)`);
  writeFileSync(file, buf);
  return 'new';
}

// 併發 4 條，避免打爆 API
const CONCURRENCY = 4;
let done = 0, made = 0, cached = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const job = queue.shift();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await synth(job);
        r === 'new' ? made++ : cached++;
        break;
      } catch (e) {
        if (attempt === 3) { console.error('失敗', job.id, e.message); break; }
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
    if (++done % 20 === 0) console.log(`  ${done}/${jobs.length}`);
  }
}));
console.log(`完成：新產生 ${made}，沿用快取 ${cached}`);

// wav 太大：composition 要同時掛上百個語音元素，總位元組數一高就會載入逾時。
// 保留 wav 當快取來源，另外轉一份 m4a 給 composition 用。
const durations = {};
const missing = [];
for (const job of jobs) {
  const wav = proj(cfg.voiceDir, WHO, `${job.id}.wav`);
  const m4a = proj(cfg.voiceDir, WHO, `${job.id}.m4a`);
  // 少數句子可能整批重試後仍沒拿到音檔。這裡不能直接讓 ffmpeg 炸掉——
  // 一炸整個 voice-durations 就寫不出來，前面幾百句的配額等於白花。
  if (!existsSync(wav) || statSync(wav).size < 1024) { missing.push(job.id); continue; }
  if (!existsSync(m4a) || statSync(m4a).mtimeMs < statSync(wav).mtimeMs) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '96k', m4a]);
  }
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', m4a], { encoding: 'utf-8' });
  durations[job.id] = Math.round(parseFloat(out) * 100) / 100;
}
writeFileSync(here(`voice-durations-${WHO}.json`), JSON.stringify(durations, null, 2));
if (missing.length) {
  console.error(`⚠ ${WHO} 有 ${missing.length} 句沒拿到音檔，再跑一次會只補這幾句：`);
  console.error('  ' + missing.join(' '));
  process.exitCode = 1;
}
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`語音總長 ${(total / 60).toFixed(1)} 分；已寫出 voice-durations-${WHO}.json`);
