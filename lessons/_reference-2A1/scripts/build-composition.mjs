// 2A1 — 由 script-data.mjs 產生 HyperFrames composition
// 用法：cd lessons/2A1/scripts && node build-composition.mjs ../../../hyperframes-project/index.html
//       UNTIL_SEG=q02 node build-composition.mjs ...   只做到某一段（預覽用）
//
// 版面（全部在綠色黑板內，x 280~1640、y 222~880；三層互不重疊）：
//   標題帶  y 218~326   一次只出現一張字卡，後出現的取代先出現的
//   內容區  y 344~736   圖片、積木、示意圖（一張圖用完就收，要留的先排好位置）
//   字幕帶  y 748~880   對話框，固定在黑板下緣，尖角朝說話的角色
//   等待鐘  黑板正中央 (960, 570)，手繪鬧鐘＋倒數秒數；有停頓的畫面中間都要留空 x 860~1060、y 475~665
// 風格：手繪。邊框用 SVG 濾鏡畫歪，字保持清楚；字卡只有 3 種顏色、1 種外形、少數幾種動畫。
//
// 規則備忘（踩過的坑，見 SKILL.md / PIPELINE.md）：
// - clip 內的圖片一律用 div + background-image，用 <img> 會被框架媒體探索接管而不渲染
// - 角色 clip 必須排在全屏段落 clip 之後；對話框再排在角色之後
// - 時間一律先 r2 再輸出，否則 toFixed 捨入會讓同軌 clip 重疊
// - 畫面完全不使用 emoji：Scratch 官方素材 + 教案截圖 + CSS 繪製
// - 紅框／箭頭的時間綁台詞內容 say(L, '關鍵字')，不綁索引；找不到會當場丟例外
// - 引導（箭頭／圈選）同一時間只能有一個
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SEGS, voiceId } from './script-data.mjs';
import { fxRuntimeJS } from '../../../tools/lib/fx.mjs';
import { hi, CARD_CSS, FONT_CSS } from '../../../tools/lib/cards.mjs';
import { LAYOUT, INK, PAPER, SKETCH_DEFS, sketchCss, makeSketchKit, clockHtml, clockTimelineJS, bubbleHtml, bubbleTimelineJS }
  from '../../../tools/lib/sketch.mjs';
import { makePointers, POINTER_CSS } from '../../../tools/lib/pointers.mjs';

const CFG = JSON.parse(readFileSync(new URL('course.json', import.meta.url), 'utf-8'));
const PROJ = new URL('../../../hyperframes-project/', import.meta.url);
const VOICE_DIR = CFG.voiceDir;

// 只做到某一段的預覽：UNTIL_SEG=q02（不設就是全片）。預覽用的 index.html、音樂床都是短的，出全片前要不帶變數整條重跑。
if (process.env.UNTIL_SEG) {
  const at = SEGS.findIndex((s) => s.id === process.env.UNTIL_SEG);
  if (at < 0) throw new Error(`UNTIL_SEG 找不到段落：${process.env.UNTIL_SEG}`);
  SEGS.splice(at + 1);
  console.log(`⚠ 預覽模式：只輸出到 ${process.env.UNTIL_SEG}（${SEGS.length} 段）`);
}

// ===== 配音長度 =====
const voiceDur = {};
for (const who of ['Cooper', 'Max', 'Cora']) {
  const f = fileURLToPath(new URL(`voice-durations-${who}.json`, import.meta.url));
  if (existsSync(f)) voiceDur[who] = JSON.parse(readFileSync(f, 'utf-8'));
}

// ===== 節奏參數 =====
const LEAD = 0.6, LEAD_FIRST = 0.12, TAIL = 1.0, GAP = 0.2, VOICE_PAD = 0.05;
const PER_CHAR = 0.15, BASE = 1.7, MIN_LINE = 3.0;   // 只在沒配音時才用
const r2 = (n) => Math.round(n * 100) / 100;
const durOf = (t) => r2(Math.max(MIN_LINE, BASE + t.length * PER_CHAR));
const f2 = (n) => r2(n).toFixed(2);

// ===== 版面常數 =====
const { TITLE_Y, MID, MAX_H } = LAYOUT;   // 標題帶、內容區中心與最大高度（定義與理由見 tools/lib/sketch.mjs）

const CHAR_COLORS = { Cooper: '#2F5FC0', Max: '#B85C06', Cora: '#B02F68' };
const ASSET_ROOT = 'assets/characters';
const ACTIONS = {
  Cooper: ['greeting', 'talking', 'thinking', 'guide_left', 'guide_right', 'goodbye'],
  Cora: ['greeting', 'talking', 'listening', 'encourage', 'goodbye'],
  Max: ['greeting', 'talking', 'thinking', 'eureka', 'goodbye'],
};
const badActions = [];
const timingOf = (who, action) => {
  if (!ACTIONS[who]?.includes(action)) badActions.push(`${who}.${action}`);
  return JSON.parse(readFileSync(new URL(`${ASSET_ROOT}/${who}/${action}/timing.json`, PROJ), 'utf-8'));
};
const kfSrc = (who, action, i) => `${ASSET_ROOT}/${who}/${action}/keyframes/keyframe_0${i + 1}.png`;

// ===== 時間軸 =====
let t = 0;
for (const [si, seg] of SEGS.entries()) {
  seg.start = r2(t);
  let cur = si === 0 ? LEAD_FIRST : (seg.lead ?? LEAD);
  seg.L = seg.lines.map((ln) => {
    const key = voiceId(ln.text, ln);
    const vd = voiceDur[ln.who]?.[key];
    const d = vd ? r2(vd + VOICE_PAD) : durOf(ln.text);
    const o = { ...ln, rel: r2(cur), dur: d, voice: vd ? `${VOICE_DIR}/${ln.who}/${key}.m4a` : null };
    cur = r2(cur + d + GAP + (ln.hold ?? 0));
    return o;
  });
  seg.dur = r2(cur + (seg.tail ?? TAIL));
  t = r2(t + seg.dur);
}
const TOTAL = Math.ceil(t * 10) / 10;
{
  const goal = SEGS.find((s) => s.id === 's04');
  if (goal) {
    const goalAt = r2(goal.start + goal.L[0].rel);
    console.log(`學習目標開口時間：${goalAt}s（規範 12~15 秒，加一句問候後放寬，容許到 17.5 秒）`);
    if (goalAt > 17.5) { console.error('✖ 學習目標太晚出現，開場太長'); process.exitCode = 1; }
  }
}
const missingVoice = SEGS.flatMap((s) => s.L.filter((l) => !l.voice));
if (missingVoice.length) console.warn(`⚠ ${missingVoice.length} 句沒有配音檔，時間用字數估算`);

// ===== 音效（預混進音樂床，不逐顆掛 audio）=====
const SFX = {
  pop:      { file: 'pop',      dur: 0.16, vol: 0.30 },
  swoosh:   { file: 'swoosh',   dur: 0.34, vol: 0.22 },
  ding:     { file: 'ding',     dur: 0.85, vol: 0.28 },
  tick:     { file: 'tick',     dur: 0.10, vol: 0.18 },
  magic:    { file: 'magic',    dur: 0.70, vol: 0.26 },
  question: { file: 'question', dur: 0.45, vol: 0.30 },
  click:    { file: 'click',    dur: 0.12, vol: 0.34 },
};
const sfxHits = [];
let CUR = null;
const hit = (kind, at) => sfxHits.push({ kind, at: r2(CUR.start + at) });

// ===== 動畫與字卡：共用模組收斂成少數幾種（pop／rise／stamp、3 色字卡），畫面才不亂 =====
const { fx, fxOut, card } = makeSketchKit(hit);
const { arrow, circle } = makePointers(fx, fxOut);

// ===== 依台詞內容找句子 =====
const say = (L, kw) => {
  const ln = L.find((l) => l.text.includes(kw));
  if (!ln) throw new Error(`對不到台詞：「${kw}」`);
  return ln;
};

// ===== 圖片與座標 =====
const pngDims = (rel) => { const b = readFileSync(new URL(rel, PROJ)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const A = 'assets/2A1';
const IMG = (n) => { const s = `${A}/img/image${n}.png`; return [s, ...pngDims(s)]; };
const CAT = (n) => { const s = `${A}/img/cat${n}.png`; return [s, ...pngDims(s)]; };
const BLK = (n) => { const s = `${A}/blocks/image${n}.png`; return [s, ...pngDims(s)]; };
const ROT = (n) => { const s = `${A}/blocks/rot-${n}.png`; return [s, ...pngDims(s)]; };
const SNOW = (() => { const s = `${A}/snowman.png`; return [s, ...pngDims(s)]; })();
const sp = (folder, file) => `assets/scratch角色素材/scratch角色素材/${folder}/${file}`;
const SPRITE = {
  flag: sp('114_Green_Flag', '01_green_flag.svg'), bell: sp('025_Bell', '01_bell1.svg'), bread: sp('029_Bread', '01_bread.svg'),
  balloon: sp('015_Balloon1', '01_balloon1-a.svg'), gift: sp('107_Gift', '01_gift-a.svg'), star: 'assets/doodles/star.svg',
};
const svgBox = (p) => {
  const m = readFileSync(new URL(p, PROJ), 'utf-8').match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return [Number(m[1]), Number(m[2])];
};
// 官方積木 SVG（英文版）。尺寸從 viewBox 換算，全片同一個倍率，字級才一致
const BLOCK_UNIT = 2.15;
const block = (path, scale = 1, attrs = '', style = '') => {
  const src = `assets/scratch-blocks/${path}.svg`;
  const [w0, h0] = svgBox(src);
  return `<div ${attrs} style="width:${Math.round(w0 * BLOCK_UNIT * scale)}px;height:${Math.round(h0 * BLOCK_UNIT * scale)}px;background:url('${src}') center/contain no-repeat;flex:none;${style}"></div>`;
};
const art = (src, w, h, style = '', attrs = '') =>
  `<div ${attrs} style="width:${w}px;height:${h}px;background:url('${src}') center/contain no-repeat;flex:none;${style}"></div>`;
const fit = ([, iw, ih], { maxW, maxH = MAX_H, cx = MID.cx, cy = MID.cy }) => {
  const s = Math.min(maxW / iw, maxH / ih);
  const w = Math.round(iw * s), h = Math.round(ih * s);
  return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h };
};
const place = (img, rect, attrs = '', style = '') =>
  `<div ${attrs} style="position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`
  + `background:url('${img[0]}') center/contain no-repeat;${style}"></div>`;
// 圖片放進手繪紙卡裡（外框歪歪的、有咖啡色線）。rect 是圖本身的範圍，紙卡外擴 12px
const framed = (img, rect, attrs = '') =>
  `<div ${attrs} class="sketch paper" style="position:absolute;left:${rect.x - 12}px;top:${rect.y - 12}px;width:${rect.w + 24}px;height:${rect.h + 24}px;visibility:hidden">`
  + `<div style="position:absolute;inset:12px;background:url('${img[0]}') center/contain no-repeat"></div></div>`;
const pbox = (r, [x, y, w, h], pad = 14) => ({
  x: Math.round(r.x + r.w * (x + w / 2) / 100), y: Math.round(r.y + r.h * (y + h / 2) / 100),
  w: Math.max(64, Math.round(r.w * w / 100) + pad * 2), h: Math.max(48, Math.round(r.h * h / 100) + pad * 2),
});
const row = (y, inner, style = '') => `<div class="rowc" style="top:${y}px;${style}">${inner}</div>`;

// 裁切放置：crop = [x%, y%, w%, h%]（原圖百分比）；map() 把整張圖上的百分比框換成裁切後的框
const cropPlace = (img, crop, opt, attrs = '') => {
  const [cx, cy, cw, ch] = crop;
  const rect = fit([img[0], img[1] * cw / 100, img[2] * ch / 100], opt);
  const html = `<div ${attrs} class="sketch paper" style="position:absolute;left:${rect.x - 12}px;top:${rect.y - 12}px;width:${rect.w + 24}px;height:${rect.h + 24}px">`
    + `<div style="position:absolute;inset:12px;overflow:hidden;border-radius:6px"><div style="position:absolute;left:${-cx / cw * 100}%;top:${-cy / ch * 100}%;width:${10000 / cw}%;height:${10000 / ch}%;`
    + `background:url('${img[0]}') 0 0/100% 100% no-repeat"></div></div></div>`;
  const map = ([x, y, w, h]) => [(x - cx) * 100 / cw, (y - cy) * 100 / ch, w * 100 / cw, h * 100 / ch];
  return { html, rect, map };
};

// 引導序列：依台詞依序出現，前一個在後一個出現前離場，所以同一時間只有一個
const guides = (L, r, items) => items.map((it, i) => {
  const ln = say(L, it.kw);
  const a = r2(ln.rel + (it.off ?? 0.25));
  const nxt = items[i + 1];
  const nextA = nxt ? r2(say(L, nxt.kw).rel + (nxt.off ?? 0.25)) : r2(ln.rel + ln.dur + 0.5);
  const outAt = r2(Math.max(a + 1.3, nextA - 0.12));
  if (it.k === 'arrow') {
    const p = { x: Math.round(r.x + r.w * it.at[0] / 100), y: Math.round(r.y + r.h * it.at[1] / 100) };
    return arrow({ x: p.x, y: p.y, dir: it.dir ?? 'right', at: a, out: 'fadeOut', outAt, len: it.len ?? 120 });
  }
  const b = pbox(r, it.box, it.pad ?? 14);
  return circle({ x: b.x, y: b.y, w: b.w, h: b.h, at: a, out: 'fadeOut', outAt });
}).join('');

// 標題帶：一次只出現一張字卡，後出現的取代先出現的。items: { kw, text, tone, size, off, keep }
const titles = (L, items) => items.map((it, i) => {
  const a = r2(say(L, it.kw).rel + (it.off ?? 0.2));
  const nxt = items[i + 1];
  const outAt = nxt ? r2(say(L, nxt.kw).rel + (nxt.off ?? 0.2) - 0.05) : null;
  return row(TITLE_Y, card({ text: it.text, tone: it.tone ?? 'orange', size: it.size ?? 'md', fx: it.fx ?? 'pop', at: a,
    ...(outAt && !it.keep ? { out: 'fadeOut', outAt } : {}) }));
}).join('');

// ===== 角色逐格動畫 =====
const charLayers = [];
function charClip(domId, who, action, start, dur, side) {
  const tm = timingOf(who, action);
  const order = tm.keyframe_order_zero_based;
  const step = 1 / tm.fps;
  const switches = [];
  order.forEach((k, i) => { if (i === 0 || k !== order[i - 1]) switches.push({ k, at: r2(i * step) }); });
  charLayers.push({ domId, switches, cycle: tm.duration_seconds, start, dur });
  const layers = [0, 1, 2, 3].map((i) =>
    `<div id="${domId}-k${i}" style="position:absolute;inset:0;background:url('${kfSrc(who, action, i)}') center bottom/contain no-repeat"></div>`).join('');
  return `
  <div id="${domId}" class="clip" data-start="${f2(start)}" data-duration="${f2(dur)}" data-track-index="${side === 'left' ? 3 : 4}"
    style="position:absolute;${side === 'left' ? 'left:10px' : 'right:10px'};bottom:0;width:440px;height:440px">${layers}</div>`;
}

// ===== 小型元件（全部用同一種手繪紙卡外形）=====
const FAMILY = {
  Motion: ['#4C97FF', '動作'], Looks: ['#9966FF', '外觀'], Sound: ['#CF63CF', '音效'], Events: ['#FFBF00', '事件'], Control: ['#FFAB19', '控制'],
  Sensing: ['#5CB1D6', '偵測'], Operators: ['#59C059', '運算'], Variables: ['#FF8C1A', '變數'], 'My Blocks': ['#FF6680', '函式'],
};
const famDot = (name) => `<i class="fdot" style="background:${FAMILY[name][0]}"></i>`;
const famCard = (name, at, extra = {}) => card({ text: `${name}　${FAMILY[name][1]}`, icon: famDot(name), tone: 'blue', size: 'sm', fx: 'pop', at, ...extra });
const note = (inner, style = '', attrs = '') => `<div ${attrs} class="sketch paper note" style="${style}">${inner}</div>`;
// 迴圈箭頭：有缺口與箭頭尖才看得出在轉
const loopArrow = (size, id, color = '#E8833A') =>
  `<svg id="${id}" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible">`
  + `<path d="M50 10 A40 40 0 1 1 14 66" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"/>`
  + `<path d="M0 58 L24 86 L38 54 Z" fill="${color}"/></svg>`;
const snowImg = (h, style = '', attrs = '') => art(SNOW[0], Math.round(h * SNOW[1] / SNOW[2]), h, style, attrs);
const stageBox = (w, h, inner) =>
  `<div class="sketch paper" style="padding:14px;width:${w + 28}px;height:${h + 28}px"><div class="stageinner" style="width:${w}px;height:${h}px">${inner}</div></div>`;

// ===== 各段中央視覺 =====
const V = {
  // ---------- 開場 ----------
  hook: (L) => `
    ${row(TITLE_Y + 6, card({ text: `為什麼你畫好的雪人，怎麼點都${hi('不會動', 'white')}？`, tone: 'orange', size: 'md', fx: 'pop', at: L[1].rel }))}
    ${snowImg(300, 'position:absolute;left:805px;top:385px', fx('pop', 0.35))}
    <div ${fx('pop', L[2].rel + 0.1)} class="qmark" style="position:absolute;left:1090px;top:380px">？</div>
    <div ${fx('pop', L[2].rel + 0.5)} class="qmark" style="position:absolute;left:790px;top:420px;font-size:80px">？</div>`,

  demoVideo: (L, seg) => {
    const startRel = seg.id === 's02' ? 0.15 : 0.2;
    const dur = Math.min(39, r2(seg.dur - startRel - 0.4));
    return `
    ${titles(L, seg.id === 's02' ? [{ kw: '下課以前', text: `下課以前，你會做出${hi('這隻', 'white')}`, off: 0.3 }] : [{ kw: '每一步都是自己完成', text: '完成！會走路的雪人', tone: 'green', fx: 'stamp' }])}
    <div ${fx('pop', 0.1)} class="sketch paper" style="position:absolute;left:672px;top:344px;width:576px;height:398px;visibility:hidden">
      <video id="${seg.id}-vid" class="clip" data-start="${f2(seg.start + startRel)}" data-duration="${f2(dur)}" data-track-index="2"
        src="${A}/demo-snowman.mp4" muted style="position:absolute;left:14px;top:14px;display:block;width:548px;height:370px;object-fit:cover;border-radius:6px"></video>
    </div>`;
  },

  goals: (L) => `
    ${row(TITLE_Y, card({ text: `看完你會做出${hi('會走路的雪人', 'white')}`, tone: 'orange', size: 'md', fx: 'pop', at: 0.4 }))}
    <div style="position:absolute;left:640px;top:372px;display:grid;grid-template-columns:repeat(2,320px);gap:30px">
      ${[['第一，', '1', '認識 Scratch'], ['第二，', '2', '畫一隻雪人'], ['第三，', '3', '來挑戰'], ['第四，', '4', '複習時間']].map(([kw, n, s]) =>
        note(`<span class="goalnum">${n}</span><span class="goaltxt">${s}</span>`, 'height:150px;visibility:hidden', fx('pop', say(L, kw).rel))).join('')}
    </div>`,

  chapter: (L, seg) => `
    <div class="vis"><div id="${seg.id}-card" class="sketch paper chapcard">
      <span class="chapnum">${seg.chapNo}</span><span class="chaptxt">${seg.chapTitle}</span></div></div>`,

  // ---------- 第一章 ----------
  codebrainy: (L) => {
    const r = fit(IMG(13), { maxW: 640, maxH: 330, cx: 1210, cy: 520 });
    return `
    ${titles(L, [{ kw: '它叫做', text: 'CodeBrainy', size: 'lg' }, { kw: '都在這裡', text: '上課和考試都在這裡', tone: 'blue' }])}
    ${art(IMG(7)[0], 250, 268, 'position:absolute;left:500px;top:400px', fx('pop', 0.3))}
    ${framed(IMG(13), r, fx('rise', say(L, '遊樂場，可以').rel + 0.2))}
    ${guides(L, r, [{ kw: '遊樂場，可以', k: 'circle', box: [1, 33, 15, 9] }])}`;
  },

  demoSteps: (L, seg) => {
    const shots = seg.shots.map((s, i) => {
      const line = say(L, s.on);
      const nextLine = seg.shots[i + 1] ? say(L, seg.shots[i + 1].on).rel : r2(seg.dur - TAIL);
      const id = `${seg.id}-sh${i}`;
      shotFades.push({ id, at: r2(seg.start + line.rel), until: r2(seg.start + nextLine) });
      if (i === 0) hit('swoosh', line.rel);
      const spec = STEP_PTS[seg.id]?.[i] ?? { crop: [0, 0, 100, 100] };
      const cp = cropPlace(IMG(Number(s.img.match(/\d+/)[0])), spec.crop, { maxW: spec.maxW ?? 940, maxH: MAX_H - 24 });
      const g = spec.box ? guides(L, cp.rect, [{ k: 'circle', box: cp.map(spec.box), kw: s.on, off: 0.45, pad: spec.pad }]) : '';
      return `<div id="${id}" class="demoshot" style="visibility:hidden">${cp.html}${g}</div>`;
    });
    return `${shots.join('')}${seg.caption ? row(TITLE_Y, card({ text: seg.caption, tone: 'blue', size: 'md', fx: 'pop', at: 0.4 })) : ''}`;
  },

  uiAreas: (L, seg) => {
    const r = fit(IMG(15), { maxW: 720, maxH: MAX_H - 24 });
    const defs = seg.id === 's06'
      ? [['右上角那一大塊', '舞台', [56, 14, 43, 55]], ['左邊這一排', '程式家族', [0.3, 14, 5.7, 62]], ['中間大大的空白', '程式區', [28, 11, 27, 82]]]
      : [['舞台的下面', '角色設定', [56, 70, 37, 14]], ['再往下', '角色列表', [56, 84, 37, 12]], ['最右邊', '背景設定', [93.5, 70, 6.5, 25]]];
    return `${titles(L, defs.map(([kw, text]) => ({ kw, text, off: 0.15 })))}
    ${framed(IMG(15), r, fx('pop', 0.2))}
    ${guides(L, r, defs.map(([kw, , box]) => ({ kw, k: 'circle', box })))}`;
  },

  quizAB: (L, seg) => {
    const hasBlock = seg.id === 'q05' || seg.id === 'q06';
    // 選項放左右兩邊，中間 x 860~1060 留給等待鐘
    const opts = seg.opts.map((o, i) => {
      const id = `${seg.id}-opt${o.k}`;
      const ic = o.img ? `<span style="width:70px;height:70px;background:url('${IMG(Number(o.img.match(/\d+/)[0]))[0]}') center/contain no-repeat;display:block"></span>` : '';
      return note(`<span class="optlab">${o.k}</span>${ic}<span class="opttxt">${o.t}</span><span id="${id}-tick" class="tick" style="position:absolute;right:-22px;top:-26px;visibility:hidden"></span>`,
        `position:absolute;left:${i === 0 ? 540 : 1080}px;top:${hasBlock ? 540 : 480}px;width:300px;height:170px;visibility:hidden`, `id="${id}" ${fx('pop', 0.9 + i * 0.25)}`);
    }).join('');
    const blk = hasBlock ? place(seg.id === 'q05' ? BLK(49) : BLK(50), seg.id === 'q05' ? { x: 870, y: 338, w: 180, h: 135 } : { x: 830, y: 342, w: 260, h: 127 }, fx('rise', 0.5)) : '';
    return `${row(TITLE_Y, card({ text: seg.question, tone: 'orange', size: 'md', fx: 'pop', at: 0.3 }))}
    ${blk}${opts}`;
  },

  quizSpeed: (L, seg) => {
    const blks = { A: BLK(51), B: BLK(52), C: BLK(53) };
    const lanes = seg.opts.map((o, i) => {
      const y = 352 + i * 130;   // 三條跑道的中間（x 860~1060）是空的，等待鐘會蓋在這裡
      const b = fit(blks[o.k], { maxW: 190, maxH: 76, cx: 770, cy: y + 52 });
      return note('', `position:absolute;left:600px;top:${y}px;width:720px;height:108px;visibility:hidden`, `id="qs-opt${o.k}" ${fx('pop', 0.8 + i * 0.25)}`)
        + `<div ${fx('pop', 0.9 + i * 0.25)} class="optlab" style="position:absolute;left:586px;top:${y - 18}px">${o.k}</div>`
        + place(blks[o.k], { x: b.x - 40, y: b.y, w: b.w, h: b.h }, fx('pop', 0.9 + i * 0.25))
        + snowImg(78, `position:absolute;left:1075px;top:${y + 16}px`, `id="qs-snow${o.k}" ${fx('pop', 1.0 + i * 0.25)}`)
        + `<span id="qs-opt${o.k}-tick" class="tick" style="position:absolute;left:1292px;top:${y - 22}px;visibility:hidden"></span>`;
    }).join('');
    return `${row(TITLE_Y, card({ text: seg.question, tone: 'orange', size: 'md', fx: 'pop', at: 0.3 }))}${lanes}`;
  },

  saveAs: (L, seg) => {
    const cp = cropPlace(IMG(17), [0, 0, 42, 40], { maxW: 800, maxH: MAX_H - 24 }, fx('pop', 0.2));
    return `${titles(L, [seg.id === 's08'
      ? { kw: '清楚的名字', text: `專題名稱要${hi('清楚', 'white')}` } : { kw: '取得清楚', text: `名字：${hi('雪人', 'white')}` }])}
    ${cp.html}
    ${guides(L, cp.rect, [
      { kw: 'File', k: 'circle', box: cp.map([8, 6.5, 5, 4.5]), off: 0.35, pad: 10 },
      { kw: 'Save as', k: 'circle', box: cp.map([7.5, 20, 12.5, 4]), off: 1.6, pad: 10 },
    ])}`;
  },

  families: (L, seg) => {
    const bar = { x: 430, y: 346, w: 56, h: 380 };
    const order = ['Motion', 'Looks', 'Sound', 'Events', 'Control', 'Sensing', 'Operators', 'Variables', 'My Blocks'];
    const ys = [3.9, 14.9, 26, 37, 48, 59, 70, 81, 92];
    const plan = { s09: [['Motion', '動作'], ['Looks', '外觀'], ['Sound', '音效']], s10: [['Events', '事件'], ['Control', '控制']],
      s11: [['Sensing', '偵測'], ['Operators', '運算'], ['Variables', '變數'], ['My Blocks', '函式']] }[seg.id];
    const kwOf = (zh) => (seg.id === 's09' && zh === '動作') ? '藍色的，叫動作' : `是${zh}`;
    let html = place([IMG(18)[0]], bar, fx('pop', 0.2));
    const gl = [];
    html += `<div style="position:absolute;left:640px;top:340px;display:flex;flex-direction:column;gap:26px;align-items:flex-start">`;
    plan.forEach(([name, zh]) => {
      html += famCard(name, say(L, kwOf(zh)).rel + 0.2);
      gl.push({ kw: kwOf(zh), k: 'arrow', at: [118, ys[order.indexOf(name)]], dir: 'left', off: 0.3, len: 90 });
    });
    html += '</div>' + guides(L, bar, gl);
    if (seg.id === 's11') html += titles(L, [{ kw: '不用喔', text: `今天只用 ${hi('4', 'white')} 個家族`, tone: 'green' }]);
    return html;
  },

  // ---------- 第二章 ----------
  title2: (L) => `
    ${titles(L, [{ kw: '小小繪畫家', text: '小小繪畫家', size: 'lg' }, { kw: '新增角色', text: '新增、刪除角色', tone: 'blue' }, { kw: '繪畫工具', text: '用繪畫工具畫雪人', tone: 'green' }])}
    ${art(IMG(19)[0], 330, 330, 'position:absolute;left:795px;top:370px', fx('pop', 0.3))}`,

  spriteInfo: (L, seg) => {
    const r = fit(IMG(21), { maxW: 700, maxH: MAX_H - 24 });
    const items = seg.id === 's13'
      ? [{ kw: '角色的名字', k: 'circle', box: [19, 8, 36, 14] }, { kw: 'x 和 y', k: 'circle', box: [60, 8, 36, 14] }]
      : [{ kw: '眼睛打開', k: 'circle', box: [5, 25, 21, 14] }, { kw: 'Size 是大小', k: 'circle', box: [37, 25, 20, 14] },
         { kw: 'Direction 是方向', k: 'circle', box: [75, 25, 21, 14] }, { kw: '垃圾桶', k: 'circle', box: [17, 40, 11, 17] }];
    const tt = seg.id === 's13' ? [{ kw: 'x 是左右', text: 'x 左右　y 上下' }] : [{ kw: 'Size 是大小', text: '大小 100 ＝ 原來的大小' }];
    return `${titles(L, tt)}${framed(IMG(21), r, fx('pop', 0.2))}${guides(L, r, items)}`;
  },

  addSprite: (L) => {
    const r = fit(IMG(22), { maxW: 740, maxH: 330, cx: 1010, cy: 500 });
    const btn = [[89.5, 9, '上傳', '最上面是上傳'], [89.5, 27.5, '隨機', '閃閃發亮'], [89.5, 46.5, '繪製', '畫筆是繪製'], [89.5, 63, '選擇', '放大鏡是選擇']];
    const labels = btn.map(([x, y, text, kw]) => {
      const p = { x: Math.round(r.x + r.w * (x - 14) / 100), y: Math.round(r.y + r.h * y / 100) };
      return `<div style="position:absolute;left:${p.x - 180}px;top:${p.y - 26}px;width:180px;display:flex;justify-content:flex-end">${card({ text, tone: 'orange', size: 'sm', fx: 'pop', at: say(L, kw).rel + 0.3 })}</div>`;
    }).join('');
    return `${titles(L, [{ kw: '沒錯，等一下', text: `要畫自己的角色：按${hi('畫筆', 'white')}`, tone: 'green' }])}
    ${framed(IMG(22), r, fx('pop', 0.2))}${labels}
    ${guides(L, r, [{ kw: '右下角這顆按鈕', k: 'circle', box: [82, 71, 16, 28] }, ...btn.map(([x, y, , kw]) => ({ kw, k: 'circle', box: [x - 5, y - 6.5, 10, 13] }))])}`;
  },

  addBackdrop: (L) => {
    const r = fit(IMG(24), { maxW: 740, maxH: 280, cx: 960, cy: 485 });
    return `${titles(L, [{ kw: '角色是演員', text: '角色是演員，背景是布景' }])}
    ${framed(IMG(24), r, fx('pop', 0.2))}
    ${guides(L, r, [{ kw: '背景的按鈕', k: 'circle', box: [84, 71, 16, 27] }, { kw: '也有上傳', k: 'circle', box: [88, 3, 8, 70], off: 0.2 }])}
    ${row(655, `${note(`<b class="big">演員</b><span>＝ 角色</span>`, 'width:260px;height:100px;flex-direction:row;gap:14px;visibility:hidden', fx('pop', say(L, '角色是演員').rel + 0.2))}
                ${note(`<b class="big">布景</b><span>＝ 背景</span>`, 'width:260px;height:100px;flex-direction:row;gap:14px;visibility:hidden', fx('pop', say(L, '角色是演員').rel + 0.9))}`, 'gap:50px')}`;
  },

  rightClick: (L) => {
    const r = fit(IMG(27), { maxW: 600, maxH: MAX_H - 24 });
    return `${titles(L, [{ kw: '影印機', text: '複製 ＝ 影印機' }])}${framed(IMG(27), r, fx('pop', 0.2))}
    ${guides(L, r, [{ kw: 'duplicate，是複製', k: 'circle', box: [12, 24, 22, 12] }, { kw: 'export，是把', k: 'circle', box: [12, 38, 18, 11] },
      { kw: 'delete，是刪除', k: 'circle', box: [12, 52, 18, 12] }])}`;
  },

  costumes: (L) => {
    const r = fit(IMG(28), { maxW: 420, maxH: MAX_H - 24, cx: 760 });
    return `${titles(L, [{ kw: '翻書動畫', text: `造型就是動畫的${hi('每一格', 'white')}`, tone: 'blue' }])}${framed(IMG(28), r, fx('pop', 0.2))}
    ${guides(L, r, [{ kw: '點上面的 Costumes', k: 'circle', box: [15, 0.5, 18, 6] }, { kw: '兩個造型', k: 'circle', box: [4, 7, 15, 27] }])}
    ${note(`<b class="big">翻書動畫</b><span>一頁一頁快快翻</span>`, 'position:absolute;left:1060px;top:450px;width:340px;height:160px;visibility:hidden', fx('pop', say(L, '翻書動畫').rel + 0.2))}`;
  },

  // ---------- 第三章 ----------
  openPaint: (L) => {
    const r1 = fit(IMG(22), { maxW: 660, maxH: 330 });
    const r2_ = fit(IMG(32), { maxW: 560, maxH: MAX_H - 24 });
    return `${titles(L, [{ kw: '按角色按鈕', text: `按${hi('畫筆', 'white')}，打開畫布`, tone: 'green' }])}
    <div id="op-a">${framed(IMG(22), r1, fx('pop', 0.2))}${guides(L, r1, [{ kw: '畫筆', k: 'circle', box: [84, 38, 10, 16] }])}</div>
    ${framed(IMG(32), r2_, fx('pop', say(L, '畫布就打開').rel + 0.2))}`;
  },

  paintTop: (L, seg) => {
    const r = fit(IMG(29), { maxW: 900, maxH: 170, cy: 430 });
    const items = seg.id === 's20'
      ? [{ kw: 'Fill 和 Outline', k: 'circle', box: [2, 52, 38, 28] }, { kw: 'Fill 是填滿', k: 'circle', box: [2, 52, 14, 28] },
         { kw: 'Outline 是外框', k: 'circle', box: [20, 52, 17, 28] }, { kw: '旁邊的數字', k: 'circle', box: [32, 50, 11, 32] }]
      : [{ kw: 'Copy 和 Paste', k: 'circle', box: [42, 48, 22, 44] }, { kw: 'Group 是', k: 'circle', box: [43, 12, 20, 44] },
         { kw: 'Forward，是', k: 'circle', box: [62, 12, 14, 44] }, { kw: 'Backward，是', k: 'circle', box: [71, 12, 14, 44] },
         { kw: '最後 Flip', k: 'circle', box: [74, 48, 25, 44] }, { kw: '按 Front', k: 'circle', box: [84, 12, 14, 44] }];
    const demo = seg.id === 's20'
      ? row(545, [['Fill 填滿', 'dot-fill', 'Fill 是填滿'], ['Outline 外框', 'dot-outline', 'Outline 是外框'], ['粗細＝數字', 'dot-thick', '旁邊的數字']].map(([lab, cls, kw]) =>
          note(`<div class="dot ${cls}"></div><b>${lab}</b>`, 'width:240px;height:190px;visibility:hidden', fx('pop', say(L, kw).rel + 0.3))).join(''), 'gap:30px')
      : row(545, [['頭', 'l1', '帽子被頭蓋住'], ['帽子', 'l2', '把帽子往前']].map(([lab, cls, kw]) =>
          note(`<div class="layer ${cls}">${lab}</div><b>${cls === 'l2' ? '按 Front 移到最前面' : '帽子被蓋住了'}</b>`, 'width:320px;height:190px;visibility:hidden', fx('pop', say(L, kw).rel + 0.3))).join(''), 'gap:30px');
    return `${framed(IMG(29), r, fx('pop', 0.2))}${guides(L, r, items)}${demo}`;
  },

  paintTools: (L) => {
    const r = fit(IMG(30), { maxW: 230, maxH: MAX_H - 24, cx: 620 });
    const lab = [['選取', '搬東西', '第一個是選取', 22, 10], ['畫圓', '頭和身體', '第二個是畫圓', 79, 67], ['畫線', '手', '第三個是畫線', 22, 67],
      ['畫矩形', '帽子', '第四個是畫矩形', 22, 86], ['塑型', '改成尖尖的', '第五個是塑型', 79, 10]];
    return `${framed(IMG(30), r, fx('pop', 0.2))}
    <div style="position:absolute;left:820px;top:356px;display:flex;flex-direction:column;gap:14px;align-items:flex-start">
      ${lab.map(([n, sub, kw]) => card({ text: `${n}　${sub}`, tone: 'orange', size: 'sm', fx: 'pop', at: say(L, kw).rel + 0.3 })).join('')}
    </div>
    ${guides(L, r, lab.map(([, , kw, x, y]) => ({ kw, k: 'circle', box: [x - 22, y - 6, 44, 12] })))}`;
  },

  snowmanGoal: (L) => {
    const r = fit(IMG(31), { maxW: 540, maxH: MAX_H - 24, cx: 720 });
    return `${framed(IMG(31), r, fx('pop', 0.2))}
    ${guides(L, r, [
      { kw: '有頭、有身體', k: 'circle', box: [37, 13, 26, 28] }, { kw: '黑黑的眼睛', k: 'circle', box: [40, 5, 20, 24] },
      { kw: '第一步畫頭', k: 'circle', box: [37, 14, 26, 26], off: 0.2 }, { kw: '第二步畫身體', k: 'circle', box: [14, 29, 74, 68], off: 1.5 },
      { kw: '第三步，畫帽子', k: 'circle', box: [40, 5, 20, 24] },
    ])}
    <div style="position:absolute;left:1080px;top:380px;display:flex;flex-direction:column;gap:22px;align-items:flex-start">
      ${[['1', '畫頭', '第一步畫頭', 0.2], ['2', '身體和手', '第二步畫身體', 1.5], ['3', '帽子和眼睛', '第三步，畫帽子', 0.2]].map(([n, s, kw, o]) =>
        card({ text: s, icon: `<b class="stepno">${n}</b>`, tone: 'blue', size: 'sm', fx: 'pop', at: say(L, kw).rel + o })).join('')}
    </div>`;
  },

  demoClip: (L, seg) => {
    const clip = CLIPS[seg.id];
    const vw = 500, vh = Math.round(vw * clip.h / clip.w);
    const startRel = LEAD, dur = r2(seg.dur - startRel - TAIL);
    clipPlan.push({ id: seg.id, src: seg.clip.src, from: clip.from, to: clip.to, need: dur });
    const toolImg = { circle: IMG(33), select: IMG(34), line: IMG(36), rect: IMG(38), reshape: IMG(37) };
    const chips = {
      d03: [['circle', '畫圓工具', '先選畫圓工具'], ['select', '選取工具', '換選取工具']],
      d04: [['circle', '畫圓工具', '一樣用畫圓工具'], ['line', '畫線工具', '再選畫線工具']],
      d05: [['circle', '畫圓工具', '眼睛用畫圓工具'], ['rect', '畫矩形工具', '畫矩形工具，畫一個'], ['reshape', '塑型工具', '換成塑型工具']],
    }[seg.id];
    return `
    ${seg.caption ? row(TITLE_Y, card({ text: seg.caption, tone: 'orange', size: 'md', fx: 'pop', at: 0.4 })) : ''}
    <div style="position:absolute;left:360px;top:380px;display:flex;flex-direction:column;gap:20px">
      ${chips.map(([k, name, kw]) => card({ text: name, icon: art(toolImg[k][0], 48, 48, 'border-radius:8px'), tone: 'blue', size: 'sm', fx: 'pop', at: say(L, kw).rel + 0.2 })).join('')}
    </div>
    <div ${fx('pop', 0.2)} class="sketch paper" style="position:absolute;left:${960 - vw / 2 + 120 - 14}px;top:${MID.cy - vh / 2 - 14}px;width:${vw + 28}px;height:${vh + 28}px;visibility:hidden">
      <video id="${seg.id}-vid" class="clip" data-start="${f2(seg.start + startRel)}" data-duration="${f2(dur)}" data-track-index="2"
        src="${A}/clip-${seg.id}.mp4" muted style="position:absolute;left:14px;top:14px;display:block;width:${vw}px;height:${vh}px;object-fit:cover;border-radius:6px"></video>
    </div>`;
  },

  undo: (L) => {
    const r = fit(IMG(32), { maxW: 540, maxH: MAX_H - 24, cx: 1150 });
    return `${titles(L, [{ kw: '畫錯很正常', text: `畫錯很${hi('正常', 'white')}，回上一步就好`, tone: 'blue' }])}
    ${framed(IMG(32), r, fx('pop', 0.2))}
    ${note(`<div class="shape egg"></div><b>橫的比直的長 → 變成蛋</b>`, 'position:absolute;left:380px;top:356px;width:420px;height:170px;visibility:hidden', fx('pop', 0.4))}
    ${note(`<div class="shape ring"></div><b>橫直一樣長 → 圓</b>`, 'position:absolute;left:380px;top:550px;width:420px;height:180px;visibility:hidden', fx('pop', say(L, '橫的和直的').rel + 0.3))}
    ${guides(L, r, [{ kw: '回上一步箭頭', k: 'circle', box: [29, 4, 13, 6] }])}`;
  },

  fillOutline: (L) => `
    ${row(TITLE_Y, card({ text: `只改 ${hi('Fill', 'white')} 會怎樣？`, tone: 'blue', size: 'md', fx: 'pop', at: 0.3 }))}
    ${row(352, [['原本', 'dot-base', 0.8], ['只改 Fill', 'dot-fill', say(L, '變成藍色的是圓圈的裡面').rel + 0.3], ['只改 Outline', 'dot-outline', say(L, '想改外框的顏色').rel + 0.3]].map(([lab, cls, at]) =>
      note(`<div class="dot ${cls}"></div><b>${lab}</b>`, 'width:240px;height:210px;visibility:hidden', fx('pop', at))).join(''), 'gap:30px')}
    ${row(620, card({ text: 'Fill 管裡面，Outline 管邊線', tone: 'green', size: 'md', fx: 'stamp', at: say(L, '一個管裡面').rel + 0.3 }))}`,

  // ---------- 第四章 ----------
  loopIntro: (L) => {
    const r = fit(IMG(40), { maxW: 520, maxH: MAX_H - 24 });
    const tOut = r2(say(L, '一直向前走').rel);
    const chip = (inner, label, off) => card({ text: label, icon: inner, tone: 'blue', size: 'md', fx: 'pop', at: say(L, '起床、吃早餐').rel + off, out: 'fadeOut', outAt: tOut });
    return `
    ${titles(L, [{ kw: '就叫迴圈', text: `一樣的事情，一直${hi('重複', 'white')}` }])}
    ${row(356, chip(art(SPRITE.bell, 54, 54), '起床', 0.2) + chip(art(SPRITE.bread, 54, 54), '吃早餐', 0.7) + chip('<div class="brush"></div>', '刷牙', 1.2), 'gap:26px')}
    ${row(500, `<div ${fx('pop', say(L, '起床、吃早餐').rel + 1.8)} ${fxOut('fadeOut', tOut)}>${loopArrow(150, 'li-arrow')}</div>`)}
    ${framed(IMG(40), r, fx('pop', say(L, '一直向前走').rel + 0.2))}`;
  },

  loopTypes: (L) => `
    <div style="position:absolute;left:620px;top:360px;width:340px;display:flex;flex-direction:column;align-items:center;gap:26px">
      ${block('control/control_repeat', 0.8, fx('rise', say(L, '第一種').rel + 0.2))}
      ${card({ text: `${hi('有限')}：重複十次`, tone: 'blue', size: 'sm', fx: 'pop', at: say(L, '第一種').rel + 0.7 })}
    </div>
    <div style="position:absolute;left:980px;top:360px;width:340px;display:flex;flex-direction:column;align-items:center;gap:26px">
      ${block('control/control_forever', 0.8, fx('rise', say(L, '第二種').rel + 0.2))}
      ${card({ text: `${hi('無限')}：永遠不停`, tone: 'orange', size: 'sm', fx: 'pop', at: say(L, '第二種').rel + 0.7 })}
    </div>`,

  rotation: (L, seg) => {
    const cfg = {
      s28: { rot: 'leftright', pics: [[CAT(42), '往右走，臉朝右'], [CAT(43), '往左走，臉朝左']] },
      s29: { rot: 'dontrotate', pics: [[CAT(42), '往左走，臉還是朝右']] },
      s30: { rot: 'allaround', pics: [[CAT(45), '往左走，頭朝下']] },
    }[seg.id];
    const rb = fit(ROT(cfg.rot), { maxW: 480, maxH: 100, cy: 392 });
    const kw = seg.id === 's28' ? '往右走，臉朝右' : seg.id === 's29' ? '倒退走' : '頭朝下了';
    const pics = cfg.pics.map(([im, cap], i) => {
      const x = cfg.pics.length === 1 ? 960 : 790 + i * 360;
      const at = r2(say(L, kw).rel + (seg.id === 's28' && i === 1 ? 1.5 : 0.3));
      return note(`<div style="width:190px;height:190px;background:url('${im[0]}') center/contain no-repeat"></div><b>${cap}</b>`,
        `position:absolute;left:${x - 170}px;top:452px;width:340px;height:280px;visibility:hidden`, fx(seg.id === 's30' ? 'stamp' : 'pop', at));
    }).join('');
    return `${place(ROT(cfg.rot), rb, fx('rise', 0.4))}${pics}
    ${seg.id === 's30' ? `<div ${fx('pop', say(L, '猜猜看').rel + 0.3)} class="qmark" style="position:absolute;left:1180px;top:430px">？</div>` : ''}`;
  },

  blockIntro: (L, seg) => {
    const k = seg.blockKey;
    const cfg = {
      move10: { svg: 'motion/motion_movesteps', fam: 'Motion', kw: '動作家族', showKw: '第一塊' },
      nextCostume: { svg: 'looks/looks_nextcostume', fam: 'Looks', kw: '外觀家族', showKw: '第二塊' },
      bounce: { svg: 'motion/motion_ifonedgebounce', fam: 'Motion', kw: '動作家族', showKw: '第三塊' },
      forever: { svg: 'control/control_forever', fam: 'Control', kw: '控制家族', showKw: '第四塊' },
      whenFlag: { svg: 'event/event_whenflagclicked', fam: 'Events', kw: '事件家族', showKw: '這塊叫' },
    }[k];
    const showAt = say(L, cfg.showKw).rel + 0.2, famAt = say(L, cfg.kw).rel + 0.2;
    let beside = '', below = '', blockY = 350;
    if (k === 'move10') below = row(560, `<div ${fx('pop', say(L, '每跑一次').rel)}>${stageBox(620, 120, `<div class="ticks"></div>${snowImg(90, 'position:absolute;left:20px;bottom:6px', 'id="mv-snow"')}`)}</div>`);
    else if (k === 'bounce') below = row(560, `<div ${fx('pop', say(L, '走到舞台邊邊').rel)}>${stageBox(620, 120, `<div class="wall"></div>${snowImg(90, 'position:absolute;left:20px;bottom:6px', 'id="bn-snow"')}`)}</div>`);
    else if (k === 'nextCostume') {
      blockY = 336;
      const r = fit(IMG(28), { maxW: 300, maxH: 230, cx: 960, cy: 610 });
      below = framed(IMG(28), r, fx('pop', say(L, '翻到下一頁').rel))
        + guides(L, r, [{ kw: '翻到下一頁', k: 'circle', box: [4, 7, 15, 12], off: 0.1 }, { kw: '換一個造型', k: 'circle', box: [4, 19, 15, 12], off: 0.1 }]);
    } else if (k === 'forever') { blockY = 400; beside = `<div ${fx('pop', say(L, '一張大嘴巴').rel + 0.3)}>${loopArrow(130, 'fv-arrow')}</div>`; }
    else if (k === 'whenFlag') { blockY = 400; beside = `${art(SPRITE.flag, 100, 100, '', fx('pop', say(L, '按下綠旗').rel + 0.3))}${art(SPRITE.bell, 90, 90, '', fx('pop', say(L, '門鈴').rel + 0.2))}`; }
    return `${row(TITLE_Y, famCard(cfg.fam, famAt))}
    ${row(blockY, block(cfg.svg, k === 'nextCostume' ? 1.1 : 1.15, fx('rise', showAt)) + beside, 'gap:40px;align-items:center')}
    ${below}`;
  },

  codeFull: (L) => {
    const r = fit(BLK(47), { maxW: 420, maxH: MAX_H - 8, cx: 690 });
    return `${titles(L, [{ kw: '暫停影片', text: '照著排排看', tone: 'green' }])}
    ${place(BLK(47), r, fx('rise', 0.3), 'filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))')}
    ${note(`${snowImg(150)}<b>排好，按綠旗</b><span>雪人就會走</span>`, 'position:absolute;left:1100px;top:400px;width:300px;height:260px;visibility:hidden', fx('pop', say(L, '暫停影片').rel + 0.3))}
    ${guides(L, r, [
      { kw: '最上面', k: 'circle', box: [0, 3, 59, 17] }, { kw: '下面接 set rotation', k: 'circle', box: [0, 20, 99, 13] },
      { kw: '再放 forever', k: 'circle', box: [0, 34, 99, 58], pad: 20 }, { kw: 'move 十', k: 'circle', box: [7, 47, 61, 16] },
      { kw: '還有 next costume', k: 'circle', box: [7, 63, 46, 13] }, { kw: '最後是 if on edge', k: 'circle', box: [7, 76, 61, 15] },
    ])}`;
  },

  callback: (L) => `
    ${titles(L, [{ kw: '還記得一開始', text: `為什麼你畫好的雪人，怎麼點都${hi('不會動', 'white')}？`, size: 'sm' },
      { kw: '畫圖是做出雪人', text: `畫圖 ＝ 做出雪人　積木 ＝ 叫牠動`, tone: 'green' }])}
    ${snowImg(240, 'position:absolute;left:640px;top:390px', fx('pop', 0.6))}
    <div style="position:absolute;left:1090px;top:380px;display:flex;gap:24px">
      ${note(`${block('motion/motion_movesteps', 0.45)}<b>move</b>`, 'width:240px;height:230px;visibility:hidden', fx('rise', say(L, '因為只畫圖').rel + 0.3))}
      ${note(`${block('control/control_forever', 0.42)}<b>forever</b>`, 'width:240px;height:230px;visibility:hidden', fx('rise', say(L, '還要用 forever').rel + 0.3))}
    </div>`,

  reviewQ: (L, seg) => {
    const imgs = { setRotation: BLK(55), bounce: BLK(56), forever: BLK(49) };
    let blk;
    if (seg.blockKey === 'nextCostume') blk = `<div ${fx('rise', 0.7)}>${block('looks/looks_nextcostume', 0.95)}</div>`;
    else { const r = fit(imgs[seg.blockKey], { maxW: 560, maxH: 125 }); blk = `<div ${fx('rise', 0.7)} style="width:${r.w}px;height:${r.h}px;background:url('${imgs[seg.blockKey][0]}') center/contain no-repeat"></div>`; }
    return `
    ${row(TITLE_Y, `<div ${fx('pop', 0.4)} class="qmark">？</div>`)}
    ${row(340, blk)}
    ${row(640, card({ text: `${seg.answer}<span class="tick" style="display:inline-block;margin-left:12px;vertical-align:middle"></span>`, tone: 'green', size: 'md', fx: 'stamp', at: L[seg.aLine].rel + 0.3 }))}`;
  },

  summary: (L) => {
    const kc = (inner, label, kw) => note(`${inner}<b>${label}</b>`, 'width:290px;height:310px;visibility:hidden', fx('stamp', say(L, kw).rel + 0.2));
    return row(370, `${kc(art(IMG(7)[0], 150, 160), '認識 Scratch', '第一個')}${kc(snowImg(150), '畫出雪人', '第二個')}${kc(block('control/control_forever', 0.5), '讓雪人走', '第三個')}`, 'gap:40px');
  },

  ending: (L) => `
    ${row(238, `<div ${fx('stamp', 0.4)} class="bigtitle">下次見！</div>`)}
    ${snowImg(190, 'position:absolute;left:870px;top:430px', fx('pop', 1.0))}
    ${art(SPRITE.balloon, 90, 120, 'position:absolute;left:680px;top:450px', fx('pop', say(L, '下次見！').rel))}
    ${art(SPRITE.star, 90, 90, 'position:absolute;left:1150px;top:450px', fx('pop', say(L, '拜拜！').rel))}
    ${art(SPRITE.gift, 100, 100, 'position:absolute;left:1070px;top:520px', fx('pop', say(L, '我們下次見').rel))}
    ${row(636, card({ text: '回家做一隻會走路的雪人！', tone: 'orange', size: 'md', fx: 'pop', at: say(L, '回家記得').rel + 0.3 }))}`,
};

// ===== 教案錄影（d03~d05）：要取用的區段（看過影格確認）=====
//   media1 0~15s：畫小圓當頭、用選取工具搬位置；media2 0~24.5s：畫大圓當身體、兩隻手；media3 0~42s：眼睛、帽子
const CLIPS = {
  d03: { from: 0, to: 15, w: 1502, h: 1226 },
  d04: { from: 0, to: 24.5, w: 1522, h: 1236 },
  d05: { from: 0, to: 42, w: 1570, h: 1222 },
};
const clipPlan = [];
const clocks = [];
const shotFades = [];
// 實作示範每一張截圖：crop 是裁切區域、box 是要圈的目標（整張原圖的百分比，用 5% 網格量的）
const STEP_PTS = {
  d01: [{ crop: [0, 22, 60, 44], box: [1, 33, 15, 9] }, { crop: [3, 27, 62, 33], box: [19.5, 47, 10.5, 5.5] }, { crop: [0, 0, 100, 100], maxW: 720 }],
  d02: [{ crop: [0, 0, 45, 30], box: [9.5, 3.5, 6, 5] }, { crop: [40, 38, 45, 30], box: [42, 52, 36, 5] }],
  d06: [{ crop: [50, 5, 50, 45], box: [55.5, 7, 4, 7], pad: 8 }, { crop: [50, 5, 50, 45], box: [61.5, 7, 4, 7], pad: 8 }],
};

// ===== 各段客製動畫 =====
const customJS = (seg) => {
  const S = seg.start, L = seg.L, E = seg.dur;
  const at = (kw, off = 0) => f2(S + say(L, kw).rel + off);
  switch (seg.vis) {
    case 'chapter':
      return `
  tl.fromTo('#${seg.id}-card',{x:-1500},{x:0,duration:0.9,ease:'power3.out'},${f2(S)});
  tl.to('#${seg.id}-card',{x:1500,duration:0.7,ease:'power3.in'},${f2(S + E - 0.8)});`;
    case 'openPaint':
      return `
  tl.to('#op-a',{autoAlpha:0,duration:0.3},${at('畫布就打開', 0.1)});`;
    case 'loopIntro':
      return `
  tl.to('#li-arrow',{rotation:360,transformOrigin:'50% 50%',duration:3.4,ease:'none'},${at('起床、吃早餐', 2.2)});`;
    case 'blockIntro': {
      const k = seg.blockKey;
      if (k === 'move10') return `
  [0,1,2].forEach((i)=>{ tl.to('#mv-snow',{x:'+=70',duration:0.35,ease:'power2.out'},${at('每跑一次', 0.6)}+i*0.7); });
  tl.to('#mv-snow',{x:0,duration:0.4},${at('十步是多遠', 0.2)});`;
      if (k === 'bounce') return `
  tl.to('#bn-snow',{x:430,duration:2.0,ease:'none'},${at('走到舞台邊邊', 0.6)});
  tl.set('#bn-snow',{scaleX:-1},${f2(S + say(L, '走到舞台邊邊').rel + 2.6)});
  tl.to('#bn-snow',{x:20,duration:2.0,ease:'none'},${f2(S + say(L, '走到舞台邊邊').rel + 2.6)});`;
      if (k === 'forever') return `
  tl.to('#fv-arrow',{rotation:360,transformOrigin:'50% 50%',duration:3,ease:'none'},${at('一張大嘴巴', 0.9)});`;
      return '';
    }
    case 'quizSpeed': {
      const a = say(L, '答對了').rel;
      const dist = { A: 16, B: 64, C: 144 };   // 10：40：90 的比例，終點不超出跑道（x≤1320）
      return `${seg.opts.map((o) => `  tl.to('#qs-snow${o.k}',{x:${dist[o.k]},duration:2.4,ease:'power1.inOut'},${f2(S + a - 0.1)});`).join('\n')}
  tl.to(['#qs-optA','#qs-optB'],{opacity:0.45,duration:0.4},${f2(S + a + 2.6)});
  tl.set('#qs-optC-tick',{autoAlpha:1},${f2(S + a + 2.6)});`;
    }
    case 'quizAB': {
      const a = say(L, '答對了').rel;
      const wrong = seg.opts.filter((o) => o.k !== seg.correct).map((o) => `'#${seg.id}-opt${o.k}'`).join(',');
      return `
  tl.to([${wrong}],{opacity:0.35,duration:0.4},${f2(S + a + 0.2)});
  tl.fromTo('#${seg.id}-opt${seg.correct}',{scale:1},{scale:1.1,duration:0.4,ease:'back.out(2)'},${f2(S + a + 0.2)});
  tl.set('#${seg.id}-opt${seg.correct}-tick',{autoAlpha:1},${f2(S + a + 0.3)});`;
    }
    default:
      return '';
  }
};

// ===== 組裝 HTML =====
let clips = '';
const bubbles = [];

for (const seg of SEGS) {
  CUR = seg;
  // 全片都在同一塊黑板上；只有章節卡是整片換底色，讓學生知道換單元了
  const background = seg.chapter
    ? `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#FF9F1C,#FFBF69 55%,#FFD166)"></div><div class="chapstripes"></div>`
    : `<div style="position:absolute;inset:0;background:#1E7A4F url('assets/backgrounds/classroom-board.svg') center/cover no-repeat"></div>`;

  const cooperAction = seg.lines.find((l) => l.who === 'Cooper')?.action ?? 'talking';
  let charClips = seg.chapter ? '' : charClip(`${seg.id}-cooper`, 'Cooper', cooperAction, seg.start, seg.dur, 'left');
  let run = null;
  const runs = [];
  for (const ln of seg.chapter ? [] : seg.L) {
    if (ln.who === 'Cooper') { run = null; continue; }
    if (run && run.who === ln.who && run.action === ln.action) run.end = r2(ln.rel + ln.dur + GAP);
    else { run = { who: ln.who, action: ln.action, start: ln.rel, end: r2(ln.rel + ln.dur + GAP) }; runs.push(run); }
  }
  runs.forEach((r, i) => { charClips += charClip(`${seg.id}-side${i}`, r.who, r.action, r2(seg.start + r.start), r2(r.end - r.start), 'right'); });
  seg.L.forEach((ln, i) => {
    if (!ln.voice) return;
    charClips += `
  <audio id="${seg.id}-v${i}" class="clip" data-start="${f2(seg.start + ln.rel)}" data-duration="${f2(ln.dur)}"
    data-track-index="7" src="${ln.voice}" data-volume="1"></audio>`;
  });

  // 每個停頓都有手繪鬧鐘＋倒數秒數，放在黑板正中央（有停頓的畫面，中間位置都先留空）。
  // 數字不用共用模組的 innerText 動畫：渲染是逐格跳著抓畫面，innerText 補間在跳著抓時會顯示成 0；
  // 改成「每個數字一個元素、到時間才顯示」，不管怎麼抓都是對的。
  const rings = seg.chapter ? '' : seg.L.filter((l) => (l.hold ?? 0) >= 2).map((l, k) => {
    const n = Math.min(5, Math.round(l.hold));
    const id = `${seg.id}-clk${k}`;
    const at = r2(seg.start + l.rel + l.dur - 0.15);
    clocks.push({ id, at, n });
    for (let i = 0; i < n; i++) hit('tick', at - seg.start + 0.4 + i);
    hit('ding', at - seg.start + 0.4 + n);
    return clockHtml(id, n);
  }).join('');

  // 對話框：固定在黑板下緣的字幕帶，尖角朝說話的角色
  const segBubbles = (seg.chapter ? [] : seg.L).map((ln, i) => {
    bubbles.push({ sel: `#${seg.id}-b${i}`, at: r2(seg.start + ln.rel), dur: ln.dur });
    return bubbleHtml(`${seg.id}-b${i}`, { who: ln.who, text: ln.text, color: CHAR_COLORS[ln.who] });
  }).join('');

  if (!V[seg.vis]) throw new Error(`段落 ${seg.id} 的 vis「${seg.vis}」沒有對應的畫面組件`);
  clips += `
  <div id="${seg.id}" class="clip" data-start="${f2(seg.start)}" data-duration="${f2(seg.dur)}" data-track-index="1"
    style="position:absolute;inset:0;width:1920px;height:1080px">
    ${background}
    ${V[seg.vis](seg.L, seg)}
    ${rings}
  </div>${charClips}
  <div id="${seg.id}-bub" class="clip" data-start="${f2(seg.start)}" data-duration="${f2(seg.dur)}" data-track-index="5"
    style="position:absolute;inset:0;width:1920px;height:1080px;pointer-events:none">${segBubbles}</div>`;
}

const shotJS = shotFades.map((s) => `
  tl.set('#${s.id}',{autoAlpha:0},0);
  tl.to('#${s.id}',{autoAlpha:1,duration:.35},${f2(s.at)});
  tl.to('#${s.id}',{autoAlpha:0,duration:.3},${f2(s.until - 0.15)});`).join('\n');
const bubbleJS = bubbles.map((bb) => bubbleTimelineJS(bb, f2)).join('\n');
const charJS = charLayers.map((c) => {
  const reps = Math.max(0, Math.ceil(c.dur / c.cycle) - 1);
  const out = [`  {`, `    const sub = gsap.timeline({ repeat: ${reps} });`];
  out.push(`    sub.set([${[0, 1, 2, 3].map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, 0);`);
  for (const sw of c.switches) {
    const others = [0, 1, 2, 3].filter((i) => i !== sw.k);
    out.push(`    sub.set([${others.map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, ${sw.at});`);
    out.push(`    sub.set('#${c.domId}-k${sw.k}', { autoAlpha: 1 }, ${sw.at});`);
  }
  const first = c.switches[0].k;
  out.push(`    sub.set([${[0, 1, 2, 3].filter((i) => i !== first).map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, ${c.cycle});`);
  out.push(`    sub.set('#${c.domId}-k${first}', { autoAlpha: 1 }, ${c.cycle});`);
  out.push(`    tl.add(sub, ${f2(c.start)});`, `  }`);
  return out.join('\n');
}).join('\n');
const customAll = SEGS.map(customJS).filter(Boolean).join('\n')
  + '\n' + clocks.map((c) => clockTimelineJS(c, f2)).join('\n');

const cues = sfxHits
  .filter((h) => h.at >= 0 && h.at + SFX[h.kind].dur < TOTAL)
  .sort((a, b) => a.at - b.at)
  .map((h) => ({ file: SFX[h.kind].file, vol: SFX[h.kind].vol, at: h.at }));
writeFileSync(fileURLToPath(new URL('sfx-cues.json', import.meta.url)), JSON.stringify({ total: TOTAL, cues }, null, 2));
writeFileSync(fileURLToPath(new URL('clip-plan.json', import.meta.url)), JSON.stringify(clipPlan, null, 2));

// ===== 樣式：手繪紙卡 =====
const CSS = `
      ${FONT_CSS}
      ${CARD_CSS}
      ${POINTER_CSS}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; }
      ${sketchCss()}
      .vis { position: absolute; left: 50%; top: 300px; height: 440px; transform: translateX(-50%); display: flex;
             flex-direction: column; align-items: center; justify-content: center; width: 1120px; }
      .bigtitle { font-size: 126px; font-weight: 900; color: #7A2E00; text-shadow: 0 6px 0 rgba(255,255,255,.5); }
      .qmark { font-size: 110px; font-weight: 900; color: #E8533F; visibility: hidden; }
      .tick, .cross { width: 56px; height: 56px; flex: none; background: center/contain no-repeat; }
      .tick { background-image: url('assets/doodles/tick.svg'); }
      .cross { background-image: url('assets/doodles/cross.svg'); }
      .goalnum { width: 70px; height: 70px; border-radius: 50%; background: #FFB703; color: #fff; font-size: 42px; border: 4px solid ${INK};
                 display: flex; align-items: center; justify-content: center; }
      .goaltxt { font-size: 36px; }
      .optlab { position: absolute; top: -20px; left: -16px; width: 58px; height: 58px; border-radius: 50%; background: #FFB703;
                color: ${INK}; border: 4px solid ${INK}; font-size: 34px; display: flex; align-items: center; justify-content: center; }
      .opttxt { font-size: 38px; }
      .stepno { width: 40px; height: 40px; border-radius: 50%; background: #fff; color: ${INK}; font-size: 28px; border: 3px solid ${INK};
                display: flex; align-items: center; justify-content: center; }
      .brush { width: 54px; height: 54px; position: relative; }
      .brush::before { content: ""; position: absolute; left: 6px; top: 34px; width: 42px; height: 10px; background: #4C97FF; border-radius: 5px; transform: rotate(-30deg); }
      .brush::after { content: ""; position: absolute; left: 30px; top: 10px; width: 20px; height: 10px; background: #fff; border: 3px solid #999; border-radius: 4px; transform: rotate(-30deg); }

      .fdot { width: 34px; height: 34px; border-radius: 50%; border: 4px solid ${INK}; display: block; }

      /* Fill／Outline／圖層 概念圖（CSS 畫的圓） */
      .dot { width: 110px; height: 110px; border-radius: 50%; }
      .dot-base { background: #fff; border: 8px solid #111; } .dot-fill { background: #2F80ED; border: 8px solid #111; }
      .dot-outline { background: #fff; border: 8px solid #2F80ED; } .dot-thick { background: #fff; border: 18px solid #111; }
      .shape { background: #fff; border: 7px solid #111; flex: none; }
      .egg { width: 120px; height: 76px; border-radius: 50%; } .ring { width: 96px; height: 96px; border-radius: 50%; }
      .layer { width: 130px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
               font-size: 36px; font-weight: 900; color: #fff; border: 4px solid ${INK}; } .layer.l1 { background: #4C97FF; } .layer.l2 { background: #FFB703; color: ${INK}; }
      .stageinner { position: relative; border-radius: 8px; overflow: hidden; background: #fff; }
      .ticks { position: absolute; left: 0; right: 0; bottom: 4px; height: 12px; background: repeating-linear-gradient(90deg, #4C97FF 0 4px, transparent 4px 70px); }
      .wall { position: absolute; right: 0; top: 0; bottom: 0; width: 18px; background: #C68B4E; }
      .demoshot { position: absolute; inset: 0; }

      .chapcard { display: flex; align-items: center; gap: 52px; padding: 56px 90px; --bg: ${PAPER}; }
      .chapnum { width: 170px; height: 170px; border-radius: 40px; background: #FF6B35; color: #fff; font-size: 110px; font-weight: 900;
                 display: flex; align-items: center; justify-content: center; border: 5px solid ${INK}; }
      .chaptxt { font-size: 96px; font-weight: 900; color: ${INK}; white-space: nowrap; }
      .chapstripes { position: absolute; inset: 0; opacity: .18; background: repeating-linear-gradient(115deg, #fff 0 46px, transparent 46px 120px); }
`;

const COMP_ID = '2A1-grade1-3';
const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>${CSS}</style>
  </head>
  <body>
    ${SKETCH_DEFS}
    <div
      id="root"
      data-composition-id="${COMP_ID}"
      data-start="0"
      data-duration="${TOTAL}"
      data-width="1920"
      data-height="1080"
      style="position: relative; width: 1920px; height: 1080px; background: #1E7A4F"
    >
${clips}
      <audio id="bgm" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="8"
        src="${CFG.bgm}" data-volume="0.68"></audio>
      <img id="codepro-watermark" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="9"
        src="assets/codepro_logo_white.webp"
        style="position: absolute; right: 40px; bottom: 40px; width: 160px; height: 50px; opacity: 0.85; z-index: 999" />
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
${shotJS}
${bubbleJS}
${fxRuntimeJS()}
${charJS}
${customAll}
      tl.to('#bgm', { volume: 0, duration: 4 }, ${f2(TOTAL - 4.5)});
      window.__timelines['${COMP_ID}'] = tl;
    <\/script>
  </body>
</html>
`;

writeFileSync(process.argv[2], html);
if (badActions.length) {
  console.error('無效的角色動作：', [...new Set(badActions)].join('、'));
  process.exitCode = 1;
}
const mm = Math.floor(TOTAL / 60), ss = Math.round(TOTAL % 60);
console.log(`總長 ${TOTAL}s（${mm} 分 ${ss} 秒）／ ${SEGS.length} 段 ／ ${bubbles.length} 句對白 ／ ${cues.length} 顆音效`);
