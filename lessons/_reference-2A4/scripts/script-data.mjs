// 2A4 變數魔法師 — 1~3 年級教學影片講稿資料（單一事實來源）
// vis 對應 build-composition.mjs 裡的畫面組件；teach: true 用統一教室背景
// hold: 該句講完後額外停留秒數（帶做／演示／思考時間）
//
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
  // ===================== 第一部分：開場與引起動機 =====================
  { id: 'c1', title: '章節卡：今天要當變數魔法師', part: '第一部分：開場與引起動機', vis: 'chapter', chapter: true,
    chapNo: '1', chapTitle: '今天要當變數魔法師', lines: [
    { who: 'Cooper', action: 'talking', text: '第一章，今天要當變數魔法師！' },
  ]},

  { id: 's01', title: '三人開場（p.1）', vis: 'title', lines: [
    { who: 'Cooper', action: 'greeting', text: '小朋友大家好！我是 Cooper 老師！' },
    { who: 'Cooper', action: 'talking', text: '在螢幕前面的你，也一起說聲哈囉好嗎？', hold: 2 },
    { who: 'Max', action: 'greeting', text: '大家好，我是 Max！' },
    { who: 'Cora', action: 'greeting', text: '我是 Cora！老師，今天要學什麼呀？' },
    { who: 'Cooper', action: 'talking', text: '今天這堂課，我們要當變數魔法師。' },
    { who: 'Cooper', action: 'guide_right', text: '要做的遊戲叫做——閃電貓飆速！' },
    { who: 'Max', action: 'eureka', text: '閃電貓？聽起來就跑得超快！' },
  ]},

  { id: 's02', title: '今天的四個任務（p.2）', vis: 'goals', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '開始之前，先看看今天的四個任務。' },
    { who: 'Cooper', action: 'guide_right', text: '第一，認識新的積木。' },
    { who: 'Cora', action: 'listening', text: '第二，練習上台說話。' },
    { who: 'Max', action: 'talking', text: '第三，跟著老師做專題。' },
    { who: 'Cooper', action: 'talking', text: '第四，最後還有複習時間喔。' },
    { who: 'Cora', action: 'encourage', text: '四個任務，我們一個一個完成！' },
  ]},

  { id: 's03', title: '誰跑得最快（p.3~4）', vis: 'fastest', lines: [
    { who: 'Cooper', action: 'thinking', text: '先問你一個問題。' },
    { who: 'Cooper', action: 'talking', text: '卡通裡面，哪個角色跑得最快呢？', hold: 4 },
    { who: 'Max', action: 'eureka', text: '我知道！有一個穿銀色衣服、跑很快的！' },
    { who: 'Cora', action: 'talking', text: '他一跑起來，旁邊都變成一條線了。' },
    { who: 'Cooper', action: 'talking', text: '對，跑得快的角色，畫面上都會有速度線。' },
    { who: 'Cooper', action: 'guide_left', text: '那你有沒有發現，他不是一下子就那麼快？' },
    { who: 'Max', action: 'thinking', text: '好像是先慢慢跑，然後越來越快。' },
    { who: 'Cooper', action: 'talking', text: '沒錯！今天我們就要讓貓咪越跑越快。' },
  ]},

  { id: 's03b', title: '先看專題完成的樣子（p.11、p.17）', vis: 'demoVideo', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '動手做之前，先看看做完長什麼樣子。' },
    { who: 'Cooper', action: 'guide_right', text: '你看，貓咪在球場上跑來跑去。' },
    { who: 'Cora', action: 'listening', text: '牠越跑越快，撞到牆壁還會彈回來！' },
    { who: 'Max', action: 'eureka', text: '左上角有一個數字，一直在變耶！' },
    { who: 'Cooper', action: 'talking', text: '那個數字，就是今天最重要的主角。' },
    { who: 'Cooper', action: 'talking', text: '今天下課，你也會做出這個遊戲喔。', hold: 2 },
  ]},

  // ===================== 第二部分：什麼是變數 =====================
  { id: 'c2', title: '章節卡：變數是什麼', part: '第二部分：認識變數', vis: 'chapter', chapter: true,
    chapNo: '2', chapTitle: '變數是什麼', lines: [
    { who: 'Cooper', action: 'talking', text: '第二章，變數是什麼。' },
  ]},

  { id: 's04', title: '變數就是收納箱（p.5~6）', vis: 'varBox', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '小朋友，你們知道變數是什麼嗎？', hold: 4 },
    { who: 'Max', action: 'thinking', text: '變數？聽起來好難喔。' },
    { who: 'Cooper', action: 'talking', text: '一點都不難，老師先問你另一件事。' },
    { who: 'Cooper', action: 'guide_right', text: '你是不是有很多爸爸媽媽買的玩具？' },
    { who: 'Cora', action: 'listening', text: '有！我還有一個裝玩具的箱子。' },
    { who: 'Cooper', action: 'talking', text: '賽車放賽車的箱子，書本放書本的箱子。' },
    { who: 'Cooper', action: 'guide_left', text: '變數，就是電腦裡面的一個箱子。' },
    { who: 'Max', action: 'eureka', text: '喔！可以幫我們把東西收起來！' },
    { who: 'Cooper', action: 'talking', text: '對，變數就是一個可以存東西的箱子。' },
  ]},

  { id: 's05', title: '箱子裡的東西會換', vis: 'varSwap', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '不過這個箱子有一個很厲害的地方。' },
    { who: 'Cooper', action: 'guide_right', text: '裡面的東西，隨時可以換掉。' },
    { who: 'Cooper', action: 'talking', text: '現在放五，等一下可以換成十。' },
    { who: 'Cora', action: 'listening', text: '像我把賽車拿出來，換成小熊一樣。' },
    { who: 'Cooper', action: 'talking', text: '講得真好！所以它才叫做變數。' },
    { who: 'Cooper', action: 'guide_left', text: '變，就是會改變的意思。' },
    { who: 'Max', action: 'talking', text: '會改變的數字，變數！' },
  ]},

  { id: 's06', title: '生活裡的變數（p.7）', vis: 'varLife', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '其實你身上就有好幾個變數喔。' },
    { who: 'Cooper', action: 'guide_right', text: '第一個，你的年紀。' },
    { who: 'Cora', action: 'listening', text: '每過一次生日，年紀就多一歲！' },
    { who: 'Cooper', action: 'talking', text: '第二個，你們班上有幾個人。' },
    { who: 'Max', action: 'talking', text: '有人轉走，人數就會變少。' },
    { who: 'Cooper', action: 'guide_left', text: '第三個，你現在的心情。' },
    { who: 'Cooper', action: 'talking', text: '早上很開心，中午肚子餓就不開心了。' },
    { who: 'Cora', action: 'encourage', text: '原來變數到處都是！' },
  ]},

  { id: 's07', title: '練習題：哪一個是變數', vis: 'quizVarLife', teach: true, quiz: true,
    blockKey: null, lines: [
    { who: 'Cooper', action: 'thinking', text: '換你想一想，哪一個是變數？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是你的名字，B 是你的身高。', hold: 5 },
    { who: 'Max', action: 'thinking', text: '我選 A ！名字最重要！' },
    { who: 'Cooper', action: 'talking', text: '不對喔，你的名字從小到大都一樣。' },
    { who: 'Cora', action: 'talking', text: '那我選 B ，身高會一直長高！' },
    { who: 'Cooper', action: 'talking', text: '答對了！會改變的才叫變數。' },
  ]},

  // ===================== 第三部分：變數住在哪裡、能放什麼 =====================
  { id: 'c3', title: '章節卡：變數裡面放什麼', part: '第三部分：變數住在哪裡、能放什麼', vis: 'chapter', chapter: true,
    chapNo: '3', chapTitle: '變數裡面放什麼', lines: [
    { who: 'Cooper', action: 'talking', text: '第三章，變數裡面放什麼。' },
  ]},

  { id: 's08', title: '桌上與書架（p.8）', vis: 'deskShelf', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '那這些箱子，放在電腦的哪裡呢？' },
    { who: 'Cooper', action: 'guide_right', text: '想像你在寫功課。' },
    { who: 'Cooper', action: 'talking', text: '馬上要用的課本，放在桌上。' },
    { who: 'Max', action: 'talking', text: '這樣一伸手就拿得到！' },
    { who: 'Cooper', action: 'guide_left', text: '暫時用不到的書，放在書架上。' },
    { who: 'Cora', action: 'listening', text: '要用的時候再走過去拿。' },
    { who: 'Cooper', action: 'talking', text: '電腦也一樣，變數就放在它的桌上。' },
    { who: 'Cooper', action: 'talking', text: '所以電腦拿變數，拿得非常快。' },
  ]},

  { id: 's09', title: '變數能放哪幾種東西（p.10）', vis: 'dataTypes', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '箱子裡面可以放四種東西。' },
    { who: 'Cooper', action: 'guide_right', text: '第一種，文字。像你的名字。' },
    { who: 'Cora', action: 'listening', text: 'Cora 也是文字！' },
    { who: 'Cooper', action: 'talking', text: '第二種，整數。像三、四、五十。' },
    { who: 'Max', action: 'talking', text: '就是平常在數的數字。' },
    { who: 'Cooper', action: 'guide_left', text: '第三種，有小數點的數字。' },
    { who: 'Cooper', action: 'talking', text: '像身高一點三公尺，就有小數點。' },
    { who: 'Cooper', action: 'talking', text: '第四種比較特別，我們下一段講。' },
  ]},

  { id: 's10', title: '第四種：是或不是（p.9）', vis: 'boolTF', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '第四種，只有兩個答案。' },
    { who: 'Cooper', action: 'guide_right', text: '是，或者不是。' },
    { who: 'Cooper', action: 'talking', text: '老師問你：你現在肚子餓嗎？', hold: 3 },
    { who: 'Max', action: 'talking', text: '餓！或是不餓！' },
    { who: 'Cooper', action: 'talking', text: '對，答案只有兩種，沒有第三種。' },
    { who: 'Cora', action: 'listening', text: '像電燈開著、還是關著。' },
    { who: 'Cooper', action: 'talking', text: '講得很好，這種變數就像一個開關。' },
  ]},

  { id: 's11', title: '練習題：這是哪一種', vis: 'quizType', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '換你想一想。' },
    { who: 'Cooper', action: 'guide_right', text: '你今年幾歲，是哪一種東西呢？', hold: 5 },
    { who: 'Max', action: 'thinking', text: '嗯……是文字嗎？' },
    { who: 'Cooper', action: 'talking', text: '不是喔，歲數是用數的。' },
    { who: 'Cora', action: 'talking', text: '那是整數！八歲、九歲、十歲！' },
    { who: 'Cooper', action: 'talking', text: '答對了！歲數是整數。' },
  ]},

  // ===================== 第四部分：準備我們的球場 =====================
  { id: 'c4', title: '章節卡：準備我們的球場', part: '第四部分：準備角色、背景與變數', vis: 'chapter', chapter: true,
    chapNo: '4', chapTitle: '準備我們的球場', lines: [
    { who: 'Cooper', action: 'talking', text: '第四章，準備我們的球場。' },
  ]},

  { id: 's12', title: '選貓咪和球場（p.12）', vis: 'pickStage', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '現在打開 Scratch，我們要準備兩樣東西。' },
    { who: 'Cooper', action: 'guide_right', text: '第一樣，角色選這隻橘色的貓咪。' },
    { who: 'Cora', action: 'listening', text: '牠的名字叫 Cat 2 。' },
    { who: 'Cooper', action: 'guide_left', text: '第二樣，背景選這個綠色的足球場。' },
    { who: 'Max', action: 'talking', text: '它的名字是 Soccer 2 ！' },
    { who: 'Cooper', action: 'talking', text: '貓咪加上球場，我們的舞台就完成了。' },
  ]},

  { id: 'd01', title: '實作示範：加入貓咪與球場', vis: 'demoShots', teach: true, demo: 'stage', lines: [
    { who: 'Cooper', action: 'talking', text: '說完了，我們真的做一次給你看。' },
    { who: 'Cooper', action: 'guide_right', text: '先按右下角這個角色按鈕。' },
    { who: 'Cooper', action: 'talking', text: '在上面的格子裡，找到這隻貓咪。' },
    { who: 'Cora', action: 'listening', text: '按下去，貓咪就跑到舞台上了！' },
    { who: 'Cooper', action: 'guide_left', text: '再按最右邊的背景按鈕。' },
    { who: 'Cooper', action: 'talking', text: '找到 Soccer 2 這個足球場，按一下。' },
    { who: 'Max', action: 'eureka', text: '哇，貓咪站在球場中間了！' },
    { who: 'Cooper', action: 'thinking', text: '你也做到了嗎？沒有的話先暫停影片。', hold: 5 },
  ]},

  { id: 's13', title: '建立 steps 變數（p.13）', vis: 'makeVar', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '接下來，我們要做今天的主角。' },
    { who: 'Cooper', action: 'guide_right', text: '左邊的積木，找到橘色的變數。' },
    { who: 'Cooper', action: 'talking', text: '最上面有一個按鈕，叫做建立一個變數。' },
    { who: 'Max', action: 'thinking', text: '下面本來就有一個 my variable 耶。' },
    { who: 'Cooper', action: 'talking', text: '那是電腦先幫你放的，我們不用它。' },
    { who: 'Cooper', action: 'guide_left', text: '我們自己做一個，名字叫做 steps 。' },
    { who: 'Cora', action: 'listening', text: 'steps 就是步數的意思！' },
    { who: 'Cooper', action: 'talking', text: '對，它要記住貓咪一次走幾步。' },
  ]},

  { id: 'd02', title: '實作示範：建立 steps 變數', vis: 'demoShots', teach: true, demo: 'makevar', lines: [
    { who: 'Cooper', action: 'talking', text: '我們真的來做一個變數。' },
    { who: 'Cooper', action: 'guide_right', text: '按下建立一個變數。' },
    { who: 'Cooper', action: 'talking', text: '會跳出一個小視窗，要你打名字。' },
    { who: 'Cooper', action: 'talking', text: '打上 steps ，然後按確定。' },
    { who: 'Cora', action: 'listening', text: '橘色的 steps 出現在下面了！' },
    { who: 'Max', action: 'eureka', text: '舞台左上角也跑出一個 steps ！' },
    { who: 'Cooper', action: 'thinking', text: '你也做到了嗎？沒有的話先暫停影片。', hold: 5 },
  ]},

  { id: 's14', title: '舞台上看得到 steps', vis: 'monitorShow', teach: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '你看舞台的左上角。' },
    { who: 'Cooper', action: 'talking', text: '這個小牌子，就是我們的箱子。' },
    { who: 'Cooper', action: 'talking', text: '左邊寫著箱子的名字，steps 。' },
    { who: 'Cooper', action: 'guide_left', text: '右邊橘色的地方，是箱子裡的東西。' },
    { who: 'Max', action: 'talking', text: '現在裡面放著十！' },
    { who: 'Cooper', action: 'talking', text: '等一下貓咪跑起來，這個數字會一直變。' },
    { who: 'Cora', action: 'encourage', text: '這樣就看得到變數在做什麼了！' },
  ]},

  // ===================== 第五部分：寫出發的程式 =====================
  { id: 'c5', title: '章節卡：寫出發的程式', part: '第五部分：貓咪的出發程式', vis: 'chapter', chapter: true,
    chapNo: '5', chapTitle: '寫出發的程式', lines: [
    { who: 'Cooper', action: 'talking', text: '第五章，寫出發的程式。' },
  ]},

  { id: 's15', title: '綠旗開始', vis: 'blockFlag', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '每個程式，都要有一個開始的積木。' },
    { who: 'Cooper', action: 'guide_right', text: '就是這一塊，當綠旗被點擊。' },
    { who: 'Cora', action: 'listening', text: '按下綠旗，程式就開始跑。' },
    { who: 'Cooper', action: 'talking', text: '綠旗在舞台的右上角，這裡。' },
    { who: 'Max', action: 'talking', text: '旁邊紅色的是停止！' },
    { who: 'Cooper', action: 'talking', text: '對，一個開始，一個停下來。' },
  ]},

  { id: 's16', title: '出發前的四件事（p.14）', vis: 'initBlocks', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '按下綠旗以後，貓咪要先做四件事。' },
    { who: 'Cooper', action: 'guide_right', text: '第一件，走到球場正中間。' },
    { who: 'Cooper', action: 'talking', text: '第二件，只能左右轉，不能翻跟斗。' },
    { who: 'Max', action: 'thinking', text: '不然貓咪會頭下腳上耶！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，那樣就變成倒立貓了。' },
    { who: 'Cooper', action: 'guide_left', text: '第三件，把箱子裡的數字設成零。' },
    { who: 'Cora', action: 'listening', text: '一開始不能動，所以是零。' },
    { who: 'Cooper', action: 'talking', text: '第四件，把貓咪縮小成六十趴。' },
    { who: 'Max', action: 'talking', text: '這樣球場才看起來比較大！' },
  ]},

  { id: 's16b', title: '★ 出發程式完整長這樣（p.14）', vis: 'codeInit', teach: true, code: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把這四塊排起來，看完整的樣子。' },
    { who: 'Cooper', action: 'guide_right', text: '最上面是當綠旗被點擊。' },
    { who: 'Cooper', action: 'talking', text: '接著是移到中間，零和負五十五。' },
    { who: 'Max', action: 'talking', text: '負五十五，就是再往下面一點點！' },
    { who: 'Cooper', action: 'talking', text: '再來是設定旋轉方式，左右翻轉。' },
    { who: 'Cooper', action: 'guide_left', text: '然後把 steps 設為零。' },
    { who: 'Cooper', action: 'talking', text: '最後把尺寸設為六十趴。' },
    { who: 'Cora', action: 'listening', text: '五塊積木，一塊接一塊！' },
    { who: 'Cooper', action: 'thinking', text: '暫停影片，照著螢幕排排看。', hold: 6 },
  ]},

  { id: 'd03', title: '實作示範：排出發的程式', vis: 'demoShots', teach: true, demo: 'init', lines: [
    { who: 'Cooper', action: 'talking', text: '我們真的來排一次。' },
    { who: 'Cooper', action: 'guide_right', text: '先從事件裡，拖出當綠旗被點擊。' },
    { who: 'Cooper', action: 'talking', text: '再從動作裡，拖出移到位置這一塊。' },
    { who: 'Cooper', action: 'talking', text: '接上去以後，把數字改成零和負五十五。' },
    { who: 'Cora', action: 'listening', text: '要按一下白色的圈圈才能打字！' },
    { who: 'Cooper', action: 'guide_left', text: '再拖出設定旋轉方式，選左右翻轉。' },
    { who: 'Cooper', action: 'talking', text: '最後補上設定 steps ，還有尺寸六十。' },
    { who: 'Max', action: 'eureka', text: '五塊都黏在一起了！' },
    { who: 'Cooper', action: 'thinking', text: '你也做到了嗎？沒有的話先暫停影片。', hold: 5 },
  ]},

  { id: 's17', title: '練習題：為什麼要設成零', vis: 'quizZero', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '考考你，為什麼一開始要設成零？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是想讓貓咪站著不動。', hold: 5 },
    { who: 'Max', action: 'thinking', text: 'B 是想讓貓咪跑很快？' },
    { who: 'Cooper', action: 'talking', text: '我選 A 才對喔。' },
    { who: 'Cora', action: 'talking', text: '因為零步，就是一步都不走！' },
    { who: 'Cooper', action: 'talking', text: '答對了，先站好，等一下才慢慢加速。' },
  ]},

  // ===================== 第六部分：讓貓咪越跑越快 =====================
  { id: 'c6', title: '章節卡：讓貓咪越跑越快', part: '第六部分：加速程式', vis: 'chapter', chapter: true,
    chapNo: '6', chapTitle: '讓貓咪越跑越快', lines: [
    { who: 'Cooper', action: 'talking', text: '第六章，讓貓咪越跑越快。' },
  ]},

  { id: 's18', title: '重複三百次（迴圈）', vis: 'repeatIntro', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '你有沒有在操場上跑過步？' },
    { who: 'Cooper', action: 'talking', text: '老師說跑五圈，你會怎麼跑？', hold: 3 },
    { who: 'Cora', action: 'listening', text: '跑完一圈，再跑一圈，跑五次！' },
    { who: 'Cooper', action: 'talking', text: '對，同樣的事情做很多次。' },
    { who: 'Cooper', action: 'guide_right', text: '程式裡有一塊積木專門做這件事。' },
    { who: 'Cooper', action: 'talking', text: '它叫做重複，我們讓它做三百次。' },
    { who: 'Max', action: 'eureka', text: '三百次！那要跑好久！' },
    { who: 'Cooper', action: 'talking', text: '放在它肚子裡的積木，就會做三百次。' },
  ]},

  { id: 's19', title: '用變數當步數', vis: 'moveSteps', teach: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '肚子裡的第一塊，是移動。' },
    { who: 'Cooper', action: 'talking', text: '可是你看，格子裡不是數字。' },
    { who: 'Max', action: 'thinking', text: '是那個橘色的 steps ！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，我們把箱子塞進格子裡了。' },
    { who: 'Cooper', action: 'guide_left', text: '箱子裡放二，貓咪就走兩步。' },
    { who: 'Cora', action: 'listening', text: '箱子裡放十，就走十步！' },
    { who: 'Cooper', action: 'talking', text: '這就是變數最厲害的地方。' },
    { who: 'Cooper', action: 'talking', text: '不用改積木，只要換箱子裡的數字。' },
  ]},

  { id: 's20', title: '每一圈都加一', vis: 'changeSteps', teach: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '第二塊，把 steps 改變一。' },
    { who: 'Cooper', action: 'talking', text: '改變一，就是箱子裡的數字加一。' },
    { who: 'Cooper', action: 'talking', text: '零變一，一變二，二變三。' },
    { who: 'Cora', action: 'listening', text: '每跑一次，就多走一步！' },
    { who: 'Cooper', action: 'thinking', text: '那你猜猜看，貓咪會怎麼樣？', hold: 4 },
    { who: 'Max', action: 'eureka', text: '會越跑越快！' },
    { who: 'Cooper', action: 'talking', text: '答對了，這就是閃電貓的祕密。' },
  ]},

  { id: 's21', title: '碰到邊緣就反彈', vis: 'bounce', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '貓咪一直往前跑，會跑去哪裡？', hold: 3 },
    { who: 'Max', action: 'thinking', text: '會跑出畫面外面吧！' },
    { who: 'Cooper', action: 'talking', text: '所以要加上第三塊積木。' },
    { who: 'Cooper', action: 'guide_right', text: '碰到邊緣就反彈。' },
    { who: 'Cora', action: 'listening', text: '像球撞到牆壁會彈回來！' },
    { who: 'Cooper', action: 'talking', text: '講得真好，貓咪就會在球場裡跑來跑去。' },
  ]},

  { id: 's22', title: '換下一個造型', vis: 'nextCostume', teach: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '第四塊，下一個造型。' },
    { who: 'Cooper', action: 'talking', text: '這隻貓咪有兩張圖片。' },
    { who: 'Cooper', action: 'talking', text: '一張左腳在前，一張右腳在前。' },
    { who: 'Max', action: 'talking', text: '換來換去，就像在走路！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，卡通就是這樣做出來的。' },
    { who: 'Cora', action: 'encourage', text: '貓咪真的在跑步了！' },
  ]},

  { id: 's22b', title: '★ 加速程式完整長這樣（p.15）', vis: 'codeSpeedUp', teach: true, code: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把加速的部分排起來看看。' },
    { who: 'Cooper', action: 'guide_right', text: '上面五塊，是剛剛出發的程式。' },
    { who: 'Cora', action: 'listening', text: '這五塊我們已經排好了！' },
    { who: 'Cooper', action: 'talking', text: '下面接上一塊重複三百次。' },
    { who: 'Cooper', action: 'guide_left', text: '肚子裡放四塊：移動、改變、反彈、造型。' },
    { who: 'Cooper', action: 'thinking', text: '這四塊的順序可以換嗎？', hold: 4 },
    { who: 'Max', action: 'thinking', text: '應該可以吧，反正都在肚子裡。' },
    { who: 'Cooper', action: 'talking', text: '不行喔，要先走，才知道有沒有碰到邊緣。' },
    { who: 'Cora', action: 'listening', text: '順序換了就會怪怪的。' },
    { who: 'Cooper', action: 'thinking', text: '暫停影片，照著螢幕排排看。', hold: 6 },
  ]},

  { id: 'd04', title: '實作示範：排加速的程式', vis: 'demoShots', teach: true, demo: 'speedup', lines: [
    { who: 'Cooper', action: 'talking', text: '我們真的來排一次。' },
    { who: 'Cooper', action: 'guide_right', text: '從控制裡，拖出重複十次這一塊。' },
    { who: 'Cooper', action: 'talking', text: '把十改成三百。' },
    { who: 'Cooper', action: 'talking', text: '再從動作裡，拖出移動十步放進肚子。' },
    { who: 'Cora', action: 'listening', text: '然後把橘色的 steps 拖進格子裡！' },
    { who: 'Cooper', action: 'guide_left', text: '接著補上改變 steps 、反彈、下一個造型。' },
    { who: 'Cooper', action: 'talking', text: '排好以後，按綠旗跑跑看。' },
    { who: 'Max', action: 'eureka', text: '貓咪真的越跑越快了！' },
    { who: 'Cooper', action: 'thinking', text: '你也做到了嗎？沒有的話先暫停影片。', hold: 5 },
  ]},

  { id: 's23', title: '練習題：改變二會怎樣', vis: 'quizChange', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '考考你，如果改成改變二呢？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是加速變得更快。B 是貓咪停下來。', hold: 5 },
    { who: 'Max', action: 'thinking', text: '我選 B ，數字變大就會卡住！' },
    { who: 'Cooper', action: 'talking', text: '不對喔，數字變大是走更多步。' },
    { who: 'Cora', action: 'talking', text: '那我選 A ，一次加二會更快！' },
    { who: 'Cooper', action: 'talking', text: '答對了，加得越多，衝得越快。' },
  ]},

  // ===================== 第七部分：讓貓咪慢慢停下來 =====================
  { id: 'c7', title: '章節卡：讓貓咪慢慢停下來', part: '第七部分：減速程式與成果', vis: 'chapter', chapter: true,
    chapNo: '7', chapTitle: '讓貓咪慢慢停下來', lines: [
    { who: 'Cooper', action: 'talking', text: '第七章，讓貓咪慢慢停下來。' },
  ]},

  { id: 's24', title: '把一變成負一', vis: 'minusOne', teach: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '貓咪一直加速，最後會怎麼樣？', hold: 3 },
    { who: 'Cora', action: 'listening', text: '會快到看不見吧！' },
    { who: 'Cooper', action: 'talking', text: '所以我們要讓牠慢下來。' },
    { who: 'Cooper', action: 'guide_right', text: '再接一塊重複三百次，裡面幾乎一樣。' },
    { who: 'Cooper', action: 'talking', text: '只有一個地方不同：改變負一。' },
    { who: 'Max', action: 'thinking', text: '負一？那是什麼？' },
    { who: 'Cooper', action: 'talking', text: '加一是變多，負一就是變少。' },
    { who: 'Cooper', action: 'guide_left', text: '十變九，九變八，一直減到零。' },
    { who: 'Cora', action: 'encourage', text: '數字變成零，貓咪就停下來了！' },
  ]},

  { id: 's24b', title: '★ 減速的那一段（p.16）', vis: 'codeSlowDown', teach: true, code: true, lines: [
    { who: 'Cooper', action: 'guide_right', text: '我們把減速這一段放大看。' },
    { who: 'Cooper', action: 'talking', text: '一樣是重複三百次。' },
    { who: 'Cooper', action: 'talking', text: '一樣是移動 steps 步。' },
    { who: 'Cooper', action: 'guide_left', text: '只有這裡不一樣，改變負一。' },
    { who: 'Max', action: 'eureka', text: '只差一個減號！' },
    { who: 'Cooper', action: 'talking', text: '對，一個小小的減號，就從加速變減速。' },
  ]},

  { id: 's24c', title: '★ 整支程式的樣子（p.16）', vis: 'codeFull', teach: true, code: true, lines: [
    { who: 'Cooper', action: 'talking', text: '這是今天完整的程式。' },
    { who: 'Cooper', action: 'guide_right', text: '最上面五塊，是出發前的準備。' },
    { who: 'Cooper', action: 'talking', text: '中間這一段，讓貓咪越跑越快。' },
    { who: 'Cooper', action: 'guide_left', text: '最下面這一段，讓貓咪慢慢停下來。' },
    { who: 'Cora', action: 'listening', text: '三段合起來，就是閃電貓！' },
    { who: 'Cooper', action: 'thinking', text: '暫停影片，照著螢幕排排看。', hold: 6 },
  ]},

  { id: 'd05', title: '實作示範：排減速的程式', vis: 'demoShots', teach: true, demo: 'slowdown', lines: [
    { who: 'Cooper', action: 'talking', text: '最後一段，我們一起排完。' },
    { who: 'Cooper', action: 'guide_right', text: '再拖一塊重複三百次，接在下面。' },
    { who: 'Cooper', action: 'talking', text: '裡面的四塊，跟上面完全一樣。' },
    { who: 'Cooper', action: 'guide_left', text: '只要把改變的一，改成負一。' },
    { who: 'Cora', action: 'listening', text: '要先打一個減號，再打一！' },
    { who: 'Cooper', action: 'talking', text: '好了，按下綠旗看看。' },
    { who: 'Max', action: 'eureka', text: '貓咪衝出去，然後慢慢停下來了！' },
    { who: 'Cooper', action: 'thinking', text: '你也做到了嗎？沒有的話先暫停影片。', hold: 5 },
  ]},

  { id: 's25', title: '成果展示（p.17）', vis: 'demoVideo2', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '我們一起看完成的樣子。' },
    { who: 'Cooper', action: 'guide_right', text: '一開始貓咪很慢，幾乎沒在動。' },
    { who: 'Cora', action: 'listening', text: '左上角的數字慢慢變大了！' },
    { who: 'Max', action: 'eureka', text: '越來越快，撞牆還會彈回來！' },
    { who: 'Cooper', action: 'talking', text: '然後數字開始變小，貓咪就慢下來。' },
    { who: 'Cooper', action: 'talking', text: '這一切，都是那個箱子在控制的。' },
    { who: 'Cora', action: 'encourage', text: '變數魔法師真的太厲害了！' },
  ]},

  { id: 's26', title: '練習題：數字變成零', vis: 'quizStop', teach: true, quiz: true, lines: [
    { who: 'Cooper', action: 'thinking', text: '最後一題，箱子裡變成零會怎樣？' },
    { who: 'Cooper', action: 'guide_right', text: 'A 是貓咪停住。B 是貓咪倒著走。', hold: 5 },
    { who: 'Max', action: 'thinking', text: '我選 B ，會倒退嚕！' },
    { who: 'Cooper', action: 'talking', text: '零不是負的，所以不會倒退。' },
    { who: 'Cora', action: 'talking', text: '那是 A ，走零步就是不動！' },
    { who: 'Cooper', action: 'talking', text: '答對了，走零步，就停在原地。' },
  ]},

  // ===================== 第八部分：上台說話的禮貌 =====================
  { id: 'c8', title: '章節卡：上台說話的禮貌', part: '第八部分：練習演說表達', vis: 'chapter', chapter: true,
    chapNo: '8', chapTitle: '上台說話的禮貌', lines: [
    { who: 'Cooper', action: 'talking', text: '第八章，上台說話的禮貌。' },
  ]},

  { id: 's27', title: '為什麼要有禮貌（p.18）', vis: 'manner', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '做完專題，我們要上台分享。' },
    { who: 'Cooper', action: 'thinking', text: '你覺得上台的時候，最重要的是什麼？', hold: 4 },
    { who: 'Max', action: 'thinking', text: '要講得很大聲嗎？' },
    { who: 'Cooper', action: 'talking', text: '大聲很好，不過還有更基本的。' },
    { who: 'Cora', action: 'listening', text: '是禮貌嗎？' },
    { who: 'Cooper', action: 'talking', text: '對！禮貌是一個人最基本的樣子。' },
    { who: 'Cooper', action: 'guide_right', text: '上台的人有禮貌，台下的人也要有。' },
  ]},

  { id: 's28', title: '站姿五個重點（p.19）', vis: 'posture', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '上台的時候，站姿有五個重點。' },
    { who: 'Cooper', action: 'guide_right', text: '第一，兩腳張開，跟肩膀一樣寬。' },
    { who: 'Cooper', action: 'talking', text: '第二，背挺直，頭抬起來。' },
    { who: 'Cora', action: 'listening', text: '不要駝背！' },
    { who: 'Cooper', action: 'talking', text: '第三，肩膀放輕鬆，不要聳起來。' },
    { who: 'Cooper', action: 'guide_left', text: '第四，手自然放在身體兩邊。' },
    { who: 'Max', action: 'talking', text: '不要一直摸衣服對不對？' },
    { who: 'Cooper', action: 'talking', text: '沒錯。第五，眼睛看著前面的人。' },
    { who: 'Cooper', action: 'thinking', text: '現在站起來，跟著做一次。', hold: 6 },
  ]},

  { id: 's29', title: '當聽眾的禮貌（p.20）', vis: 'audience', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '換到台下，聽別人講的時候呢？' },
    { who: 'Cooper', action: 'guide_right', text: '第一，坐好，兩隻手放在腿上。' },
    { who: 'Cora', action: 'listening', text: '抬頭挺胸，不要趴在桌上。' },
    { who: 'Cooper', action: 'talking', text: '第二，別人在講的時候不要插話。' },
    { who: 'Max', action: 'thinking', text: '那想問問題怎麼辦？' },
    { who: 'Cooper', action: 'talking', text: '等他講完，舉手再問。' },
    { who: 'Cooper', action: 'guide_left', text: '第三，講完要拍拍手給他鼓勵。' },
    { who: 'Cora', action: 'encourage', text: '拍手會讓上台的人很開心！' },
  ]},

  // ===================== 第九部分：複習時間 =====================
  { id: 'c9', title: '章節卡：複習時間', part: '第九部分：複習時間', vis: 'chapter', chapter: true,
    chapNo: '9', chapTitle: '複習時間', lines: [
    { who: 'Cooper', action: 'talking', text: '第九章，複習時間。' },
  ]},

  { id: 'r01', title: '複習一：set steps to 0（p.21）', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'setsteps', answer: '把箱子裡的數字設成零', qLine: 1, aLine: 3, lines: [
    { who: 'Cooper', action: 'talking', text: '我們把今天的積木複習一次。' },
    { who: 'Cooper', action: 'thinking', text: '第一塊，這個程式是用來做什麼的呢？', hold: 5 },
    { who: 'Cora', action: 'talking', text: '是把 steps 變成零！' },
    { who: 'Cooper', action: 'talking', text: '對，這塊是把箱子裡的數字設成零。' },
  ]},

  { id: 'r02', title: '複習二：set rotation style（p.21）', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'rotation', answer: '讓角色只能左右翻轉', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '第二塊，這個是用來做什麼的呢？', hold: 5 },
    { who: 'Max', action: 'eureka', text: '是不要讓貓咪倒立的那個！' },
    { who: 'Cooper', action: 'talking', text: '對，這塊是讓角色只能左右翻轉。' },
  ]},

  { id: 'r03', title: '複習三：if on edge, bounce（p.21）', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'bounce', answer: '碰到邊緣就彈回來', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '第三塊，這個你認得嗎？', hold: 5 },
    { who: 'Cora', action: 'talking', text: '碰到牆壁會彈回來的那一塊！' },
    { who: 'Cooper', action: 'talking', text: '答對了，這塊是碰到邊緣就彈回來。' },
  ]},

  { id: 'r04', title: '複習四：change steps by 1（p.21）', vis: 'reviewQ', teach: true, quiz: true,
    blockKey: 'changesteps', answer: '把箱子裡的數字加一', qLine: 0, aLine: 2, lines: [
    { who: 'Cooper', action: 'thinking', text: '最後一塊，這個是做什麼的呢？', hold: 5 },
    { who: 'Max', action: 'eureka', text: '每跑一次就多一步，越來越快！' },
    { who: 'Cooper', action: 'talking', text: '沒錯，這塊是把箱子裡的數字加一。' },
  ]},

  { id: 's32', title: '今天學到的三件事', vis: 'summary', teach: true, lines: [
    { who: 'Cooper', action: 'talking', text: '今天我們學了三件事。' },
    { who: 'Cooper', action: 'guide_right', text: '第一，變數就是一個可以存東西的箱子。' },
    { who: 'Cora', action: 'listening', text: '第二，箱子裡的數字可以一直改變。' },
    { who: 'Max', action: 'talking', text: '第三，換數字就能讓貓咪變快變慢！' },
    { who: 'Cooper', action: 'talking', text: '你已經是一個小小的變數魔法師了。' },
  ]},

  { id: 's33', title: '道別', vis: 'ending', lines: [
    { who: 'Cooper', action: 'talking', text: '回家記得再做一次給爸爸媽媽看。' },
    { who: 'Cora', action: 'goodbye', text: '今天大家都好棒，掰掰！' },
    { who: 'Max', action: 'goodbye', text: '下次見囉！' },
    { who: 'Cooper', action: 'goodbye', text: '我們下一堂課再見，掰掰！' },
  ]},
];
