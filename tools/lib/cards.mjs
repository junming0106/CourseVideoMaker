// 字卡樣式（所有課程共用）
//
// 用法：在課程的 build-composition.mjs 裡
//
//   import { makeFx, makeFxOut, fxRuntimeJS } from '../../../tools/lib/fx.mjs';
//   import { makeCard, CARD_CSS } from '../../../tools/lib/cards.mjs';
//   const fx = makeFx(hit), fxOut = makeFxOut(hit);
//   const card = makeCard(fx, fxOut);
//   ...
//   ${card({ text: '變數就是一個箱子', tone: 'orange', size: 'lg', fx: 'bounce', at: 1.2 })}
//   ${card({ text: '小心！這裡最容易錯', tone: 'red', fx: 'shake', at: 3.0 })}
//   ${card({ text: '按下綠旗', shape: 'text', size: 'xl', fx: 'pop', at: 5, out: 'fadeOut', outAt: 9 })}
//   ...
//   <style>${CARD_CSS}</style>
//
// 兩種形態：
//   shape: 'box'   實心方塊 + 白色粗框（預設）。適合一句完整的說明。
//   shape: 'text'  只有字，字身自帶白色描邊。適合疊在畫面上的短標、狀聲詞、關鍵詞，
//                  不會像方塊那樣把底下的操作畫面遮掉一大塊。
//
// 白框／白邊都是為了讓字在任何背景上都跳出來——教學影片的底常常是彩色的
// Scratch 舞台或教室背景，沒有白邊會糊在一起。
//
// 句內關鍵字用 hi()：
//   card({ text: `為什麼你背了 ${hi('一百個單字')}，隔天就忘光？`, tone: 'red', size: 'lg', fx: 'shake', at: 0 })

/**
 * 全片字型。放進 composition 的 <style> 最前面。
 *
 * 只用圓體與黑體，字重一律 800 以上。
 * **不要用新細明體、標楷體、細明體** —— 明體的橫細直粗在 1080p 上會斷筆畫，
 * 楷體的手寫感在螢幕上讀起來像公文，兩者學生都不買單。
 *
 * @font-face 的 local() 不是裝飾——沒有它 hyperframes lint 會報
 * font_family_without_font_face（系統字型要顯式宣告才不會在 render 環境掉字）。
 */
export const FONT_CSS = `
      @font-face { font-family: "Yuanti TC"; src: local("Yuanti TC"); }
      @font-face { font-family: "PingFang TC"; src: local("PingFang TC"); }
      @font-face { font-family: "Noto Sans TC"; src: local("Noto Sans TC"); }
      body { font-family: "Yuanti TC", "PingFang TC", "Noto Sans TC", sans-serif; font-weight: 800; }
`;

/** 關鍵字強調的預設值。整片想統一調就改這裡，不用每一句傳參數。 */
export const HI_DEFAULT = { color: 'yellow', scale: 1.22, weight: 900 };

/** 關鍵字可用的顏色。跟 TONES 分開，因為它要跟卡片底色對比，不是同一組用途。 */
export const HL = {
  yellow: '#FFE066',
  white:  '#FFFFFF',
  red:    '#FF4D6D',
  orange: '#FF9F1C',
  green:  '#5BE49B',
  navy:   '#1B2A5B',   // 黃底卡片上唯一讀得清楚的強調色
};

/**
 * 句內關鍵字強調：放大 + 換色。
 * 一句話裡最多標一個詞——標兩個以上等於沒標。
 *
 *   hi('迴圈')                                  預設（黃、放大 22%）
 *   hi('迴圈', 'red')                           換成表列色
 *   hi('迴圈', '#FF00AA')                       任意色碼
 *   hi('迴圈', { scale: 1.6 })                  只調大小
 *   hi('迴圈', { color: 'red', scale: 1.6, weight: 900, stroke: 4 })
 *
 * @param text 要強調的字
 * @param opt  顏色名／色碼，或 { color, scale, weight, stroke }
 *             scale  放大倍率（相對於周圍的字）
 *             stroke 白色描邊粗細 px；疊在複雜背景上時才需要，預設 0
 */
export const hi = (text, opt = {}) => {
  const o = typeof opt === 'string' ? { color: opt } : opt;
  const { color = HI_DEFAULT.color, scale = HI_DEFAULT.scale,
          weight = HI_DEFAULT.weight, stroke = 0 } = o;
  // 色碼直接放行，只有「看起來像色名」的才查表——這樣打錯色名仍然擋得住
  const c = color.startsWith('#') || color.startsWith('rgb') ? color : HL[color];
  if (!c) throw new Error(`未知的關鍵字色：${color}\n可用：${Object.keys(HL).join('、')}，或直接給 #色碼`);
  const st = stroke ? `-webkit-text-stroke:${stroke}px #fff;paint-order:stroke fill;` : '';
  return `<em class="fxhi" style="color:${c};font-size:${scale}em;font-weight:${weight};${st}">${text}</em>`;
};

/** 六種語意色。tone 決定「這句話是什麼性質」，不是隨便挑好看的。 */
export const TONES = {
  orange: { label: '重點／主標', bg: 'linear-gradient(160deg,#FF9F1C,#F97316)', solid: '#FF8A00', fg: '#fff', shadow: 'rgba(0,0,0,.28)' },
  yellow: { label: '一般說明',   bg: 'linear-gradient(160deg,#FFE066,#FFB703)', solid: '#FFC300', fg: '#6B3A00', shadow: 'rgba(255,255,255,.55)' },
  red:    { label: '警告／注意', bg: 'linear-gradient(160deg,#FF4D6D,#D90429)', solid: '#F02D4B', fg: '#fff', shadow: 'rgba(0,0,0,.32)' },
  green:  { label: '正確／完成', bg: 'linear-gradient(160deg,#5BE49B,#16A34A)', solid: '#22C55E', fg: '#fff', shadow: 'rgba(0,0,0,.26)' },
  blue:   { label: '補充／提示', bg: 'linear-gradient(160deg,#5CC9F5,#2F80ED)', solid: '#2F9BE8', fg: '#fff', shadow: 'rgba(0,0,0,.26)' },
  purple: { label: '想一想',     bg: 'linear-gradient(160deg,#B79CFF,#7C3AED)', solid: '#8B5CF6', fg: '#fff', shadow: 'rgba(0,0,0,.26)' },
};

/**
 * 四種尺寸。1920 畫布下 sm 是最小可讀，再小低年級看不清楚。
 * stroke 是 shape:'text' 的白邊粗細，跟著字級走——固定值在大字上會顯得太細。
 */
export const SIZES = {
  sm: { font: 34, pad: '14px 30px', radius: 22, border: 6, stroke: 6 },
  md: { font: 46, pad: '20px 42px', radius: 28, border: 7, stroke: 8 },
  lg: { font: 64, pad: '26px 54px', radius: 34, border: 8, stroke: 11 },
  xl: { font: 92, pad: '30px 66px', radius: 40, border: 10, stroke: 15 },
};

/**
 * 產生課程用的 card()。
 * @param fx    由 makeFx() 產生的進場函式（字卡的進場動畫與音效走同一套）
 * @param fxOut 由 makeFxOut() 產生的離場函式；不傳就不能用 out 選項
 */
export const makeCard = (fx, fxOut) => ({
  text,
  tone = 'orange',
  size = 'md',
  shape = 'box',       // 'box' 實心方塊 ｜ 'text' 純文字白描邊
  fx: effect = 'pop',
  at = 0,
  out = '',            // 離場效果名稱（例如 'fadeOut'）
  outAt = 0,           // 離場時間
  sub = '',            // 副標，字級為主標的 55%
  icon = '',           // 卡片左側的小圖（HTML 片段，例如一個 Scratch 積木 img）
  id = '',
  style = '',          // 額外的定位樣式（position/top/left 之類）
}) => {
  if (!TONES[tone]) throw new Error(`未知的字卡色：${tone}\n可用：${Object.keys(TONES).join('、')}`);
  if (!SIZES[size]) throw new Error(`未知的字卡尺寸：${size}\n可用：${Object.keys(SIZES).join('、')}`);
  if (shape !== 'box' && shape !== 'text') throw new Error(`未知的字卡形態：${shape}\n可用：box、text`);
  if (out && !fxOut) throw new Error('要用 out 就得把 fxOut 傳給 makeCard(fx, fxOut)');
  return `<div ${id ? `id="${id}"` : ''} ${fx(effect, at)} ${out ? fxOut(out, outAt) : ''}`
    + ` class="fxcard fxcard-${shape} fxcard-${tone} fxcard-${size}" style="${style}">`
    + (icon ? `<span class="fxcard-icon">${icon}</span>` : '')
    + `<span class="fxcard-body"><span class="fxcard-main">${text}</span>`
    + (sub ? `<span class="fxcard-sub">${sub}</span>` : '')
    + `</span></div>`;
};

/** 內嵌進 composition 的 <style>。 */
export const CARD_CSS = `
      /* ===== 字卡（由 tools/lib/cards.mjs 產生，不要手改）===== */
      .fxcard { display: inline-flex; align-items: center; gap: 20px; font-weight: 900; line-height: 1.3;
                font-family: "Yuanti TC", "PingFang TC", "Noto Sans TC", sans-serif;
                /* 進場動畫從 autoAlpha:0 開始，這裡先藏起來避免第一幀閃現 */
                visibility: hidden; opacity: 0; }
      .fxcard-body { display: flex; flex-direction: column; }
      .fxcard-sub { font-size: 55%; font-weight: 800; opacity: .9; margin-top: 6px; }
      .fxcard-icon { display: flex; align-items: center; }
      .fxcard-icon img, .fxcard-icon svg { height: 1.1em; width: auto; display: block; }

      /* 形態一：實心方塊 + 白框。兩層陰影，才不會在淺色背景上消失 */
      .fxcard-box { border-style: solid; border-color: #fff;
                    box-shadow: 0 10px 0 rgba(0,0,0,.16), 0 14px 30px rgba(0,0,0,.22); }

      /* 形態二：純文字 + 白色描邊。
         paint-order 讓描邊畫在字身「後面」，不加的話白邊會往內吃掉筆畫、字變細。
         描邊本身沒有陰影，靠 drop-shadow 補一層深色讓它離開背景。 */
      .fxcard-text { background: none; border: 0; padding: 0;
                     -webkit-text-stroke-color: #fff; paint-order: stroke fill;
                     filter: drop-shadow(0 6px 0 rgba(0,0,0,.22)) drop-shadow(0 3px 10px rgba(0,0,0,.3)); }
      .fxcard-text .fxcard-sub { -webkit-text-stroke-width: 0; }

      /* 句內關鍵字：比周圍大 22%，並換色。em 的斜體要關掉 */
      /* 顏色、大小、字重都由 hi() 寫成 inline style，這裡只關掉 em 的斜體 */
      .fxhi { font-style: normal; }

${Object.entries(SIZES).map(([k, s]) =>
  `      .fxcard-${k} { font-size: ${s.font}px; }
      .fxcard-box.fxcard-${k} { padding: ${s.pad}; border-radius: ${s.radius}px; border-width: ${s.border}px; }
      .fxcard-text.fxcard-${k} { -webkit-text-stroke-width: ${s.stroke}px; }`
).join('\n')}

${Object.entries(TONES).map(([k, t]) =>
  `      .fxcard-box.fxcard-${k} { background: ${t.bg}; color: ${t.fg}; text-shadow: 0 4px 0 ${t.shadow}; }
      .fxcard-text.fxcard-${k} { color: ${t.solid}; }`
).join('\n')}
`;
