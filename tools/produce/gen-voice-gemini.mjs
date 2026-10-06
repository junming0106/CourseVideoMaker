// 用 Gemini 3.8 Flash TTS 產生角色配音
// 用法：node gen-voice.mjs [角色名稱] [--dry]     （預設 Cooper）
//
// - API key 從專案根目錄 .env 的 GEMINI_API_KEY 讀取，不寫進任何輸出檔
// - 三個角色的聲音 ID（voice_...）從 .env 的 VOICE_COOPER / VOICE_MAX / VOICE_CORA 讀取
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

// 每個角色對應 .env 裡的聲音 ID 欄位（Voice Design 或語音複製建出來的 voice_...）
const VOICE_ENV = { Cooper: 'VOICE_COOPER', Max: 'VOICE_MAX', Cora: 'VOICE_CORA' };
// 預設 Flash；額度吃緊時可用 TTS_MODEL=gemini-3.8-flash-lite-tts。換模型會讓 .voice-stamp 對不上，舊音檔要先移開
const MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
// 官方文件列出的行內人聲標籤（沒有 <sad> 這種情緒標籤，情緒要寫在 tone → style）
const LEADS = new Set(['<argh>', '<breath>', '<heavy breath>', '<exhales>', '<cackle>', '<cheer>', '<chuckle>',
  '<cough>', '<cry>', '<gasp>', '<giggle>', '<groan>', '<growl>', '<grunt>', '<grr>', '<hiss>', '<laugh>',
  '<moan>', '<pant>', '<pff>', '<scream>', '<shout>', '<shriek>', '<sigh>', '<sneeze>', '<snicker>', '<snort>',
  '<sob>', '<throat-clearing>', '<tsk>', '<whimper>', '<whispers>', '<yawn>', '<short pause>', '<long pause>']);
const WHO = process.argv[2] ?? 'Cooper';
const DRY = process.argv.includes('--dry');
if (!VOICE_ENV[WHO]) throw new Error(`未定義 ${WHO} 的配音設定`);

const OUT_DIR = pathToFileURL(proj(cfg.voiceDir, WHO) + '/');

const env = readFileSync(new URL('.env', ROOT), 'utf-8');
const envVal = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const KEY = envVal('GEMINI_API_KEY');
const VOICE = envVal(VOICE_ENV[WHO]);
if (!KEY) throw new Error('.env 裡找不到 GEMINI_API_KEY');
if (!VOICE) throw new Error(`.env 裡找不到 ${VOICE_ENV[WHO]}`);

mkdirSync(OUT_DIR, { recursive: true });

// 檔名只由台詞文字決定，換了聲音 ID 或模型後舊音檔仍會被當成快取沿用，
// 所以記下「這個資料夾是用哪個聲音合成的」，不一致就停下來，不默默混用兩種聲音。
const STAMP = new URL('.voice-stamp', OUT_DIR);
const stamp = `${MODEL} ${VOICE}`;
if (existsSync(STAMP) && readFileSync(STAMP, 'utf-8').trim() !== stamp) {
  throw new Error(`${WHO} 的語音快取是用別的聲音／模型合成的。確定要換的話，先刪掉 ${OUT_DIR.pathname} 再重跑`);
}
if (!DRY) writeFileSync(STAMP, stamp);

// 收集該角色的所有台詞。檔名就是內容雜湊，所以檔案存在＝內容沒變＝可以沿用。
// 同一句話出現在不同段落時會共用同一個音檔，不會重複計費。
const seen = new Set();
const jobs = [];
for (const seg of SEGS) {
  for (const ln of seg.lines) {
    if (ln.who !== WHO) continue;
    const id = voiceId(ln.text, ln);
    if (seen.has(id)) continue;
    seen.add(id);
    if (ln.lead && !LEADS.has(ln.lead)) throw new Error(`不支援的語氣標籤 lead: ${ln.lead}（${ln.text}）`);
    // 標籤只放在 lead：字幕的 text 不能出現 <...>，否則會被字幕秀出來
    jobs.push({ id, text: (ln.lead ? `${ln.lead} ` : '') + speechText(ln.text), tone: ln.tone });
  }
}

const isFresh = (job) => {
  const f = new URL(`${job.id}.wav`, OUT_DIR);
  return existsSync(f) && statSync(f).size > 1000;
};

const todo = jobs.filter((j) => !isFresh(j));
const cost = todo.reduce((a, j) => a + j.text.length, 0);
console.log(`${WHO}（${VOICE}）：共 ${jobs.length} 句`);
console.log(`  需合成 ${todo.length} 句 / ${cost} 字，沿用快取 ${jobs.length - todo.length} 句`);
if (DRY) process.exit(0);

// 帳號有每分鐘請求上限時（Tier 1 是 10 次/分，併發 4 條必吃 429），用 TTS_RPM=9 節流；不設就維持原本行為
const RPM = Number(process.env.TTS_RPM || 0);
let nextSlot = 0;
async function pace() {
  if (!RPM) return;
  const at = Math.max(Date.now(), nextSlot);
  nextSlot = at + 60_000 / RPM;
  if (at > Date.now()) await new Promise((r) => setTimeout(r, at - Date.now()));
}

async function synth(job) {
  const file = new URL(`${job.id}.wav`, OUT_DIR);
  if (isFresh(job)) return 'cached';
  await pace();

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
    // 卡住的連線不會自己斷，沒有 timeout 會讓整批停在那裡
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: MODEL,
      // tone 是整句的情緒／語速（英文），例如 'sad and disappointed'；
      // 不要寫年齡、性別、口音，那些已經烤在聲音 ID 裡
      input: [{ type: 'user_input', content: [{
        type: 'text', text: job.text,
        ...(job.tone && { annotations: [{ type: 'speech_metadata', style: job.tone }] }),
      }] }],
      response_format: { type: 'audio' },   // 單次請求預設回 24kHz 單聲道 WAV（含 RIFF 標頭），直接存檔即可
      generation_config: { speech_config: [{ voice: VOICE }] },
    }),
  });
  if (!res.ok) throw new Error(`${job.id}: HTTP ${res.status} ${await res.text()}`);
  const body = await res.json();
  const audio = body.steps?.filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? []).filter((c) => c.type === 'audio').at(-1);
  if (!audio?.data) throw new Error(`${job.id}: 回應裡沒有音訊 ${JSON.stringify(body).slice(0, 300)}`);
  const buf = Buffer.from(audio.data, 'base64');
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
