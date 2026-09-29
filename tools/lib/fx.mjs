// 動畫效果註冊表（所有課程共用）
//
// 用法：在課程的 build-composition.mjs 裡
//
//   import { makeFx, fxRuntimeJS } from '../../../tools/lib/fx.mjs';
//   const fx = makeFx(hit);                       // hit 是課程自己的音效登記函式
//   ...
//   <div ${fx('slideL', 1.2)} class="card">左邊滑進來</div>
//   ...
//   ${fxRuntimeJS()}                              // 內嵌進 <script>，runtime 會自動掃描套用
//
// 機制：build 時 fx() 只吐出 data-fx / data-at 兩個屬性並登記音效，
// 真正的 GSAP 動畫是 runtime 掃 [data-fx] 統一套上去的。
// 好處是加一個新效果只要在下面 FX 加一筆，不必動任何課程的版面碼。

// ===== 效果定義 =====
//
// from / to   → tl.fromTo(el, from, to, at)；to 裡放 duration 與 ease
// to only     → tl.to(el, to, at)（離場用，不需要起始狀態）
// then        → 進場後接的持續動作 { at: 延遲秒數, vars: {...} }
// sfx         → 這個效果配哪顆音效（對應 course 的 SFX 表）；null = 無聲
//
// 秒數是刻意調過的：進場 0.5 秒左右最跟得上旁白，超過 0.8 秒會讓畫面拖。
export const FX = {
  // ---- 進場：基本 ----
  fadeIn: {
    sfx: null,
    from: { autoAlpha: 0 },
    to: { autoAlpha: 1, duration: 0.5, ease: 'power1.out' },
  },
  pop: {
    sfx: 'pop',
    from: { autoAlpha: 0, scale: 0.3 },
    to: { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' },
  },
  zoomIn: {
    sfx: 'pop',
    from: { autoAlpha: 0, scale: 0.55 },
    to: { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' },
  },

  // ---- 進場：方向性 ----
  // x 用 120px：1920 畫布下再小就看不出「滑」的方向感，再大會晚到、跟不上旁白
  slideL: {   // 從左邊滑進來（往右移動）
    sfx: 'swoosh',
    from: { autoAlpha: 0, x: -120 },
    to: { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' },
  },
  slideR: {   // 從右邊滑進來（往左移動）
    sfx: 'swoosh',
    from: { autoAlpha: 0, x: 120 },
    to: { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' },
  },
  rise: {     // 從下方升起
    sfx: 'swoosh',
    from: { autoAlpha: 0, y: 46 },
    to: { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
  },
  drop: {     // 從上方落下
    sfx: 'swoosh',
    from: { autoAlpha: 0, y: -60 },
    to: { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
  },

  // ---- 進場：有個性的 ----
  bounce: {   // 真的彈跳：落下後彈兩下才停（bounce.out 自帶回彈，不要再加 then）
    sfx: 'pop',
    from: { autoAlpha: 0, y: -140 },
    to: { autoAlpha: 1, y: 0, duration: 0.9, ease: 'bounce.out' },
  },
  stamp: {    // 蓋章：由大縮到定位，power4.in 才有「砸下去」的力道
    sfx: 'ding',
    from: { autoAlpha: 0, scale: 2.6 },
    to: { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power4.in' },
  },
  flip: {     // 翻牌
    sfx: 'pop',
    from: { autoAlpha: 0, rotationY: 90 },
    to: { autoAlpha: 1, rotationY: 0, duration: 0.55, ease: 'back.out(1.6)' },
  },

  // ---- 進場 + 持續：用來抓住注意力 ----
  float: {    // 進場後上下漂浮
    sfx: 'magic',
    from: { autoAlpha: 0, y: 60 },
    to: { autoAlpha: 1, y: 0, duration: 0.6, ease: 'back.out(2)' },
    then: { at: 0.7, vars: { y: -18, duration: 0.9, yoyo: true, repeat: 3, ease: 'sine.inOut' } },
  },
  twinkle: {  // 進場後左右搖擺（星星、獎勵）
    sfx: 'magic',
    from: { autoAlpha: 0, scale: 0.2, rotation: -30 },
    to: { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' },
    then: { at: 0.6, vars: { rotation: 18, duration: 0.5, yoyo: true, repeat: 3 } },
  },
  qmark: {    // 問號跳動（提問時）
    sfx: 'question',
    from: { autoAlpha: 0, y: 60, scale: 0.4 },
    to: { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' },
    then: { at: 0.7, vars: { y: -14, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' } },
  },
  shake: {    // 進場後左右晃（警告、「不可以這樣」）
    sfx: 'question',
    from: { autoAlpha: 0, scale: 0.6 },
    to: { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' },
    then: { at: 0.4, vars: { x: 14, duration: 0.07, yoyo: true, repeat: 7, ease: 'none' } },
  },
  pulse: {    // 進場後放大縮小強調（重點數字）
    sfx: 'ding',
    from: { autoAlpha: 0, scale: 0.5 },
    to: { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' },
    then: { at: 0.6, vars: { scale: 1.12, duration: 0.45, yoyo: true, repeat: 3, ease: 'sine.inOut' } },
  },

  // ---- 進場：SVG 線條「畫出來」 ----
  // 給圈選、底線這類引導線用。元素要是 SVG 的 path/ellipse/line，
  // 且帶 pathLength="1000"（長度正規化，這樣不管線多長，dashoffset 都是 1000→0）。
  //
  // 為什麼是 1000 而不是 1：GSAP 算出的 px 值會被四捨五入成整數，
  // 用 1 的話中間只有 0 和 1 兩格，線會用「閃現」的方式出現而不是畫出來。
  draw: {
    sfx: 'swoosh',
    from: { autoAlpha: 1, strokeDashoffset: 1000 },
    to: { autoAlpha: 1, strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' },
  },

  // ---- 離場（要用 fxOut()，不是 fx()）----
  // 只有 to，沒有 from：離場是從「現在的樣子」出發，寫 from 會讓元素先跳一下。
  // 元素預設是隱藏的（等進場動畫喚醒），所以離場一定要搭配一個進場效果，
  // 否則等於對一個看不見的東西做淡出——畫面上什麼都不會發生。
  fadeOut: {
    exit: true, sfx: null,
    to: { autoAlpha: 0, duration: 0.5, ease: 'power1.in' },
  },
  slideOutL: {
    exit: true, sfx: 'swoosh',
    to: { autoAlpha: 0, x: -120, duration: 0.45, ease: 'power2.in' },
  },
  slideOutR: {
    exit: true, sfx: 'swoosh',
    to: { autoAlpha: 0, x: 120, duration: 0.45, ease: 'power2.in' },
  },
  popOut: {
    exit: true, sfx: null,
    to: { autoAlpha: 0, scale: 0.4, duration: 0.35, ease: 'back.in(2)' },
  },

  // ---- 特殊：倒數 ----
  // 元素裡要有一個 .cdnum 來顯示數字。滴答聲逐秒登記，數完補一聲鈴。
  countdown: { sfx: null, countdown: 5 },
  countdown4: { sfx: null, countdown: 4 },
  countdown3: { sfx: null, countdown: 3 },
  countdown2: { sfx: null, countdown: 2 },
};

/** 可以當進場用的效果名稱 */
export const entrances = () => Object.keys(FX).filter((k) => !FX[k].exit);
/** 只能當離場用的效果名稱 */
export const exits = () => Object.keys(FX).filter((k) => FX[k].exit);

/**
 * 產生課程用的 fx()。
 *
 * @param hit (kind, at) => void —— 課程自己的音效登記函式（時間是「相對段落開頭」）。
 *            傳 null 就只出屬性、不配音效。
 * @returns (type, at, extra?) => string —— 貼進 HTML 標籤的屬性字串
 */
export const makeFx = (hit) => (type, at, extra = '') => {
  const def = FX[type];
  // 打錯效果名稱的後果是那個元素永遠停在 autoAlpha:0（畫面開天窗），
  // 而且不會有任何錯誤訊息。所以這裡直接擋下來。
  if (!def) throw new Error(`未知的動畫效果：${type}\n可用：${entrances().join('、')}`);
  if (def.exit) throw new Error(`${type} 是離場效果，要用 fxOut() 而不是 fx()。\n只用離場的元素永遠不會出現（它從隱藏狀態開始）。`);
  if (hit) {
    if (def.countdown) {
      for (let i = 0; i < def.countdown; i++) hit('tick', at + 0.4 + i);
      hit('ding', at + 0.4 + def.countdown);
    } else if (def.sfx) {
      hit(def.sfx, at);
    }
  }
  return `data-fx="${type}" data-at="${at.toFixed(2)}" ${extra}`;
};

/**
 * 產生課程用的 fxOut()——讓元素在指定時間離場。
 * 跟 fx() 貼在同一個標籤上：`<div ${fx('slideL', 1)} ${fxOut('fadeOut', 6)}>`
 */
export const makeFxOut = (hit) => (type, at) => {
  const def = FX[type];
  if (!def) throw new Error(`未知的離場效果：${type}\n可用：${exits().join('、')}`);
  if (!def.exit) throw new Error(`${type} 是進場效果，要用 fx() 而不是 fxOut()。`);
  if (hit && def.sfx) hit(def.sfx, at);
  return `data-fxout="${type}" data-atout="${at.toFixed(2)}"`;
};

/**
 * 產生 runtime 要內嵌的掃描程式碼。放進 composition 的 <script> 裡，
 * 位置要在 `const tl = gsap.timeline(...)` 之後。
 */
export const fxRuntimeJS = () => {
  const defs = {};
  for (const [name, d] of Object.entries(FX)) {
    defs[name] = { from: d.from, to: d.to, then: d.then, countdown: d.countdown };
  }
  return `
      // ===== 動畫效果（由 tools/lib/fx.mjs 產生，不要手改）=====
      const FX_DEFS = ${JSON.stringify(defs)};
      document.querySelectorAll('[data-fx]').forEach((el) => {
        const seg = el.closest('.clip');
        const at = parseFloat(seg.dataset.start) + parseFloat(el.dataset.at);
        const d = FX_DEFS[el.dataset.fx];
        if (!d) { console.warn('未知的 fx：' + el.dataset.fx); return; }
        if (d.countdown) {
          const n = d.countdown;
          const num = el.querySelector('.cdnum');
          tl.fromTo(el, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, at);
          for (let i = 0; i < n; i++) {
            tl.set(num, { innerText: String(n - i) }, at + 0.4 + i);
            tl.fromTo(num, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, at + 0.4 + i);
          }
          tl.to(el, { autoAlpha: 0, duration: 0.3 }, at + 0.4 + n);
          tl.set(el, { autoAlpha: 0 }, at + 0.8 + n);
          return;
        }
        // vars 物件一定要展開再傳：GSAP 會就地改寫傳進去的 vars，
        // 同一個效果用在第二個元素時就會拿到被汙染的參數。
        if (d.from) tl.fromTo(el, { ...d.from }, { ...d.to }, at);
        else tl.to(el, { ...d.to }, at);
        if (d.then) tl.to(el, { ...d.then.vars }, at + d.then.at);
      });
      // 離場：跑在進場之後，讓同一個元素能先進場、停一段、再離場
      document.querySelectorAll('[data-fxout]').forEach((el) => {
        const seg = el.closest('.clip');
        const at = parseFloat(seg.dataset.start) + parseFloat(el.dataset.atout);
        const d = FX_DEFS[el.dataset.fxout];
        if (!d) { console.warn('未知的 fxout：' + el.dataset.fxout); return; }
        tl.to(el, { ...d.to }, at);
      });`;
};
