// 講稿寫完之後，一路跑到 MP4 並驗收。
//
// 用法（在 lessons/<slug>/scripts/ 底下執行）：
//   node ../../../tools/run-pipeline.mjs            全跑
//   node ../../../tools/run-pipeline.mjs --dry      只估配額，不合成、不渲染
//   node ../../../tools/run-pipeline.mjs --from build   從某一步接著跑
//   node ../../../tools/run-pipeline.mjs --to lint      跑到某一步就停（渲染前先自己看畫面）
//
// 順序是硬依賴，不能亂（gen-voice 要先於 build，mk-audio-bed 要後於 build）。
// 任何一步失敗就停——後面的步驟吃前面的產物，硬跑下去只會產出對不上的影片。
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cfg, here, proj, loadScript } from './lib/course.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const STAGES = ['voice', 'build', 'audio', 'lint', 'render', 'verify'];
const from = val('--from') ?? 'voice';
const to = val('--to') ?? 'verify';
if (!STAGES.includes(from) || !STAGES.includes(to)) {
  console.error(`--from/--to 只能是：${STAGES.join(' / ')}`);
  process.exit(1);
}
const want = (s) => STAGES.indexOf(s) >= STAGES.indexOf(from) && STAGES.indexOf(s) <= STAGES.indexOf(to);

// 腳本依用途分三層（analyze／produce／qc）。位置從這支自己算，不靠 cwd——
// cwd 是課程的 scripts/，那裡沒有工具。
const TOOLS = dirname(fileURLToPath(import.meta.url));
const PRODUCE = join(TOOLS, 'produce');
const QC = join(TOOLS, 'qc');
// index.html 是整個產線唯一的渲染入口，全部課程共用這一份。
// 兩門課同時做的話後建的會蓋掉先建的，而且渲染不會報錯——只是內容變成別門課的，
// 20 分鐘後才會發現。所以 build 完蓋一個課程戳記，後面每一關都先驗它是不是這門課的。
const INDEX = proj('index.html');
const STAMP = /^<!-- course: ([\w-]+) -->/;

const assertIndexIsThisCourse = () => {
  if (!existsSync(INDEX)) throw new Error('還沒有 index.html——先跑 --from build');
  const m = readFileSync(INDEX, 'utf-8').slice(0, 120).match(STAMP);
  if (!m) throw new Error('index.html 沒有課程戳記（是舊的或手動放的）——跑一次 --from build 重建');
  if (m[1] !== cfg.slug) {
    throw new Error(
      `index.html 現在是「${m[1]}」這門課的，不是「${cfg.slug}」。\n` +
      `  同一個包裡兩門課不能同時組建／渲染——等 ${m[1]} 渲染完，或先跑 --from build 重建這門課。`);
  }
};
const OUT = join(here(), '..', 'output', `${cfg.scriptMd.replace(/\.md$/, '')}.mp4`);

const run = (label, cmd, cmdArgs, opts = {}) => {
  console.log(`\n▶ ${label}`);
  execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: here(), ...opts });
};

// ---- 前置檢查：缺東西就早點講，不要跑到一半才炸 ----
for (const f of ['script-data.mjs', 'build-composition.mjs', 'course.json']) {
  if (!existsSync(here(f))) throw new Error(`缺少 ${f}——先寫完講稿與版面再跑這支`);
}
// 純音樂缺了或比片短，不再中止：build 之後會用 mk-bgm.py 自動合成（要先有 sfx-cues.json 才知道片長）

// ---- ① 配音（三個角色一定要串行，併發會靜默掉句） ----
if (want('voice')) {
  for (const who of ['Cooper', 'Max', 'Cora']) {
    run(`配音 ${who}${DRY ? '（估算）' : ''}`, 'node',
      [join(PRODUCE, 'gen-voice.mjs'), who, ...(DRY ? ['--dry'] : [])]);
  }
  if (DRY) { console.log('\n--dry 到此為止。確認配額後拿掉 --dry 再跑。'); process.exit(0); }

  // 句數對不上代表有靜默掉句，這時候往下跑會做出字幕對不上聲音的影片
  const { SEGS, voiceId } = await loadScript();
  let bad = 0;
  for (const who of ['Cooper', 'Max', 'Cora']) {
    const f = here(`voice-durations-${who}.json`);
    if (!existsSync(f)) throw new Error(`缺 voice-durations-${who}.json——配音沒跑完`);
    const have = new Set(Object.keys(JSON.parse(readFileSync(f, 'utf-8'))));
    const need = new Set(SEGS.flatMap((s) => s.lines).filter((l) => l.who === who).map((l) => voiceId(l.text, l)));
    const miss = [...need].filter((k) => !have.has(k));
    if (miss.length) { console.error(`✗ ${who} 少了 ${miss.length} 句語音`); bad += miss.length; }
  }
  if (bad) throw new Error(`共 ${bad} 句沒有語音——再跑一次 run-pipeline 會只補這幾句`);
  console.log('✓ 三個角色的語音句數都對得上');
}

// ---- ② 組建 → ③ 音樂床 ----
if (want('build')) {
  run('組建 composition', 'node', [here('build-composition.mjs'), INDEX]);
  writeFileSync(INDEX, `<!-- course: ${cfg.slug} -->\n` + readFileSync(INDEX, 'utf-8'));
  // 教案附的螢幕錄影要變速到剛好撐滿段落；每段需要的秒數是 build 才算得出來的（clip-plan.json）
  run('錄影變速（有 clip-plan.json 才做事）', 'node', [join(PRODUCE, 'mk-clips.mjs')]);
}
if (want('audio')) {
  // 純音樂要比片長更長，否則後面整段沒有音樂（而且是靜默的）。缺或不夠長就自己合成一段。
  const total = JSON.parse(readFileSync(here('sfx-cues.json'), 'utf-8')).total;
  let have = 0;
  if (existsSync(proj(cfg.bgmMusic))) {
    have = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', proj(cfg.bgmMusic)], { encoding: 'utf-8' }));
  }
  if (have < total + 1) run(`合成背景音樂（現有 ${have.toFixed(0)} 秒，需要 ${Math.ceil(total)} 秒以上）`, 'python3', [join(PRODUCE, 'mk-bgm.py')]);
  run('混音樂床 + 音效', 'python3', [join(PRODUCE, 'mk-audio-bed.py')]);
}

// ---- ④ 檢查 ----
if (want('lint')) {
  assertIndexIsThisCourse();
  run('lint', 'npx', ['hyperframes', 'lint', '.'], { cwd: proj() });
  run('提問四拍複查', 'node', [join(PRODUCE, 'gen-script-md.mjs'), cfg.scriptMd]);
  run('', 'python3', [join(QC, 'check-questions.py')]);
}

// ---- ⑤ 渲染（元素多，逾時要放大，否則導覽會被 10 秒上限打斷） ----
if (want('render')) {
  assertIndexIsThisCourse();
  run('渲染 MP4（約 15~20 分鐘）', 'npx',
    ['hyperframes', 'render', '.', '--browser-timeout', '180', '--fps', '30', '-o', OUT],
    {
      cwd: proj(),
      env: { ...process.env, PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS: '180000', PRODUCER_PLAYER_READY_TIMEOUT_MS: '180000' },
    });
}

// ---- ⑥ 成品抽驗 ----
if (want('verify')) run('成品抽驗', 'node', [join(QC, 'verify-output.mjs'), OUT]);

console.log('\n✅ 完成');
