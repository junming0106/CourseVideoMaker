// 2A5 貓抓老鼠 — 1~3 年級教學影片講稿資料（單一事實來源）
// vis 對應 build-composition.mjs 裡的畫面組件；teach: true 用統一教室背景
// hold: 該句講完後額外停留秒數（帶做／演示／思考時間）

// text 是「字幕用」的文字，保留引號、破折號才好讀；
// 但 TTS 會把這些標點當成停頓指令唸，句子會被切得斷斷續續，
// 所以送進語音合成前一律用 speechText() 轉成「口說用」的乾淨文字。
import { createHash } from 'node:crypto';

// 語音檔名用「口說文字的雜湊」，不用段落＋句序：
// 用句序當檔名的話，在中間插一句就會讓後面每一句的檔名整批位移，
// 快取全部失效、白白重跑一次 TTS 配額。
export const voiceId = (t) => createHash('sha1').update(speechText(t)).digest('hex').slice(0, 10);

export const speechText = (t) =>
  t
    .replace(/[「」『』（）《》〈〉]/g, '')   // 引號會讓 TTS 在中間硬停一拍
    .replace(/＿+/g, '什麼')                  // 填空底線唸不出來，改成疑問詞
    .replace(/[—–]+/g, '，')                  // 破折號改成短停頓
    .replace(/[…⋯]+/g, '，')                  // 刪節號同上
    .replace(/，{2,}/g, '，')
    .replace(/[。，、]+$/, '')                 // 句尾句號會拖出一段長尾音
    .trim();

export const SEGS = [
  { id: 'c1', title: '章節卡：今天要做貓抓老鼠', part: '第一部分：開場與引起動機', vis: 'chapter', chapter: true,
    chapNo: '1', chapTitle: '今天要做貓抓老鼠', lines: [
    { who: 'Cooper', action: 'talking', text: '第一章，今天要做貓抓老鼠！' },
  ]},
  { id: 's01', title: '三人開場（p.1）', vis: 'title', lines: [
    { who: 'Cooper', action: 'greeting', text: '小朋友大家好！我是 Cooper 老師！' },
    { who: 'Cooper', action: 'talking', text: '在螢幕前面的你，也一起說聲哈囉好嗎？', hold: 2 },
    { who: 'Max', action: 'greeting', text: '大家好，我是 Max！' },
    { who: 'Cora', action: 'greeting', text: '我是 Cora！Cooper 老師，今天要上什麼呀？' },
    { who: 'Cooper', action: 'talking', text: '今天這堂課，我們要自己做一個遊戲。' },
    { who: 'Cooper', action: 'guide_right', text: '遊戲的名字叫做——貓抓老鼠！' },
    { who: 'Max', action: 'eureka', text: '哇！我最喜歡玩遊戲了！' },
  ]},
  { id: 's02', title: '今天要學什麼（p.2）', vis: 'goals', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '開始之前，先看看今天的四個任務。' },
    { who: 'Cooper', action: 'guide_right', text: '第一，認識 Scratch 的程式積木。' },
    { who: 'Cora', action: 'listening', text: '第二，練習上台說話。' },
    { who: 'Max', action: 'talking', text: '第三，跟著老師做專題。' },
    { who: 'Cooper', action: 'talking', text: '第四，最後還有複習時間喔！' },
    { who: 'Cora', action: 'encourage', text: '四個任務，我們一個一個完成！' },
  ]},
  { id: 's03', title: '湯姆貓與傑利鼠（p.3~4）', vis: 'chase', lines: [
    { who: 'Cooper', action: 'talking', text: '你們看過湯姆貓和傑利鼠嗎？' },
    { who: 'Max', action: 'eureka', text: '我知道！湯姆貓每次都想抓傑利鼠！' },
    { who: 'Cora', action: 'listening', text: '可是每次都抓不到，好好笑。' },
    { who: 'Cooper', action: 'thinking', text: '你猜猜看，最後誰會贏呢？', hold: 3 },
    { who: 'Max', action: 'eureka', text: '傑利鼠！牠每次都跑掉！' },
    { who: 'Cooper', action: 'talking', text: '哈哈，通常都是老鼠贏喔。' },
    { who: 'Cooper', action: 'guide_left', text: '今天我們就用 Scratch，做一個自己的貓抓老鼠。' },
    { who: 'Max', action: 'talking', text: '我們自己做的耶！' },
  ]},

  { id: 's03b', title: '先看專題完成的樣子', vis: 'demoVideo', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '動手做之前，先看看完成以後長什麼樣子。' },
    { who: 'Cooper', action: 'guide_right', text: '你看，貓咪一直追著老鼠跑。' },
    { who: 'Cora', action: 'listening', text: '滑鼠移到哪裡，老鼠就跑到哪裡！' },
    { who: 'Max', action: 'eureka', text: '上面還有分數一直在加耶！' },
    { who: 'Cooper', action: 'talking', text: '今天下課，你也會做出這個遊戲喔。', hold: 2 },
  ]},

  { id: 'c2', title: '章節卡：認識「如果」', part: '第二部分：認識條件判斷「如果」', vis: 'chapter', chapter: true,
    chapNo: '2', chapTitle: '認識「如果」', lines: [
    { who: 'Cooper', action: 'talking', text: '第二章，認識如果。' },
  ]},
  { id: 's04', title: '什麼是「如果」（p.5~6）', vis: 'ifIntro', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '做遊戲之前，要先學一個很重要的東西。' },
    { who: 'Cooper', action: 'guide_right', text: '它叫做「如果」。' },
    { who: 'Max', action: 'thinking', text: '如果……？那是什麼？' },
    { who: 'Cooper', action: 'talking', text: '「如果」就是幫我們做決定的句子。' },
    { who: 'Cooper', action: 'talking', text: '如果怎麼樣，我們就做什麼事。' },
    { who: 'Cora', action: 'listening', text: '聽起來好像在選路。' },
    { who: 'Cooper', action: 'thinking', text: '你們覺得，選路是什麼意思呢？', hold: 3 },
    { who: 'Cooper', action: 'talking', text: '答對了！就是在選路。' },
  ]},
  { id: 's05', title: '生活裡的「如果」', vis: 'lifeIf', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '其實你們每天都在用「如果」喔。' },
    { who: 'Cooper', action: 'guide_left', text: '如果外面在下雨，我就帶雨傘。' },
    { who: 'Cora', action: 'talking', text: '如果肚子餓了，我就去吃飯。' },
    { who: 'Max', action: 'eureka', text: '如果媽媽在睡覺，我就小小聲！' },
    { who: 'Cooper', action: 'thinking', text: '換你想一個：如果天黑了，你就做什麼？', hold: 5 },
    { who: 'Cora', action: 'talking', text: '想到了嗎？跟旁邊的人說說看。' },
    { who: 'Cooper', action: 'talking', text: '太棒了，你們都會了！' },
    { who: 'Cooper', action: 'talking', text: '電腦也是這樣想事情的。' },
  ]},
  { id: 's06', title: '早餐流程圖（p.7）', vis: 'flow', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把「如果」畫成一張圖。' },
    { who: 'Cooper', action: 'guide_right', text: '早上起床，先問一個問題：桌上有早餐嗎？' },
    { who: 'Cooper', action: 'thinking', text: '你今天早上，桌上有早餐嗎？', hold: 3 },
    { who: 'Cooper', action: 'talking', text: '如果有——' },
    { who: 'Max', action: 'eureka', text: '我就把它吃光光！' },
    { who: 'Cooper', action: 'talking', text: '如果沒有呢？' },
    { who: 'Cora', action: 'talking', text: '那就只好出去買了。' },
    { who: 'Cooper', action: 'talking', text: '這張圖，就叫做流程圖。' },
    { who: 'Cooper', action: 'guide_left', text: '寫程式的人都會先畫流程圖喔。' },
  ]},
  { id: 's07', title: '【練習題 1】換你造句', vis: 'quizLight', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '換你們試試看！' },
    { who: 'Cooper', action: 'guide_right', text: '如果紅綠燈是紅燈，我就——' },
    { who: 'Cooper', action: 'talking', text: '想一想喔，老師等你。', hold: 5 },
    { who: 'Max', action: 'talking', text: '我就停下來！' },
    { who: 'Cora', action: 'encourage', text: '答對了，就是停下來等一等！' },
    { who: 'Cooper', action: 'talking', text: '你答對了嗎？很棒喔！' },
  ]},

  { id: 'c3', title: '章節卡：打開 Scratch', part: '第三部分：認識 Scratch', vis: 'chapter', chapter: true,
    chapNo: '3', chapTitle: '打開 Scratch', lines: [
    { who: 'Cooper', action: 'talking', text: '第三章，打開 Scratch。' },
  ]},
  // ── 實作示範：概念講完就馬上看真的怎麼點 ──
  { id: 'd01', title: '【實作】打開遊樂場', vis: 'demoSteps', teach: true, caption: '跟著老師一起操作',
    shots: [
      { img: 'A01-login-page.jpg', on: '打開網站', box: [58.5, 37, 27, 23] },
      { img: 'A02-login-filled.jpg', on: '打好了以後', box: [58.5, 60, 27, 9.5], arrow: 'left' },
      { img: 'A03-homepage.jpg', on: '這是你的首頁', box: [60.5, 80, 38, 9.5], arrow: 'left' },
      { img: 'A04-playground-initial.jpg', on: '就進來了' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '光用說的不容易懂，我們直接做一次給你看。' },
      { who: 'Cooper', action: 'guide_right', text: '第一步，打開網站，輸入你的帳號和密碼。' },
      { who: 'Cooper', action: 'talking', text: '打好了以後，按下面那顆出發。', hold: 2 },
      { who: 'Cora', action: 'listening', text: '這是你的首頁，右邊有一顆出發的按鈕。' },
      { who: 'Cooper', action: 'guide_right', text: '按下去，遊樂場就進來了！', hold: 3 },
      { who: 'Max', action: 'eureka', text: '哇，跟老師的畫面一模一樣！' },
      { who: 'Cooper', action: 'talking', text: '你也打開了嗎？沒有的話先暫停影片喔。', hold: 4 },
    ]},

  { id: 's08', title: 'Scratch 介面', vis: 'scratchUI', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '好，我們打開 Scratch！' },
    { who: 'Cooper', action: 'guide_right', text: '左邊這一區，是放積木的地方。' },
    { who: 'Cooper', action: 'talking', text: '中間這一區，是我們組裝積木的地方。' },
    { who: 'Cooper', action: 'guide_left', text: '右邊這個白色方框，就是遊戲的舞台。' },
    { who: 'Cooper', action: 'thinking', text: '你的畫面上也看到這三區了嗎？', hold: 3 },
    { who: 'Cora', action: 'listening', text: '原來舞台就是玩遊戲的地方。' },
    { who: 'Max', action: 'talking', text: '那積木要怎麼放上去呢？' },
  ]},
  { id: 's09', title: '怎麼拖積木', vis: 'dragBlock', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '很簡單，用滑鼠把積木拖過去就好。' },
    { who: 'Cooper', action: 'guide_right', text: '按住不放，拉到中間，再放開。' },
    { who: 'Cooper', action: 'guide_right', text: '現在換你動動手，拖一塊積木試試看。', hold: 4 },
    { who: 'Max', action: 'eureka', text: '像玩積木一樣！' },
    { who: 'Cooper', action: 'talking', text: '對，而且積木會自己黏在一起。' },
    { who: 'Cora', action: 'talking', text: '那電腦就會照著順序做事情。' },
    { who: 'Cooper', action: 'talking', text: '你們真聰明，就是這樣！' },
  ]},
  { id: 's10', title: '綠旗與停止', vis: 'greenFlag', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們的程式要有一個開始的地方。' },
    { who: 'Cooper', action: 'guide_right', text: '就是這塊「當綠旗被點擊」。' },
    { who: 'Cooper', action: 'thinking', text: '你找到綠旗在哪裡了嗎？', hold: 3 },
    { who: 'Cooper', action: 'talking', text: '按下綠旗，遊戲就開始了。' },
    { who: 'Max', action: 'talking', text: '那紅色的呢？' },
    { who: 'Cooper', action: 'talking', text: '紅色是停止，遊戲就結束了。' },
    { who: 'Cora', action: 'listening', text: '綠色開始，紅色停止，我記住了。' },
  ]},
  { id: 's11', title: '【練習題 2】哪個開始', vis: 'quizFlag', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '小考一下！' },
    // 畫面上是 A／B 兩張選項卡，旁白和答案就要跟著用 A／B，
    // 不然小孩看到 A 卻聽到「綠色」，會不知道該怎麼回答（另外兩題都是這個格式）
    { who: 'Cooper', action: 'guide_right', text: '想讓遊戲開始，要按哪一個？' },
    { who: 'Cooper', action: 'talking', text: 'A 是綠旗，B 是紅色的停止。', hold: 5 },
    { who: 'Cora', action: 'encourage', text: '我選 A！' },
    { who: 'Cooper', action: 'talking', text: '答對了，A 是綠旗，按綠旗遊戲就開始！' },
  ]},
  { id: 's12', title: '準備舞台（p.8~9）', vis: 'stage', lines: [
    { who: 'Cooper', action: 'talking', text: '接下來，選我們的主角。' },
    { who: 'Cooper', action: 'thinking', text: '你想選哪一隻角色當主角呢？', hold: 3 },
    { who: 'Max', action: 'talking', text: '一隻貓！' },
    { who: 'Cora', action: 'talking', text: '還有一隻老鼠！' },
    { who: 'Cooper', action: 'talking', text: '再選一個樹林的背景。' },
    { who: 'Cooper', action: 'guide_right', text: '貓、老鼠、樹林，舞台就準備好了！', hold: 2 },
  ]},

  { id: 'd02', title: '【實作】選角色與背景', vis: 'demoSteps', teach: true, caption: '換你動手選',
    shots: [
      // 刪除這一步要用「還有角色」的畫面，垃圾桶才看得到；刪完的空清單留給下一句
      { img: 'A04-playground-initial.jpg', on: '預設的角色刪掉', box: [62.5, 79, 8.5, 14], arrow: 'left' },
      { img: 'B01-default-sprite-deleted.jpg', on: '右下角的貓臉', box: [86.5, 88, 9, 11], arrow: 'left' },
      { img: 'B03-search-cat.jpg', on: '打字找貓咪', box: [1, 13.5, 15, 8] },
      { img: 'B07-mouse1-added.jpg', on: '老鼠也選進來', box: [62.5, 80, 15, 13], arrow: 'left' },
      { img: 'B08-search-woods.jpg', on: '再來換背景', box: [1, 13.5, 15, 8] },
      { img: 'B09-stage-ready.jpg', on: '樹林就出現了' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '換我們自己動手，把主角選出來。' },
      { who: 'Cooper', action: 'guide_right', text: '先把預設的角色刪掉，按牠右上角的垃圾桶。' },
      { who: 'Cooper', action: 'talking', text: '再按右下角的貓臉，這裡有好多角色可以挑。' },
      { who: 'Cora', action: 'listening', text: '在上面打字找貓咪，一下就找到了。' },
      { who: 'Max', action: 'eureka', text: '老鼠也選進來，兩隻都到齊了！' },
      { who: 'Cooper', action: 'guide_right', text: '再來換背景，按右下角那顆圖片按鈕。' },
      { who: 'Cooper', action: 'talking', text: '選樹林，樹林就出現了！', hold: 2 },
      { who: 'Cooper', action: 'thinking', text: '你的舞台也準備好了嗎？', hold: 4 },
    ]},

  { id: 'c4', title: '章節卡：寫老鼠的程式', part: '第四部分：偵測滑鼠與老鼠的程式', vis: 'chapter', chapter: true,
    chapNo: '4', chapTitle: '寫老鼠的程式', lines: [
    { who: 'Cooper', action: 'talking', text: '第四章，寫老鼠的程式。' },
  ]},
  { id: 's13', title: '門鈴與偵測（p.10 上）', vis: 'doorbell', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '現在有個問題。' },
    { who: 'Cooper', action: 'talking', text: '老鼠要什麼時候出現呢？' },
    { who: 'Max', action: 'thinking', text: '呃……老鼠自己決定？' },
    { who: 'Cooper', action: 'talking', text: '哈哈，是你決定喔！' },
    { who: 'Cooper', action: 'guide_right', text: '就像門鈴一樣：你按下去，門才會開。' },
    { who: 'Cooper', action: 'thinking', text: '你家的門鈴，是按下去才會響對不對？', hold: 2 },
    { who: 'Cora', action: 'listening', text: '所以要先有人按，才會有事情發生。' },
    { who: 'Cooper', action: 'talking', text: '在程式裡，這叫做「偵測」。' },
  ]},
  { id: 's14', title: '滑鼠按下了嗎（p.10 下）', vis: 'mousedown', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '在 Scratch 裡，我們這樣問電腦。' },
    { who: 'Cooper', action: 'guide_right', text: '「滑鼠鍵被按下了嗎？」' },
    { who: 'Cooper', action: 'talking', text: '這是一塊淺藍色的偵測積木。' },
    { who: 'Cooper', action: 'thinking', text: '猜猜看，不按滑鼠的時候老鼠在哪裡？', hold: 4 },
    { who: 'Cora', action: 'talking', text: '躲起來了，看不見！' },
    { who: 'Cooper', action: 'talking', text: '答對了，因為我們叫牠隱藏起來。' },
    { who: 'Cooper', action: 'talking', text: '把它放進「如果」裡面。' },
    { who: 'Cora', action: 'talking', text: '按下去，老鼠就出現。' },
    { who: 'Max', action: 'talking', text: '放開手，老鼠就躲起來！' },
    { who: 'Cooper', action: 'talking', text: '就像在玩躲貓貓一樣。', hold: 2 },
  ]},
  { id: 'd03', title: '【實作】拖出第一塊積木', vis: 'demoSteps', teach: true, caption: '積木會自己黏在一起',
    shots: [
      { img: 'C01-mouse1-selected-events.jpg', on: '先點一下老鼠', box: [69, 80, 7.5, 13], arrow: 'left' },
      { img: 'C02-dragging-when-flag.jpg', on: '按住不放拖過來', box: [23, 17, 39, 45] },
      { img: 'C03-setsize-snapped.jpg', on: '手一放開' },
      { img: 'C04-field-editing.jpg', on: '點一下那個數字', box: [23, 17, 39, 45] },
      { img: 'C05-size-80.jpg', on: '改成八十' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '說完了，我們真的排一次給你看。' },
      { who: 'Cooper', action: 'guide_right', text: '先點一下老鼠，程式才會寫在牠身上。' },
      { who: 'Cooper', action: 'talking', text: '從事件區把當綠旗被點擊按住不放拖過來。' },
      { who: 'Max', action: 'eureka', text: '手一放開，兩塊就自己黏住了！' },
      { who: 'Cooper', action: 'guide_right', text: '接著點一下那個數字。' },
      { who: 'Cooper', action: 'talking', text: '把它改成八十，老鼠就會小一點。', hold: 3 },
    ]},

  { id: 's14b', title: '★ 老鼠的完整程式碼（p.10 截圖）', vis: 'codeMouseShow', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把老鼠的程式完整看一次。' },
    { who: 'Cooper', action: 'guide_right', text: '最上面是「當綠旗被點擊」。' },
    { who: 'Cooper', action: 'talking', text: '再來把大小設成百分之八十。' },
    { who: 'Cooper', action: 'talking', text: '然後用「重複無限次」一直檢查。' },
    { who: 'Cora', action: 'listening', text: '如果滑鼠按下就顯示，否則就隱藏。' },
    { who: 'Cooper', action: 'talking', text: '照著這樣排，你的老鼠就會躲貓貓了。', hold: 3 },
    { who: 'Cooper', action: 'thinking', text: '你的畫面跟老師的一樣嗎？', hold: 4 },
  ]},
  { id: 'd04', title: '【實作】把偵測積木塞進如果', vis: 'demoSteps', teach: true, caption: '形狀一樣才卡得進去',
    shots: [
      { img: 'C06-dragging-ifelse-into-forever.jpg', on: '放進重複無限次', box: [23, 17, 39, 55] },
      { img: 'C07-dragging-mousedown-into-hex.jpg', on: '六角形的積木', box: [4.5, 17, 19, 78] },
      { img: 'C08-mousedown-near-hex.jpg', on: '對準那個凹槽', box: [23, 17, 39, 55] },
      { img: 'C09-mousedown-snapped.jpg', on: '卡進去了' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '接下來這一步最容易失敗，看仔細喔。' },
      { who: 'Cooper', action: 'guide_right', text: '先把如果放進重複無限次裡面。' },
      { who: 'Cooper', action: 'talking', text: '再找這塊六角形的積木，滑鼠鍵被按下了嗎。' },
      { who: 'Cooper', action: 'guide_right', text: '拖過去的時候，要對準那個凹槽。' },
      { who: 'Cora', action: 'listening', text: '形狀一樣，才卡得進去。' },
      { who: 'Max', action: 'eureka', text: '卡進去了！' },
      { who: 'Cooper', action: 'thinking', text: '你也卡進去了嗎？沒有的話再試一次。', hold: 4 },
    ]},

  { id: 's15', title: '老鼠跟著滑鼠跑（p.11）', vis: 'goto', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '再加一塊積木，叫「移到滑鼠游標」。' },
    { who: 'Cooper', action: 'guide_right', text: '加上去以後，看看會怎麼樣。', hold: 2 },
    { who: 'Max', action: 'eureka', text: '哇！老鼠跑到滑鼠旁邊了！' },
    { who: 'Cora', action: 'talking', text: '滑鼠移到哪裡，老鼠就跟到哪裡。' },
    { who: 'Cooper', action: 'guide_right', text: '動動手指，把滑鼠移來移去看看。', hold: 4 },
    { who: 'Cooper', action: 'talking', text: '這樣你就可以帶著老鼠到處跑囉。' },
  ]},
  { id: 's15b', title: '★ 老鼠的完整程式碼（p.11 截圖）', vis: 'codeMouseGoto', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '加上去以後，程式變成這樣。' },
    { who: 'Cooper', action: 'guide_right', text: '在「顯示」的上面多了一塊「移到滑鼠游標」。' },
    { who: 'Max', action: 'talking', text: '只多一塊積木而已耶！' },
    { who: 'Cooper', action: 'talking', text: '對，這樣老鼠就會跟著你跑了。' },
    { who: 'Cooper', action: 'guide_left', text: '這就是老鼠的完整程式，照著排排看。', hold: 3 },
  ]},
  { id: 'd05', title: '【實作】換成滑鼠游標', vis: 'demoSteps', teach: true, caption: '下拉選單要記得換',
    shots: [
      // 框住「移到 隨機位置」這塊積木本身，指到那個下拉小箭頭，不要框整個程式區
      { img: 'C10-dropdown-open.jpg', on: '點那個小箭頭', box: [45, 51.5, 14, 8], arrow: 'left' },
      { img: 'C11-goto-mousepointer.jpg', on: '換成滑鼠游標' },
      { img: 'C12-mouse-script-complete.jpg', on: '老鼠的程式就完成了' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '最後把移到這塊積木加上去。' },
      { who: 'Cooper', action: 'guide_right', text: '它一開始寫的是隨機位置，要點那個小箭頭。' },
      { who: 'Cooper', action: 'talking', text: '在單子裡選滑鼠游標，把它換成滑鼠游標。' },
      { who: 'Cora', action: 'talking', text: '這樣老鼠的程式就完成了！' },
      { who: 'Cooper', action: 'thinking', text: '跟老師的畫面一樣嗎？', hold: 4 },
    ]},

  { id: 's16', title: '【練習題 3】拿掉積木會怎樣', vis: 'quizGoto', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '考考你們！' },
    { who: 'Cooper', action: 'talking', text: '如果我把「移到滑鼠游標」拿掉，會怎麼樣？' },
    { who: 'Cooper', action: 'guide_right', text: '想一想。', hold: 5 },
    { who: 'Max', action: 'thinking', text: '老鼠……不會跟過來？' },
    { who: 'Cooper', action: 'talking', text: '對！老鼠只會待在原地不動。' },
    { who: 'Cora', action: 'encourage', text: '所以每一塊積木都很重要！' },
  ]},

  { id: 'c5', title: '章節卡：寫貓咪的程式', part: '第五部分：迴圈與貓咪的程式', vis: 'chapter', chapter: true,
    chapNo: '5', chapTitle: '寫貓咪的程式', lines: [
    { who: 'Cooper', action: 'talking', text: '第五章，寫貓咪的程式。' },
  ]},
  { id: 's17', title: '什麼是迴圈', vis: 'loopIntro', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '換貓咪上場囉！' },
    { who: 'Cooper', action: 'guide_right', text: '貓咪要一直一直朝著老鼠走過去。' },
    { who: 'Cooper', action: 'thinking', text: '如果要走一百步，你要放幾塊積木？', hold: 4 },
    { who: 'Max', action: 'thinking', text: '一直一直……要放幾百塊積木嗎？' },
    { who: 'Cooper', action: 'talking', text: '不用！我們有更聰明的方法。' },
    { who: 'Cooper', action: 'guide_left', text: '它叫做「迴圈」。' },
    { who: 'Cora', action: 'listening', text: '迴圈？' },
  ]},
  { id: 's18', title: '迴圈就像跑操場', vis: 'loopTrack', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '迴圈就像在操場跑步。' },
    { who: 'Cooper', action: 'guide_right', text: '跑完一圈，再跑一圈。' },
    { who: 'Cooper', action: 'talking', text: '一直重複，不用重新想一次。', hold: 2 },
    { who: 'Cooper', action: 'thinking', text: '想想看，生活裡還有什麼事一直重複？', hold: 5 },
    { who: 'Max', action: 'eureka', text: '刷牙！每天早上晚上都要刷！' },
    { who: 'Max', action: 'eureka', text: '原來只要說一次「一直跑」就好了！' },
    { who: 'Cora', action: 'encourage', text: '一塊積木就解決了，好方便。' },
    { who: 'Cooper', action: 'talking', text: '這塊積木叫做「重複無限次」。' },
  ]},
  { id: 's19', title: '貓咪追過去（p.12）', vis: 'catChase', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們在迴圈裡面放三塊積木。' },
    { who: 'Cooper', action: 'guide_right', text: '第一塊：面向老鼠。' },
    { who: 'Cooper', action: 'talking', text: '第二塊：往前走幾步。' },
    { who: 'Cooper', action: 'guide_left', text: '第三塊：換一個造型，牠就像在走路。' },
    { who: 'Cooper', action: 'thinking', text: '這三塊積木的順序，可以換嗎？', hold: 4 },
    { who: 'Max', action: 'thinking', text: '應該可以吧？反正三塊都在裡面。' },
    { who: 'Cooper', action: 'talking', text: '不行喔，換了順序就會出問題。' },
    { who: 'Cooper', action: 'guide_right', text: '一定要先面向老鼠，才往前走。' },
    { who: 'Cora', action: 'listening', text: '不然貓咪會朝著舊的方向走。' },
    { who: 'Cooper', action: 'talking', text: '對，就追不到了。程式是有先後順序的。' },
    { who: 'Cora', action: 'talking', text: '這樣貓咪就會一直追著老鼠跑了！', hold: 2 },
    { who: 'Max', action: 'talking', text: '好像真的在追耶！' },
  ]},
  { id: 's19b', title: '★ 貓咪的完整程式碼（p.12 截圖）', vis: 'codeCatChase', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '這是貓咪現在的程式。' },
    { who: 'Cooper', action: 'guide_right', text: '綠旗開始，大小設成百分之八十。' },
    { who: 'Cooper', action: 'talking', text: '「重複無限次」裡面放三塊積木。' },
    { who: 'Cora', action: 'talking', text: '面向滑鼠、換造型、走十步。' },
    { who: 'Cooper', action: 'talking', text: '照著排，貓咪就會一直追過來。', hold: 3 },
  ]},
  { id: 'd06', title: '【實作】程式寫在誰身上', vis: 'demoSteps', teach: true, caption: '每一隻角色的程式要分開寫',
    shots: [
      { img: 'D01-sprite1-empty-code.jpg', on: '點一下貓咪', box: [62.5, 80, 7.5, 13], arrow: 'left' },
      { img: 'D02-cat-chase-loop.jpg', on: '把三塊積木放進', box: [23, 17, 39, 55] },
      { img: 'D03-cat-script-complete.jpg', on: '貓咪的程式也好了' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '換貓咪了，這一步最重要。' },
      { who: 'Cooper', action: 'guide_right', text: '點一下貓咪，你看，中間是空的。' },
      { who: 'Cora', action: 'listening', text: '因為剛剛那些是寫在老鼠身上。' },
      { who: 'Max', action: 'thinking', text: '所以每一隻角色，程式都要分開寫？' },
      { who: 'Cooper', action: 'talking', text: '沒錯！這裡最多人搞錯。' },
      { who: 'Cooper', action: 'guide_right', text: '一樣的方法，把三塊積木放進重複無限次。' },
      { who: 'Cooper', action: 'talking', text: '再加上打轉，貓咪的程式也好了。', hold: 3 },
    ]},

  { id: 's20', title: '數字可以調整', vis: 'speed', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '這裡有一個數字，可以自己改。' },
    { who: 'Cooper', action: 'guide_right', text: '數字大，貓咪走得快。', hold: 2 },
    { who: 'Cooper', action: 'talking', text: '數字小，貓咪走得慢。', hold: 2 },
    { who: 'Cooper', action: 'thinking', text: '你想把數字改成多少呢？', hold: 3 },
    { who: 'Max', action: 'thinking', text: '那想要簡單一點怎麼辦？' },
    { who: 'Cooper', action: 'talking', text: '把數字改小，貓咪就不容易抓到你！' },
    { who: 'Cora', action: 'listening', text: '原來難易度是自己決定的。' },
  ]},
  { id: 's21', title: '原地打轉（p.13）', vis: 'spin', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '還沒按滑鼠的時候，貓咪要做什麼？' },
    { who: 'Max', action: 'talking', text: '睡覺覺？' },
    { who: 'Cooper', action: 'talking', text: '哈哈，我們讓牠原地轉圈圈。' },
    { who: 'Cooper', action: 'thinking', text: '你覺得貓咪在等什麼？', hold: 3 },
    { who: 'Max', action: 'eureka', text: '在等我們按滑鼠！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，滑鼠還沒按，牠就一直等。' },
    { who: 'Cooper', action: 'guide_right', text: '這塊積木叫「重複直到滑鼠鍵被按下」。' },
    { who: 'Cora', action: 'talking', text: '滑鼠一按下去——' },
    { who: 'Max', action: 'eureka', text: '貓咪就衝出去抓老鼠！', hold: 2 },
  ]},
  { id: 's21b', title: '★ 貓咪的完整程式碼（p.13 截圖）', vis: 'codeCatSpin', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '加上打轉以後，貓咪的程式完成了。' },
    { who: 'Cooper', action: 'guide_right', text: '最下面多了「重複直到滑鼠鍵被按下」。' },
    { who: 'Cooper', action: 'talking', text: '裡面放「右轉十五度」。' },
    { who: 'Max', action: 'eureka', text: '所以還沒按的時候牠就一直轉！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，這就是貓咪的完整程式。', hold: 3 },
  ]},
  { id: 's22', title: '【練習題 4】該用哪塊積木', vis: 'quizLoop', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '小考時間！' },
    { who: 'Cooper', action: 'talking', text: '要讓貓咪一直追老鼠，應該用哪一塊積木？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是「等待一秒」，B 是「重複無限次」。', hold: 5 },
    { who: 'Cora', action: 'talking', text: '我選 B！' },
    { who: 'Cooper', action: 'talking', text: '答對了，要一直做的事情就用迴圈。' },
    { who: 'Max', action: 'eureka', text: '我也選 B，我們都對了！' },
  ]},

  { id: 'c6', title: '章節卡：認識「變數」', part: '第六部分：變數與計分', vis: 'chapter', chapter: true,
    chapNo: '6', chapTitle: '認識「變數」', lines: [
    { who: 'Cooper', action: 'talking', text: '第六章，認識變數，還要幫遊戲計分。' },
  ]},
  { id: 's23', title: '什麼是變數', vis: 'toysMess', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '最後一個新東西，叫做「變數」。' },
    { who: 'Max', action: 'thinking', text: '變……變身的魔法嗎？' },
    { who: 'Cooper', action: 'talking', text: '哈哈不是喔，比魔法還好用。' },
    { who: 'Cooper', action: 'guide_right', text: '先問你們：家裡的玩具玩完以後，要做什麼？' },
    { who: 'Cooper', action: 'thinking', text: '你的房間裡，玩具是怎麼收的呢？', hold: 3 },
    { who: 'Cora', action: 'talking', text: '要收起來！' },
    { who: 'Cooper', action: 'talking', text: '對，而且會分類收好。' },
  ]},
  { id: 's24', title: '變數就是收納箱', vis: 'toyBox', teach: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '賽車放賽車的箱子。' },
    { who: 'Cooper', action: 'talking', text: '書本放書本的箱子。' },
    { who: 'Cora', action: 'listening', text: '這樣要找的時候就很好找。' },
    { who: 'Cooper', action: 'talking', text: '變數就是這樣的一個箱子。' },
    { who: 'Cooper', action: 'guide_left', text: '它可以幫電腦把東西存起來。' },
    { who: 'Cooper', action: 'thinking', text: '想一想，你還會想做什麼箱子？', hold: 4 },
    { who: 'Cora', action: 'talking', text: '我想做一個時間箱，裝還剩幾秒。' },
    { who: 'Cooper', action: 'talking', text: '很好！也可以做生命箱，裝還剩幾條命。' },
    { who: 'Max', action: 'eureka', text: '原來變數是收納箱！', hold: 2 },
  ]},
  { id: 's25', title: '做一個分數箱（p.14 上）', vis: 'makeVar', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們來做一個箱子，名字叫 score。' },
    { who: 'Cooper', action: 'guide_right', text: 'score 就是分數的意思。' },
    { who: 'Cora', action: 'talking', text: '這個箱子要裝什麼呢？' },
    { who: 'Cooper', action: 'talking', text: '裝分數！一開始是零分。' },
    { who: 'Cooper', action: 'thinking', text: '如果箱子裡放的是生命，你會叫它什麼？', hold: 4 },
    { who: 'Cora', action: 'talking', text: '叫它 life，就是生命的意思！' },
    { who: 'Cooper', action: 'talking', text: '很棒！箱子的名字，要看它裝什麼。' },
    { who: 'Max', action: 'talking', text: '那分數箱要怎麼加分呢？' },
  ]},
  { id: 'd07', title: '【實作】做一個叫 score 的箱子', vis: 'demoSteps', teach: true, caption: '名字要自己取',
    shots: [
      // 框積木區本身，不要框最左邊的分類鈕——那裡會被左側的對話框蓋住
      { img: 'E01-variables-default-myvariable.jpg', on: '打開變數這一區', box: [3.5, 4, 22, 38] },
      { img: 'E02-new-variable-dialog.jpg', on: '建立一個變數' },
      { img: 'E03-typed-score.jpg', on: '打上 score', box: [30, 25, 40, 45] },
      { img: 'E04-score-created.jpg', on: '分數箱就做好了', box: [63.5, 17, 12, 7], arrow: 'left' },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '我們真的來做一個分數箱。' },
      { who: 'Cooper', action: 'guide_right', text: '打開變數這一區，你會看到一個叫 my variable 的箱子。' },
      { who: 'Cora', action: 'talking', text: '那是電腦本來就先給我們的名字。' },
      { who: 'Cooper', action: 'talking', text: '我們不用它，按上面的建立一個變數。' },
      { who: 'Cooper', action: 'guide_right', text: '在框框裡打上 score，再按確定。' },
      { who: 'Max', action: 'eureka', text: '舞台左上角跳出分數，分數箱就做好了！', hold: 3 },
    ]},

  { id: 's26', title: '碰到就加一分（p.14 下）', vis: 'addScore', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '當貓咪碰到老鼠的時候——' },
    { who: 'Cooper', action: 'guide_right', text: '分數就加一分。' },
    { who: 'Cora', action: 'talking', text: '碰到一次加一分，碰到兩次加兩分。', hold: 2 },
    { who: 'Cooper', action: 'thinking', text: '碰到五次，會加幾分呢？', hold: 4 },
    { who: 'Max', action: 'eureka', text: '五分！' },
    { who: 'Cooper', action: 'talking', text: '一直加到二十分，遊戲就結束了。' },
    { who: 'Max', action: 'eureka', text: '那我要努力不要被抓到！' },
    { who: 'Cooper', action: 'talking', text: '這樣遊戲就好玩了！' },
  ]},
  { id: 's26b', title: '★ 計分的完整程式碼（p.14 截圖）', vis: 'codeScore', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '計分的程式長這樣。' },
    { who: 'Cooper', action: 'guide_right', text: '先把 score 設成零。' },
    { who: 'Cooper', action: 'talking', text: '再用「重複直到 score 等於二十」。' },
    { who: 'Cooper', action: 'thinking', text: '這裡的二十，可以改成別的數字嗎？', hold: 3 },
    { who: 'Max', action: 'talking', text: '改成十可以嗎？' },
    { who: 'Cooper', action: 'talking', text: '可以呀！改成十，遊戲就比較快結束。' },
    { who: 'Cora', action: 'talking', text: '裡面放：如果碰到貓咪，score 就加一。' },
    { who: 'Cooper', action: 'talking', text: '最後加一塊「停止全部」，遊戲就結束。', hold: 3 },
  ]},
  { id: 'd08', title: '【實作】計分程式寫在哪裡', vis: 'demoSteps', teach: true, caption: '背景裡沒有「碰到」這塊積木',
    shots: [
      { img: 'E05-variable-dropdown.jpg', on: '把名字換成 score', box: [23, 17, 39, 55] },
      { img: 'E06-score-script-complete.jpg', on: '計分的程式就完成了' },
      { img: 'E07-stage-has-no-touching.jpg', on: '點一下舞台', box: [4.5, 17, 19, 78] },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '計分的程式，也是寫在老鼠身上喔。' },
      { who: 'Cooper', action: 'guide_right', text: '積木拿出來的時候，寫的還是 my variable。' },
      { who: 'Cooper', action: 'talking', text: '點那個小箭頭，把名字換成 score。' },
      { who: 'Cora', action: 'listening', text: '這樣計分的程式就完成了。' },
      { who: 'Cooper', action: 'thinking', text: '有人以為要寫在背景，我們來看看。' },
      { who: 'Cooper', action: 'guide_right', text: '點一下舞台，再打開偵測這一區。' },
      { who: 'Max', action: 'thinking', text: '咦，碰到的積木不見了！' },
      { who: 'Cooper', action: 'talking', text: '對，背景沒有這塊積木，所以一定要寫在角色身上。', hold: 4 },
    ]},

  { id: 's27', title: '【練習題 5】score 裝什麼', vis: 'quizVar', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '再考一題！' },
    { who: 'Cooper', action: 'talking', text: '變數 score 是用來裝什麼的？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是裝分數，B 是裝貓咪。', hold: 5 },
    { who: 'Max', action: 'eureka', text: 'A！裝分數！' },
    { who: 'Cooper', action: 'talking', text: '答對了，score 就是分數箱。' },
  ]},
  { id: 's27b', title: '★ 三段程式總覽（暫停抄寫）', vis: 'codeReview', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把今天寫的程式全部排在一起。' },
    { who: 'Cooper', action: 'guide_right', text: '左邊這一段，是老鼠的程式。' },
    { who: 'Cooper', action: 'talking', text: '中間這一段，是貓咪的程式。' },
    { who: 'Cooper', action: 'guide_left', text: '右邊這一段，是計分的程式。' },
    { who: 'Cora', action: 'listening', text: '三段合起來就是一個完整的遊戲。' },
    { who: 'Cooper', action: 'talking', text: '暫停影片，照著螢幕排排看吧。', hold: 6 },
  ]},
  { id: 'd09', title: '【實作】按綠旗玩玩看', vis: 'demoSteps', teach: true, caption: '放錯了就拖回去',
    shots: [
      { img: 'F01-game-running.jpg', on: '按下綠旗', box: [61.8, 11.5, 5, 8] },
      { img: 'F02-deleting-block.jpg', on: '拖回左邊', box: [4.5, 17, 19, 78] },
    ],
    lines: [
      { who: 'Cooper', action: 'talking', text: '三段都排好了，按下綠旗試試看！' },
      { who: 'Max', action: 'eureka', text: '貓咪真的在追，分數也在加！', hold: 3 },
      { who: 'Cooper', action: 'thinking', text: '如果積木放錯了怎麼辦呢？', hold: 3 },
      { who: 'Cooper', action: 'guide_right', text: '很簡單，把它拖回左邊的積木區就消失了。' },
      { who: 'Cora', action: 'encourage', text: '放錯也沒關係，再拿一塊就好！' },
      { who: 'Cooper', action: 'talking', text: '現在換你把整個遊戲做完，需要的話暫停影片。', hold: 5 },
    ]},

  { id: 's28', title: '成果展示（p.15）', vis: 'demo', lines: [
    { who: 'Cooper', action: 'talking', text: '全部組合起來，我們看看成果！', hold: 3 },
    { who: 'Max', action: 'eureka', text: '哇！貓咪真的在追老鼠！' },
    { who: 'Cora', action: 'encourage', text: '分數也一直在加耶！', hold: 2 },
    { who: 'Cooper', action: 'talking', text: '這就是你們自己做的遊戲。' },
    { who: 'Cooper', action: 'thinking', text: '你也做出來了嗎？舉手給老師看看！', hold: 3 },
    { who: 'Cooper', action: 'talking', text: '回家也可以做給爸爸媽媽看喔！' },
  ]},

  { id: 'c7', title: '章節卡：上台分享', part: '第七部分：上台表達', vis: 'chapter', chapter: true,
    chapNo: '7', chapTitle: '上台分享', lines: [
    { who: 'Cooper', action: 'talking', text: '第七章，上台分享。' },
  ]},
  { id: 's29', title: '上台會緊張嗎（p.16）', vis: 'stageFright', lines: [
    { who: 'Cooper', action: 'talking', text: '做完遊戲，要上台跟大家分享。' },
    { who: 'Cooper', action: 'thinking', text: 'Max，上台的時候你會緊張嗎？' },
    { who: 'Cooper', action: 'thinking', text: '你上台的時候，會不會也緊張呢？', hold: 3 },
    { who: 'Max', action: 'thinking', text: '會……心臟怦怦跳。' },
    { who: 'Cora', action: 'listening', text: '我也會，手心會流汗。' },
    { who: 'Cooper', action: 'talking', text: '會緊張是正常的，老師也會喔。' },
  ]},
  { id: 's30', title: '一起深呼吸（p.17）', vis: 'breath', lines: [
    { who: 'Cooper', action: 'talking', text: '老師教你們一個方法。' },
    { who: 'Cooper', action: 'guide_right', text: '吸氣四秒，憋住兩秒，再慢慢吐氣六秒。' },
    { who: 'Cora', action: 'encourage', text: '我們一起做一次！', hold: 12 },
    { who: 'Cooper', action: 'talking', text: '很好，再來一次，跟著圈圈呼吸。', hold: 12 },
    { who: 'Max', action: 'eureka', text: '哇，真的比較不緊張了！' },
  ]},

  { id: 'c8', title: '章節卡：複習時間', part: '第八部分：複習與結尾', vis: 'chapter', chapter: true,
    chapNo: '8', chapTitle: '複習時間', lines: [
    { who: 'Cooper', action: 'talking', text: '第八章，複習時間到囉！' },
  ]},
  { id: 's31', title: '【複習 1】這塊積木做什麼？', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'gotoMouse', answer: '讓角色移到滑鼠游標的位置', qLine: 1, aLine: 3, lines: [
    { who: 'Cooper', action: 'talking', text: '最後是複習時間！' },
    { who: 'Cooper', action: 'thinking', text: '請問這個程式是用來做什麼的呢？', hold: 5 },
    { who: 'Max', action: 'eureka', text: '我知道！是讓角色跑到滑鼠那裡！' },
    { who: 'Cooper', action: 'guide_right', text: '對，沒錯！這個程式是用來讓角色移到滑鼠游標的位置。', hold: 2 },
  ]},
  { id: 's32', title: '【複習 2】這塊積木做什麼？', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'touching', answer: '偵測有沒有碰到 Sprite1', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '那這一個呢？它是用來做什麼的？', hold: 5 },
    { who: 'Cora', action: 'talking', text: '是在檢查有沒有碰到！' },
    { who: 'Cooper', action: 'guide_right', text: '對，沒錯！這個程式是用來偵測角色有沒有碰到 Sprite1。', hold: 2 },
  ]},
  { id: 's32b', title: '【複習 3】這塊積木做什麼？', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'pointTowards', answer: '讓角色面向滑鼠游標', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '再看一個，這個程式是做什麼用的？', hold: 5 },
    { who: 'Max', action: 'talking', text: '讓貓咪面向滑鼠！' },
    { who: 'Cooper', action: 'guide_right', text: '對，沒錯！這個程式是用來讓角色面向滑鼠游標的。', hold: 2 },
  ]},
  { id: 's32c', title: '【複習 4】這塊積木做什麼？', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'turn15', answer: '讓角色向右旋轉十五度', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '最後一個，這塊你認得嗎？', hold: 5 },
    { who: 'Cora', action: 'encourage', text: '是讓角色轉圈圈的！' },
    { who: 'Cooper', action: 'guide_right', text: '對，沒錯！這個程式是用來讓角色向右旋轉十五度的。', hold: 2 },
    { who: 'Cooper', action: 'talking', text: '四題全對，太厲害了！' },
  ]},

  { id: 's33', title: '今天學了什麼', vis: 'summary', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們來回想一下今天學的東西。' },
    { who: 'Cooper', action: 'guide_right', text: '第一個：如果，幫我們做決定。' },
    { who: 'Cora', action: 'talking', text: '第二個：迴圈，讓事情一直重複。' },
    { who: 'Max', action: 'talking', text: '第三個：變數，是存東西的箱子。' },
    { who: 'Cooper', action: 'thinking', text: '這三個新朋友，你記得幾個呢？', hold: 4 },
    { who: 'Cooper', action: 'talking', text: '你們都記得，好棒！' },
  ]},
  { id: 's34', title: '下課囉', vis: 'ending', lines: [
    { who: 'Cooper', action: 'talking', text: '今天的課就到這裡。' },
    { who: 'Cooper', action: 'talking', text: '回家記得自己做一次貓抓老鼠喔。' },
    { who: 'Cooper', action: 'thinking', text: '今天你最喜歡哪一個部分呢？', hold: 3 },
    { who: 'Max', action: 'goodbye', text: '大家下次見！' },
    { who: 'Cora', action: 'goodbye', text: '拜拜！' },
    { who: 'Cooper', action: 'goodbye', text: '我們下次見，拜拜！' },
  ]},
];
