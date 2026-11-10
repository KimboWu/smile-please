// 拍好沒？v1.02 彩蛋整合版 — 超時限定三人鬼臉合照
'use strict';
    // 固定採用原「挑戰」模式：30 秒、鎖定 4 秒、0.7~1.25 秒換表情。
    const GAME = Object.freeze({ time: 30, lock: 4000, changeMin: 700, changeMax: 1250 });
    let soundOn = true;
    let audioCtx = null;
    const characters = [
      { id:'character01', name:'黑衣造型', expression:'smile', lockedUntil:0, nextChange:0 },
      { id:'character02', name:'帽子造型', expression:'half_closed', lockedUntil:0, nextChange:0 },
      { id:'character03', name:'白衣造型', expression:'looking_around', lockedUntil:0, nextChange:0 }
    ];
    // 表情名稱同時對應素材檔名與拍照結果；任何表情都可以鎖定。
    const expressions = ['smile','half_closed','angry','looking_around','yawn','blank'];
    const expressionText = {
      smile:'微笑中 ✨', half_closed:'半閉眼', angry:'生氣中',
      looking_around:'眼神亂飄', yawn:'打哈欠', blank:'呆滯中', funny_face:'扮鬼臉'
    };
    // A 區：如果三人都是相同表情，就使用專屬標題。
    const uniformTitles = Object.freeze({
      smile:'完美合照！',
      half_closed:'眼睛是怎麼了？',
      angry:'很氣喔！',
      looking_around:'到底在看哪裡？',
      yawn:'沒睡飽是不是？',
      blank:'全員放空中！'
    });
    // C 區：僅從照片裡實際出現的非微笑表情中，隨機抽一句。
    const expressionComments = Object.freeze({
      half_closed:'眼睛張開啦，還在拍照耶！',
      angry:'是在生氣什麼！？',
      looking_around:'偷看帥哥喔？',
      yawn:'這張照片有這麼催眠嗎？',
      blank:'靈魂是不是先下班了？'
    });
    let running = false;
    let deadline = 0;
    let lastClock = -1;
    let lastHint = '';
    let hintUntil = 0;
    let pausedAt = 0;
    let flashPending = false;
    const vibrate = ms => { if (navigator.vibrate) navigator.vibrate(ms); };
    function sound(kind) {
      if (!soundOn) return;
      try {
        const AudioContextType=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextType) return;
        audioCtx=audioCtx||new AudioContextType();
        if(audioCtx.state==='suspended') audioCtx.resume();
        const o=audioCtx.createOscillator(), g=audioCtx.createGain();
        const t=audioCtx.currentTime;
        const frequencies={lock:660,miss:225,shot:390,win:880};
        o.type=kind==='shot'?'triangle':'sine';
        o.frequency.setValueAtTime(frequencies[kind]||550,t);
        if(kind==='win')o.frequency.exponentialRampToValueAtTime(1174,t+.18);
        if(kind==='shot')o.frequency.exponentialRampToValueAtTime(165,t+.13);
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.20);
        o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.21);
      } catch(e) { /* 行動裝置若禁止音訊，遊戲仍正常運作 */ }
    }


    const $ = id => document.getElementById(id);
    const randomBetween = (min,max) => min + Math.random() * (max-min);
    function showScreen(id) { for (const el of document.querySelectorAll('.screen')) el.classList.toggle('active',el.id === id); }

    // 三位造型的六種表情，各自對應一個透明 PNG。
    function spriteSrc(animal, expression) {
      return `assets/characters/${animal.id}/${expression}.png`;
    }
    function characterMarkup(animal, expression, clickable=true, locked=false) {
      const label=locked?`已鎖定${expressionText[expression]}`:expressionText[expression];
      return `<button type="button" class="character${locked?' locked':''}" data-id="${animal.id}" ${clickable?'':'tabindex="-1"'} aria-label="${animal.name}：${label}">
        <img src="${spriteSrc(animal,expression)}" alt="${animal.name}：${label}" draggable="false" decoding="async">
        <span class="name">${animal.name}</span>
        <span class="mood">${locked?`🔒 ${expressionText[expression]}已鎖定`:expressionText[expression]}</span>
        <div class="lock-progress"><span></span></div>
      </button>`;
    }
    // 讓切換表情時只替換對應圖片，不必重建整個角色按鈕。
    function renderCast() {
      const now = performance.now();
      const stage = $('live-cast');
      if (stage.children.length !== characters.length) {
        stage.innerHTML = characters.map(c => characterMarkup(c,c.expression)).join('');
      }
      characters.forEach(c => {
        const btn = stage.querySelector(`[data-id="${c.id}"]`);
        if (!btn) return;
        const locked = c.lockedUntil > now;
        const expr = c.expression; // 鎖定時保留當下表情，而不是改成 smile。
        const img = btn.querySelector('img');
        const src = spriteSrc(c,expr);
        if (img.getAttribute('src') !== src) img.setAttribute('src',src);
        btn.classList.toggle('locked',locked);
        btn.setAttribute('aria-label',`${c.name}：${locked?`已鎖定${expressionText[expr]}`:expressionText[expr]}`);
        img.alt = `${c.name}：${expressionText[expr]}`;
        btn.querySelector('.mood').textContent = locked?`🔒 ${expressionText[expr]}已鎖定`:expressionText[expr];
      });
    }

    function preloadSprites() {
      characters.forEach(c => [...expressions, 'funny_face'].forEach(expr => {
        const image = new Image();
        image.src = spriteSrc(c,expr);
      }));
    }
    preloadSprites();
    $('cover-cast').innerHTML = characters.map(c => `<img src="${spriteSrc(c,'smile')}" alt="${c.name}微笑" draggable="false">`).join('');
    $('sound-btn').addEventListener('click',()=>{
      soundOn=!soundOn;
      $('sound-btn').textContent=soundOn?'🔊':'🔇';
      $('sound-btn').setAttribute('aria-label',soundOn?'關閉音效':'開啟音效');
      if(soundOn)sound('lock');
    });
    $('start-btn').addEventListener('click', startGame);
    $('back-btn').addEventListener('click', () => { running=false; showScreen('start-screen'); });
    $('shutter-btn').addEventListener('click', () => {
      if(!running || flashPending)return;
      if(performance.now()>=deadline){finishGame(true);return;}
      flashPending=true;sound('shot');vibrate(35);
      const flash=$('flash');flash.classList.remove('go');void flash.offsetWidth;flash.classList.add('go');
      // 立即確定快門當下的表情與得分，而不是動畫結束才計算。
      finishGame(false);
      setTimeout(()=>{flashPending=false;},450);
    });
    $('again-btn').addEventListener('click', startGame);
    $('home-btn').addEventListener('click', () => showScreen('start-screen'));
    $('live-cast').addEventListener('click', event => {
      const target = event.target.closest('button.character');
      if (!running || !target) return;
      const animal = characters.find(c=>c.id===target.dataset.id);
      if (!animal) return;
      const now = performance.now();
      if (animal.lockedUntil > now) {
        hint(`${animal.name} 的${expressionText[animal.expression]}已經鎖定囉！`);
      } else {
        animal.lockedUntil = now + GAME.lock;
        hint(`鎖定成功！${animal.name}：${expressionText[animal.expression]}`);
        sound('lock'); vibrate(15);
        renderCast();
        const lockedEl = document.querySelector(`#live-cast [data-id="${animal.id}"]`);
        if(lockedEl){lockedEl.classList.remove('char-pop'); void lockedEl.offsetWidth; lockedEl.classList.add('char-pop'); lockedEl.addEventListener('animationend',()=>lockedEl.classList.remove('char-pop'),{once:true});}
      }
      updateProgress(now);
    });
    function hint(text) { lastHint=text; hintUntil=performance.now()+1900; $('feedback').textContent=text; }
    function nextExpression(animal,now) {
      // 六種表情下稍微提高微笑機率，避免等待過久。
      // 若當前已是微笑，下一次會改為其他表情。
      const choices = expressions.filter(e => e !== animal.expression);
      const weights = choices.map(e => e === 'smile' ? 2.5 : 1);
      let draw = Math.random() * weights.reduce((a,b) => a+b,0);
      let next = choices[choices.length-1];
      for (let i=0;i<choices.length;i++) {
        draw -= weights[i];
        if (draw < 0) { next=choices[i]; break; }
      }
      animal.expression = next;
      animal.nextChange = now + randomBetween(GAME.changeMin,GAME.changeMax);
    }

    function startGame() {
      const now=performance.now();
      running=true; deadline=now + GAME.time*1000; lastClock=-1; pausedAt=0;
      characters.forEach((c,i) => { c.lockedUntil=0; c.expression=['smile','half_closed','looking_around'][i]; c.nextChange=now+randomBetween(GAME.changeMin,GAME.changeMax); });
      renderCast(); updateProgress(now); $('feedback').textContent='點擊角色，鎖住喜歡的表情！';
      lastHint=''; hintUntil=0; $('timer').classList.remove('urgent');
      showScreen('game-screen'); tick();
    }
    function updateProgress(now) {
      const locked=characters.filter(c=>c.lockedUntil>now).length;
      $('locked-count').textContent=`${locked} / ${characters.length}`;
      $('progress-fill').style.width=`${locked/characters.length*100}%`;
      document.querySelectorAll('#live-cast .character').forEach(el => {
        const c=characters.find(x=>x.id===el.dataset.id);
        if (c) el.querySelector('.lock-progress > span').style.width=`${Math.max(0,(c.lockedUntil-now)/GAME.lock*100)}%`;
      });
      $('shutter-btn').classList.toggle('ready',locked===3);
      if (locked===3 && hintUntil<now) $('feedback').textContent='三位的表情都鎖住了！快按快門 📸';
    }
    function tick() {
      if (!running || pausedAt) return;
      const now=performance.now();
      const remaining=Math.max(0,Math.ceil((deadline-now)/1000));
      if (remaining!==lastClock) { lastClock=remaining; $('timer').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`; $('timer').classList.toggle('urgent',remaining<=10); }
      if (remaining===0) { finishGame(true); return; }
      let changed=false;
      for (const c of characters) {
        if (c.lockedUntil>0 && c.lockedUntil<=now) { c.lockedUntil=0; c.nextChange=now+randomBetween(300,800); changed=true; }
        if (!c.lockedUntil && now>=c.nextChange) { nextExpression(c,now); changed=true; }
      }
      if (changed) renderCast();
      updateProgress(now);
      if (hintUntil>0 && now>hintUntil) { hintUntil=0; $('feedback').textContent='點擊角色，鎖住喜歡的表情！'; }
    }
    setInterval(tick, 100);
    document.addEventListener('visibilitychange',()=>{
      const now=performance.now();
      if (!running) return;
      if (document.hidden) pausedAt=now;
      else if (pausedAt) {
        const elapsed=now-pausedAt;
        deadline+=elapsed;
        characters.forEach(c=>{ c.nextChange+=elapsed; if(c.lockedUntil>0)c.lockedUntil+=elapsed; });
        pausedAt=0;
      }
    });
    // 拍照結果以「快門當下顯示的三個表情」為準，不管有沒有鎖定。
    function photoReview(photoExpressions) {
      const allSame=photoExpressions.every(expr=>expr===photoExpressions[0]);
      const smiles=photoExpressions.filter(expr=>expr==='smile').length;
      const title=allSame?uniformTitles[photoExpressions[0]]:'這張表情很豐富喔！';
      // 如果非微笑表情出現重複，只放一個台詞選項；各種表情各有一次抽中機會。
      const candidates=[...new Set(photoExpressions.filter(expr=>expr!=='smile'))];
      const comment=candidates.length===0
        ? '太棒了！三個笑容都被你拍下來了 ♡'
        : expressionComments[candidates[Math.floor(Math.random()*candidates.length)]];
      return {title,smiles,comment};
    }
    function finishGame(timedOut) {
      if (!running) return;
      running=false;
      $('result-screen').classList.toggle('timeout',timedOut);
      $('result-status').textContent=timedOut?'尚未拍照':'拍攝完成';
      $('again-btn').textContent=timedOut?'再試一次 ↻':'再拍一張 ↻';
      if (timedOut) {
        // 倒數結束而未拍照：顯示專屬鬼臉合照，不影響六種一般表情或評分。
        $('result-stars').textContent='';
        $('result-heading').textContent='快門都不會按嗎？';
        $('result-subheading').textContent='0/1 位攝影師成功拍照';
        $('result-msg').textContent='恭喜發現彩蛋';
        $('result-cast').innerHTML=characters.map(c=>characterMarkup(c,'funny_face',false,false)).join('');
      } else {
        // 已拍照：只分析按下快門當下的三個表情。
        const shots=characters.map(c => ({...c,photoExpression:c.expression}));
        const review=photoReview(shots.map(c=>c.photoExpression));
        if(review.smiles===3)sound('win');
        $('result-stars').textContent='★'.repeat(review.smiles)+'☆'.repeat(3-review.smiles);
        $('result-heading').textContent=review.title;
        $('result-subheading').textContent=`${review.smiles} / 3 位成功露出微笑`;
        $('result-msg').textContent=review.comment;
        $('result-cast').innerHTML=shots.map(c=>characterMarkup(c,c.photoExpression,false,false)).join('');
      }
      showScreen('result-screen');
    }
