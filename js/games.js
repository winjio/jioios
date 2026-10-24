// ============ GAMES (all 25) ============
// 7 UP DOWN
let udChoice = 'up', udExact = 7;
document.querySelectorAll('[data-ud]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-ud]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); udChoice = b.dataset.ud;
  document.getElementById('udExactRow').style.display = udChoice==='seven'?'flex':'none';
}));
document.querySelectorAll('[data-udn]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-udn]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); udExact = +b.dataset.udn;
  document.querySelectorAll('[data-ud]').forEach(x=>x.classList.remove('active'));
  document.querySelector('[data-ud="seven"]').classList.add('active');
  udChoice = 'seven'; document.getElementById('udExactRow').style.display='flex';
}));
document.getElementById('udRoll').addEventListener('click',()=>{
  const m=document.getElementById('udMsg'); if(!canBet(m)) return;
  const btn = document.getElementById('udRoll'); btn.disabled = true;
  const d1 = document.getElementById('ud1'), d2 = document.getElementById('ud2');
  d1.classList.add('rolling'); d2.classList.add('rolling');
  document.getElementById('udSum').textContent = 'Sum: -'; m.textContent = 'Rolling...';
  let ticks = 0;
  const iv = setInterval(()=>{
    d1.textContent = DICE[Math.floor(Math.random()*6)]; d2.textContent = DICE[Math.floor(Math.random()*6)];
    snd(400+Math.random()*200,0.03,'square',0.02);
    if(++ticks > 15){clearInterval(iv); finish();}
  }, 70);
  function finish(){
    d1.classList.remove('rolling'); d2.classList.remove('rolling');
    const a = Math.floor(Math.random()*6)+1, b = Math.floor(Math.random()*6)+1;
    d1.textContent = DICE[a-1]; d2.textContent = DICE[b-1];
    const sum = a+b, isDouble = a === b;
    document.getElementById('udSum').textContent = `Sum: ${sum} ${isDouble?'(DOUBLE!)':''}`;
    snd(600,0.08,'sine',0.04);
    if(udChoice === 'seven'){
      const pay = {2:30,3:20,4:15,5:12,6:10,8:10,9:12,10:15,11:20,12:30};
      if(sum === udExact){
        const mult = udExact===7?5:(pay[udExact]||5);
        addWin(BET*mult); m.textContent=`EXACT ${sum}! +${BET*(mult-1)} 🎉`; winChime();
      } else { m.textContent=`Sum ${sum} — wrong. Lost.`; loseSnd(); }
    } else if(isDouble){ m.textContent = `${sum} (DOUBLE) — House wins!`; loseSnd(); }
    else if(udChoice === 'up'){
      if(sum > 7){ addWin(BET*2); m.textContent = `${sum} — 7 UP wins! +${BET} 🎉`; winChime(); }
      else { m.textContent = `${sum} — 7 DOWN won. Lost.`; loseSnd(); }
    } else {
      if(sum < 7){ addWin(BET*2); m.textContent = `${sum} — 7 DOWN wins! +${BET} 🎉`; winChime(); }
      else { m.textContent = `${sum} — 7 UP won. Lost.`; loseSnd(); }
    }
    btn.disabled = false;
  }
});

// BLACKJACK
const bj = {deck:[],player:[],dealer:[],active:false};
const bjPEl = document.getElementById('bjP'), bjDEl = document.getElementById('bjD');
function bjRender(hide=true){
  bjPEl.innerHTML = bj.player.map(c=>cardHTML(c)).join('');
  bjDEl.innerHTML = bj.dealer.map((c,i)=>(i===0||!hide)?cardHTML(c):cardHTML(c,true)).join('');
  document.getElementById('bjPScore').textContent = bjScore(bj.player);
  document.getElementById('bjDScore').textContent = hide?'?':bjScore(bj.dealer);
}
document.getElementById('bjDeal').addEventListener('click',()=>{
  const m=document.getElementById('bjMsg'); if(bj.active) return; if(!canBet(m)) return;
  bj.deck=newDeck(); bj.player=[bj.deck.pop(),bj.deck.pop()]; bj.dealer=[bj.deck.pop(),bj.deck.pop()];
  bj.active=true; m.textContent='Hit or Stand?';
  document.getElementById('bjDeal').disabled=true; document.getElementById('bjHit').disabled=false; document.getElementById('bjStand').disabled=false;
  bjRender(true); snd(600,0.08,'sine',0.04);
  if(bjScore(bj.player)===21) setTimeout(bjStand,400);
});
document.getElementById('bjHit').addEventListener('click',()=>{
  if(!bj.active) return;
  bj.player.push(bj.deck.pop()); snd(500,0.05,'square',0.03); bjRender(true);
  if(bjScore(bj.player)>21){
    bjRender(false); document.getElementById('bjMsg').textContent='BUST! Lost.'; loseSnd();
    bj.active=false; document.getElementById('bjDeal').disabled=false;
    document.getElementById('bjHit').disabled=true; document.getElementById('bjStand').disabled=true;
  }
});
function bjStand(){
  if(!bj.active) return;
  bj.active=false;
  document.getElementById('bjHit').disabled=true; document.getElementById('bjStand').disabled=true;
  while(bjScore(bj.dealer)<17) bj.dealer.push(bj.deck.pop());
  const cards = bjDEl.querySelectorAll('.card');
  if(cards[0]) cards[0].classList.add('flipping');
  setTimeout(()=>{
    bjRender(false);
    const p=bjScore(bj.player), d=bjScore(bj.dealer); const m=document.getElementById('bjMsg');
    if(d>21){addWin(BET*2); m.textContent=`Dealer bust — +${BET}!`; winChime();}
    else if(p>d){addWin(BET*2); m.textContent=`You win — +${BET}!`; winChime();}
    else if(p===d){addWin(BET); m.textContent='Push.'; snd(600,0.08,'sine',0.04);}
    else{m.textContent='Dealer wins.'; loseSnd();}
    document.getElementById('bjDeal').disabled=false;
  },300);
}
document.getElementById('bjStand').addEventListener('click',bjStand);

// BACCARAT
let baccChoice='player';
document.querySelectorAll('[data-bacc]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-bacc]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); baccChoice=b.dataset.bacc;
}));
function baccVal(v){return v>=10?0:v}
document.getElementById('baccDeal').addEventListener('click',()=>{
  const m=document.getElementById('baccMsg'); if(!canBet(m)) return;
  const deck = newDeck();
  const player=[deck.pop(),deck.pop()], banker=[deck.pop(),deck.pop()];
  const pSum=()=>player.reduce((a,c)=>a+baccVal(c.v),0)%10;
  const bSum=()=>banker.reduce((a,c)=>a+baccVal(c.v),0)%10;
  if(pSum()<=5) player.push(deck.pop());
  if(bSum()<=5) banker.push(deck.pop());
  document.getElementById('baccP').innerHTML = player.map(c=>cardHTML(c)).join('');
  document.getElementById('baccB').innerHTML = banker.map(c=>cardHTML(c)).join('');
  snd(600,0.08,'sine',0.04);
  const p=pSum(), b=bSum(); const winner = p>b?'player':b>p?'banker':'tie';
  if(winner===baccChoice){
    const mult = winner==='tie'?8:winner==='banker'?1.95:2;
    addWin(Math.round(BET*mult)); m.textContent=`${winner.toUpperCase()} (${p}-${b}) — +${Math.round(BET*mult)-BET}!`; winChime();
  } else { m.textContent=`${winner.toUpperCase()} (${p}-${b}) — lost.`; loseSnd(); }
});

// ROULETTE
let rouChoice='red';
document.querySelectorAll('[data-rou]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-rou]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); rouChoice=b.dataset.rou;
}));
document.getElementById('rouSpin').addEventListener('click',()=>{
  const m=document.getElementById('rouMsg'); if(!canBet(m)) return;
  const el=document.getElementById('rouResult'); el.className='roulette-result spin'; el.textContent='?';
  snd(500,0.1,'sawtooth',0.03);
  let ticks=0;
  const iv=setInterval(()=>{
    el.textContent=Math.floor(Math.random()*37); snd(650,0.02,'square',0.015);
    if(++ticks>18){clearInterval(iv);finish();}
  },60);
  function finish(){
    const n=Math.floor(Math.random()*37); el.textContent=n; el.classList.remove('spin');
    const color = n===0?'green':(n%2===0?'black':'red');
    el.className='roulette-result '+color;
    let win=0;
    if(rouChoice==='red'&&color==='red') win=BET*2;
    else if(rouChoice==='black'&&color==='black') win=BET*2;
    else if(rouChoice==='green'&&color==='green') win=BET*14;
    else if(rouChoice==='odd'&&color!=='green'&&n%2===1) win=BET*2;
    else if(rouChoice==='even'&&color!=='green'&&n%2===0) win=BET*2;
    else if(rouChoice==='low'&&color!=='green'&&n>=1&&n<=18) win=BET*2;
    else if(rouChoice==='high'&&color!=='green'&&n>=19&&n<=36) win=BET*2;
    if(win){addWin(win); m.textContent=`${n} ${color.toUpperCase()} — +${win-BET}!`; winChime();}
    else{m.textContent=`${n} ${color.toUpperCase()} — lost.`; loseSnd();}
  }
});

// DRAGON TIGER
let dtChoice='dragon';
document.querySelectorAll('[data-dt]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-dt]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); dtChoice=b.dataset.dt;
}));
document.getElementById('dtDeal').addEventListener('click',()=>{
  const m=document.getElementById('dtMsg'); if(!canBet(m)) return;
  const deck=newDeck(); const d=deck.pop(), t=deck.pop();
  document.getElementById('dtD').innerHTML=cardHTML(d);
  document.getElementById('dtT').innerHTML=cardHTML(t);
  snd(600,0.08,'sine',0.04);
  const dv=d.v===1?14:d.v, tv=t.v===1?14:t.v;
  const winner = dv>tv?'dragon':tv>dv?'tiger':'tie';
  if(dtChoice===winner){
    const mult = winner==='tie'?8:2;
    addWin(BET*mult); m.textContent=`${winner.toUpperCase()} — +${BET*mult-BET}!`; winChime();
  } else { m.textContent=`${winner.toUpperCase()} — lost.`; loseSnd(); }
});

// ANDAR BAHAR
let abChoice='andar';
document.querySelectorAll('[data-ab]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-ab]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); abChoice=b.dataset.ab;
}));
document.getElementById('abDeal').addEventListener('click',()=>{
  const m=document.getElementById('abMsg'); if(!canBet(m)) return;
  const deck=newDeck(); const joker=deck.pop();
  document.getElementById('abJ').innerHTML=cardHTML(joker);
  const andar=[], bahar=[]; let winner=null;
  while(!winner){
    andar.push(deck.pop());
    if(andar[andar.length-1].v===joker.v){winner='andar';break;}
    bahar.push(deck.pop());
    if(bahar[bahar.length-1].v===joker.v){winner='bahar';break;}
  }
  document.getElementById('abA').innerHTML=andar.map(c=>cardHTML(c)).join('');
  document.getElementById('abB').innerHTML=bahar.map(c=>cardHTML(c)).join('');
  snd(600,0.08,'sine',0.04);
  if(abChoice===winner){addWin(BET*2); m.textContent=`${winner.toUpperCase()} — +${BET}!`; winChime();}
  else{m.textContent=`${winner.toUpperCase()} — lost.`; loseSnd();}
});

// TEEN PATTI
document.getElementById('tpDeal').addEventListener('click',()=>{
  const m=document.getElementById('tpMsg'); if(!canBet(m)) return;
  const deck=newDeck();
  const p=[deck.pop(),deck.pop(),deck.pop()]; const d=[deck.pop(),deck.pop(),deck.pop()];
  document.getElementById('tpP').innerHTML=p.map(c=>cardHTML(c)).join('');
  document.getElementById('tpD').innerHTML=d.map(c=>cardHTML(c)).join('');
  snd(600,0.08,'sine',0.04);
  const c = cmp3(p,d);
  if(c>0){addWin(BET*2); m.textContent=`You win — +${BET}!`; winChime();}
  else if(c<0){m.textContent='Dealer wins.'; loseSnd();}
  else {addWin(BET); m.textContent='Tie — push.'; snd(600,0.08,'sine',0.04);}
});

// SIC BO
let sbChoice='small';
document.querySelectorAll('[data-sb]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-sb]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); sbChoice=b.dataset.sb;
}));
document.getElementById('sbRoll').addEventListener('click',()=>{
  const m=document.getElementById('sbMsg'); if(!canBet(m)) return;
  const btn=document.getElementById('sbRoll'); btn.disabled=true;
  const d1=document.getElementById('sb1'), d2=document.getElementById('sb2'), d3=document.getElementById('sb3');
  d1.classList.add('rolling'); d2.classList.add('rolling'); d3.classList.add('rolling');
  let ticks=0;
  const iv=setInterval(()=>{
    d1.textContent=DICE[Math.floor(Math.random()*6)]; d2.textContent=DICE[Math.floor(Math.random()*6)]; d3.textContent=DICE[Math.floor(Math.random()*6)];
    snd(400+Math.random()*200,0.03,'square',0.02);
    if(++ticks>15){clearInterval(iv);finish();}
  },70);
  function finish(){
    d1.classList.remove('rolling'); d2.classList.remove('rolling'); d3.classList.remove('rolling');
    const a=Math.floor(Math.random()*6)+1, b=Math.floor(Math.random()*6)+1, c=Math.floor(Math.random()*6)+1;
    d1.textContent=DICE[a-1]; d2.textContent=DICE[b-1]; d3.textContent=DICE[c-1];
    const sum=a+b+c; const isTrip = a===b && b===c;
    let win=0, label='';
    if(sbChoice==='triple' && isTrip){win=BET*30; label=`Triple ${a}!`;}
    else if(sbChoice==='small' && !isTrip && sum>=4 && sum<=10){win=BET*2; label=`Small ${sum}`;}
    else if(sbChoice==='big' && !isTrip && sum>=11 && sum<=17){win=BET*2; label=`Big ${sum}`;}
    if(win){addWin(win); m.textContent=`${label} — +${win-BET}!`; winChime();}
    else{m.textContent=`Sum ${sum}${isTrip?' (Triple)':''} — lost.`; loseSnd();}
    btn.disabled=false;
  }
});

// HI-LO
let hlChoice='hi';
document.querySelectorAll('[data-hl]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-hl]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); hlChoice=b.dataset.hl;
}));
document.getElementById('hlPlay').addEventListener('click',()=>{
  const m=document.getElementById('hlMsg'); if(!canBet(m)) return;
  const deck=newDeck(); const cur=deck.pop(), next=deck.pop();
  document.getElementById('hlCard').innerHTML = cardHTML(cur)+cardHTML(next);
  snd(600,0.08,'sine',0.04);
  const cv=cur.v===1?14:cur.v, nv=next.v===1?14:next.v;
  const win = (hlChoice==='hi' && nv>cv) || (hlChoice==='lo' && nv<cv);
  if(win){addWin(BET*2); m.textContent=`Correct — +${BET}!`; winChime();}
  else if(nv===cv){addWin(BET); m.textContent='Same — push.'; snd(600,0.08,'sine',0.04);}
  else{m.textContent='Wrong.'; loseSnd();}
});

// WAR
document.getElementById('warPlay').addEventListener('click',()=>{
  const m=document.getElementById('warMsg'); if(!canBet(m)) return;
  const deck=newDeck(); const pc=deck.pop(), dc=deck.pop();
  document.getElementById('warP').innerHTML=cardHTML(pc);
  document.getElementById('warD').innerHTML=cardHTML(dc);
  snd(600,0.08,'sine',0.04);
  const pv=pc.v===1?14:pc.v, dv=dc.v===1?14:dc.v;
  if(pv>dv){addWin(BET*2); m.textContent=`You win — +${BET}!`; winChime();}
  else if(pv<dv){m.textContent='Dealer wins.'; loseSnd();}
  else{addWin(BET); m.textContent='War — push.'; snd(600,0.08,'sine',0.04);}
});

// 3-CARD POKER
document.getElementById('tcpDeal').addEventListener('click',()=>{
  const m=document.getElementById('tcpMsg'); if(!canBet(m)) return;
  const deck=newDeck();
  const p=[deck.pop(),deck.pop(),deck.pop()]; const d=[deck.pop(),deck.pop(),deck.pop()];
  document.getElementById('tcpP').innerHTML=p.map(c=>cardHTML(c)).join('');
  document.getElementById('tcpD').innerHTML=d.map(c=>cardHTML(c)).join('');
  snd(600,0.08,'sine',0.04);
  const dRank = threeCat(d); const dQualifies = (dRank.cat>1) || (dRank.v[0]>=12);
  if(!dQualifies){addWin(BET); m.textContent='Dealer not qualified — ante returned.'; snd(600,0.08,'sine',0.04); return;}
  const c = cmp3(p,d);
  if(c>0){addWin(BET*2); m.textContent=`You win — +${BET}!`; winChime();}
  else if(c<0){m.textContent='Dealer wins.'; loseSnd();}
  else{addWin(BET); m.textContent='Tie — push.'; snd(600,0.08,'sine',0.04);}
});

// TEXAS HOLD'EM
document.getElementById('heDeal').addEventListener('click',()=>{
  const m=document.getElementById('heMsg'); if(!canBet(m)) return;
  const deck=newDeck();
  const p=[deck.pop(),deck.pop()]; const d=[deck.pop(),deck.pop()];
  const c=[deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
  document.getElementById('heP').innerHTML=p.map(x=>cardHTML(x)).join('');
  document.getElementById('heD').innerHTML=d.map(x=>cardHTML(x)).join('');
  document.getElementById('heC').innerHTML=c.map(x=>cardHTML(x)).join('');
  snd(600,0.08,'sine',0.04);
  setTimeout(()=>{
    const pe = best5of7([...p,...c]); const de = best5of7([...d,...c]);
    const cmp = cmpEval(pe, de);
    if(cmp>0){addWin(BET*2); m.textContent=`You win — ${handName(pe)} +${BET}!`; winChime();}
    else if(cmp<0){m.textContent=`Dealer wins — ${handName(de)}.`; loseSnd();}
    else{addWin(BET); m.textContent=`Tie (${handName(pe)}) — push.`; snd(600,0.08,'sine',0.04);}
  },400);
});

// CARIBBEAN STUD
const CB_PAY = {1:1, 2:1, 3:2, 4:3, 5:4, 6:6, 7:10, 8:20, 9:50, 10:100};
const cb = {deck:[], p:[], d:[], dealt:false};
document.getElementById('cbDeal').addEventListener('click',()=>{
  const m=document.getElementById('cbMsg'); if(!canBet(m)) return;
  cb.deck = newDeck();
  cb.p = [cb.deck.pop(),cb.deck.pop(),cb.deck.pop(),cb.deck.pop(),cb.deck.pop()];
  cb.d = [cb.deck.pop(),cb.deck.pop(),cb.deck.pop(),cb.deck.pop(),cb.deck.pop()];
  cb.dealt = true;
  document.getElementById('cbP').innerHTML = cb.p.map(c=>cardHTML(c)).join('');
  document.getElementById('cbD').innerHTML = cb.d.map((c,i)=>i===0?cardHTML(c):cardHTML(c,true)).join('');
  document.getElementById('cbDeal').disabled=true; document.getElementById('cbRaise').disabled=false; document.getElementById('cbFold').disabled=false;
  m.textContent='Raise or Fold?'; snd(600,0.08,'sine',0.04);
});
document.getElementById('cbFold').addEventListener('click',()=>{
  if(!cb.dealt) return;
  document.getElementById('cbMsg').textContent='Folded — lost ante.'; loseSnd();
  cb.dealt=false; document.getElementById('cbDeal').disabled=false;
  document.getElementById('cbRaise').disabled=true; document.getElementById('cbFold').disabled=true;
});
document.getElementById('cbRaise').addEventListener('click',()=>{
  if(!cb.dealt) return;
  if(balance < BET*2){document.getElementById('cbMsg').textContent='Not enough coins!'; return;}
  balance -= BET*2; upd();
  document.getElementById('cbD').innerHTML = cb.d.map(c=>cardHTML(c)).join('');
  const m=document.getElementById('cbMsg');
  const dEval = evalHand(cb.d);
  const qualifies = dEval[0]>=2 || (dEval[0]===1 && dEval[1]===14 && dEval[2]===13);
  if(!qualifies){ addWin(BET*4); m.textContent=`Dealer no qualify — +${BET}!`; winChime(); }
  else {
    const pEval = evalHand(cb.p); const cmp = cmpEval(pEval, dEval);
    if(cmp>0){
      const raisePay = CB_PAY[pEval[0]] || 1;
      const totalReturn = BET*4 + BET*2*raisePay;
      addWin(totalReturn); m.textContent=`${handName(pEval)} — +${totalReturn-BET*3}!`; winChime();
    } else if(cmp<0){ m.textContent=`Dealer wins with ${handName(dEval)} — lost.`; loseSnd(); }
    else { addWin(BET*3); m.textContent='Tie — push.'; snd(600,0.08,'sine',0.04); }
  }
  cb.dealt=false; document.getElementById('cbDeal').disabled=false;
  document.getElementById('cbRaise').disabled=true; document.getElementById('cbFold').disabled=true;
});

// RED DOG
document.getElementById('rdDeal').addEventListener('click',()=>{
  const m=document.getElementById('rdMsg'); if(!canBet(m)) return;
  const deck=newDeck();
  let a = deck.pop(), b = deck.pop();
  while(a.v === b.v){ b = deck.pop(); }
  const rdV = c => c.v === 1 ? 14 : c.v;
  const hi = rdV(a) > rdV(b) ? a : b; const lo = rdV(a) > rdV(b) ? b : a;
  const spread = rdV(hi) - rdV(lo);
  document.getElementById('rdC').innerHTML = cardHTML(lo) + cardHTML(hi);
  document.getElementById('rdSpread').textContent = 'Spread: ' + spread;
  snd(600,0.08,'sine',0.04);
  if(spread === 1){ addWin(BET); m.textContent='Consecutive — push.'; snd(600,0.08,'sine',0.04); return; }
  const third = deck.pop();
  document.getElementById('rdC').innerHTML += cardHTML(third);
  const tv = rdV(third);
  if(tv === rdV(hi) || tv === rdV(lo)){ addWin(BET); m.textContent='Third matched — push.'; snd(600,0.08,'sine',0.04); return; }
  if(tv > rdV(lo) && tv < rdV(hi)){
    const mult = spread === 2 ? 5 : spread === 3 ? 4 : spread === 4 ? 2 : 1;
    addWin(BET*(mult+1)); m.textContent=`Inside! ${mult}:1 — +${BET*mult}!`; winChime();
  } else { m.textContent='Outside — lost.'; loseSnd(); }
});

// POKER DICE
document.getElementById('pdRoll').addEventListener('click',()=>{
  const m=document.getElementById('pdMsg'); if(!canBet(m)) return;
  const dice = [0,1,2,3,4].map(()=>Math.floor(Math.random()*6)+1);
  document.getElementById('pdDice').innerHTML = dice.map(d=>`<div class="die">${DICE[d-1]}</div>`).join('');
  snd(500,0.08,'sine',0.04);
  const cnt={}; dice.forEach(d=>cnt[d]=(cnt[d]||0)+1);
  const freq = Object.values(cnt).sort((a,b)=>b-a);
  let payout = 0, name = 'Nothing';
  if(freq[0]===5){payout=50; name='Five of a Kind';}
  else if(freq[0]===4){payout=15; name='Four of a Kind';}
  else if(freq[0]===3 && freq[1]===2){payout=10; name='Full House';}
  else if(freq.length===5){payout=8; name='Straight';}
  else if(freq[0]===3){payout=4; name='Three of a Kind';}
  else if(freq[0]===2 && freq[1]===2){payout=2; name='Two Pair';}
  else if(freq[0]===2){payout=1; name='One Pair';}
  if(payout>0){addWin(BET*payout); m.textContent=`${name} — +${BET*(payout-1)}!`; winChime();}
  else{m.textContent='No hand — lost.'; loseSnd();}
});

// CRAPS
const crState = {active:false, point:0, comeOut:true};
document.getElementById('crRoll').addEventListener('click',()=>{
  const m=document.getElementById('crMsg');
  if(!crState.active){ if(!canBet(m)) return; crState.active=true; crState.comeOut=true; crState.point=0; }
  const d1=document.getElementById('cr1'), d2=document.getElementById('cr2');
  d1.classList.add('rolling'); d2.classList.add('rolling');
  let ticks=0;
  const iv=setInterval(()=>{
    d1.textContent=DICE[Math.floor(Math.random()*6)]; d2.textContent=DICE[Math.floor(Math.random()*6)];
    snd(400+Math.random()*200,0.03,'square',0.02);
    if(++ticks>12){clearInterval(iv);finish();}
  },70);
  function finish(){
    d1.classList.remove('rolling'); d2.classList.remove('rolling');
    const a=Math.floor(Math.random()*6)+1, b=Math.floor(Math.random()*6)+1;
    d1.textContent=DICE[a-1]; d2.textContent=DICE[b-1];
    const sum=a+b;
    if(crState.comeOut){
      if(sum===7||sum===11){addWin(BET*2); m.textContent=`Come-out ${sum} — win! +${BET}!`; winChime(); crState.active=false;}
      else if(sum===2||sum===3||sum===12){m.textContent=`Come-out ${sum} — craps, lose.`; loseSnd(); crState.active=false;}
      else{crState.comeOut=false; crState.point=sum; document.getElementById('crPoint').textContent = 'Point: '+sum; m.textContent=`Point ${sum} set. Roll again!`;}
    } else {
      if(sum===crState.point){addWin(BET*2); m.textContent=`Rolled point ${sum} — win! +${BET}!`; winChime(); crState.active=false; crState.comeOut=true; document.getElementById('crPoint').textContent='Point: -';}
      else if(sum===7){m.textContent='Seven out! Lost.'; loseSnd(); crState.active=false; crState.comeOut=true; document.getElementById('crPoint').textContent='Point: -';}
      else{m.textContent=`Rolled ${sum}. Keep rolling for ${crState.point}.`;}
    }
  }
});

// FISH-PRAWN-CRAB
const FPC = ['🐟','🦐','🦀','🐓','🎃','🪙'];
let fpcChoice = 0;
document.querySelectorAll('[data-fpc]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-fpc]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); fpcChoice=+b.dataset.fpc;
}));
document.getElementById('fpcPlay').addEventListener('click',()=>{
  const m=document.getElementById('fpcMsg'); if(!canBet(m)) return;
  const dice = [0,1,2].map(()=>Math.floor(Math.random()*6));
  ['fp1','fp2','fp3'].forEach((id,i)=>{ document.getElementById(id).textContent = FPC[dice[i]]; });
  snd(500,0.08,'sine',0.04);
  const matches = dice.filter(d=>d===fpcChoice).length;
  if(matches>0){ addWin(BET*(matches+1)); m.textContent=`${matches} match(es)! — +${BET*matches}!`; winChime(); }
  else { m.textContent='No matches — lost.'; loseSnd(); }
});

// MONEY WHEEL
const MW_SEGS = [0,0,0,0,2,2,2,2,5,5,10,20];
document.getElementById('mwSpin').addEventListener('click',()=>{
  const m=document.getElementById('mwMsg'); if(!canBet(m)) return;
  const el=document.getElementById('mwResult'); el.className='roulette-result spin'; el.textContent='?';
  snd(500,0.1,'sawtooth',0.03);
  let ticks=0;
  const iv=setInterval(()=>{
    el.textContent = MW_SEGS[Math.floor(Math.random()*MW_SEGS.length)]+'x';
    snd(650,0.02,'square',0.015);
    if(++ticks>20){clearInterval(iv);finish();}
  },60);
  function finish(){
    const seg = MW_SEGS[Math.floor(Math.random()*MW_SEGS.length)];
    el.textContent = seg+'x'; el.classList.remove('spin');
    if(seg>=2){ addWin(BET*seg); m.textContent = `${seg}x — +${BET*(seg-1)}!`; winChime(); }
    else { m.textContent = 'Bust — lost.'; loseSnd(); }
  }
});

// CASINO WAR
const cw = {player:null, dealer:null, active:false};
document.getElementById('cwDeal').addEventListener('click',()=>{
  const m=document.getElementById('cwMsg'); if(cw.active) return; if(!canBet(m)) return;
  const deck = newDeck(); cw.player = deck.pop(); cw.dealer = deck.pop(); cw.active = true;
  document.getElementById('cwP').innerHTML = cardHTML(cw.player);
  document.getElementById('cwD').innerHTML = cardHTML(cw.dealer);
  document.getElementById('cwDeal').disabled = true;
  document.getElementById('cwWar').disabled = true; document.getElementById('cwSurrender').disabled = true;
  snd(600,0.08,'sine',0.04);
  const pv = cw.player.v===1?14:cw.player.v; const dv = cw.dealer.v===1?14:cw.dealer.v;
  if(pv > dv){ addWin(BET*2); m.textContent=`You win — +${BET}!`; winChime(); cw.active=false; document.getElementById('cwDeal').disabled=false; }
  else if(pv < dv){ m.textContent='Dealer wins.'; loseSnd(); cw.active=false; document.getElementById('cwDeal').disabled=false; }
  else { m.textContent='TIE! Surrender or War?'; document.getElementById('cwWar').disabled = false; document.getElementById('cwSurrender').disabled = false; }
});
document.getElementById('cwSurrender').addEventListener('click',()=>{
  if(!cw.active) return;
  addWin(Math.floor(BET/2));
  document.getElementById('cwMsg').textContent = 'Surrendered — lost half.'; loseSnd();
  cw.active=false; document.getElementById('cwDeal').disabled=false;
  document.getElementById('cwWar').disabled=true; document.getElementById('cwSurrender').disabled=true;
});
document.getElementById('cwWar').addEventListener('click',()=>{
  if(!cw.active) return;
  const m = document.getElementById('cwMsg');
  if(balance < BET){m.textContent='Not enough coins!'; return;}
  balance -= BET; upd();
  document.getElementById('cwWar').disabled = true; document.getElementById('cwSurrender').disabled = true;
  m.textContent = 'WAR! Dealing...';
  setTimeout(()=>{
    const deck = newDeck(); const p2 = deck.pop(), d2 = deck.pop();
    document.getElementById('cwP').innerHTML = cardHTML(cw.player)+cardHTML(p2);
    document.getElementById('cwD').innerHTML = cardHTML(cw.dealer)+cardHTML(d2);
    const pv = p2.v===1?14:p2.v; const dv = d2.v===1?14:d2.v;
    if(pv > dv){ addWin(BET*4); m.textContent=`War win! +${BET*3}!`; winChime(); }
    else if(pv < dv){ m.textContent='War lost.'; loseSnd(); }
    else { addWin(BET*2); m.textContent='War tie — push.'; snd(600,0.08,'sine',0.04); }
    cw.active = false; document.getElementById('cwDeal').disabled=false;
  }, 600);
});

// PONTOON
const pon = {deck:[], player:[], dealer:[], active:false};
function ponRender(hide=true){
  document.getElementById('ponP').innerHTML = pon.player.map(c=>cardHTML(c)).join('');
  document.getElementById('ponD').innerHTML = pon.dealer.map((c,i)=>(i===0||!hide)?cardHTML(c):cardHTML(c,true)).join('');
  document.getElementById('ponPScore').textContent = bjScore(pon.player);
  document.getElementById('ponDScore').textContent = hide?'?':bjScore(pon.dealer);
}
function ponFinish(){
  if(!pon.active) return;
  pon.active = false;
  document.getElementById('ponHit').disabled=true; document.getElementById('ponStand').disabled=true;
  while(true){
    const [sum, soft] = bjScoreSoft(pon.dealer);
    if(sum < 17 || (sum === 17 && soft)) pon.dealer.push(pon.deck.pop());
    else break;
  }
  const pCards = pon.player.length; const pScore = bjScore(pon.player); const dScore = bjScore(pon.dealer);
  const m = document.getElementById('ponMsg');
  setTimeout(()=>{
    ponRender(false);
    const isPontoon = pCards === 2 && pScore === 21;
    const isFiveCard = pCards === 5 && pScore <= 21;
    if(pScore > 21){ m.textContent='BUST! Lost.'; loseSnd(); }
    else if(dScore > 21){ addWin(BET*2); m.textContent='Dealer bust — +'+BET+'!'; winChime(); }
    else if(isPontoon){ addWin(BET*3); m.textContent='PONTOON! +'+(BET*2)+'!'; winChime(); }
    else if(isFiveCard){ addWin(BET*3); m.textContent='5-Card Trick! +'+(BET*2)+'!'; winChime(); }
    else if(pScore > dScore){ addWin(BET*2); m.textContent='You win — +'+BET+'!'; winChime(); }
    else if(pScore < dScore){ m.textContent='Dealer wins.'; loseSnd(); }
    else { addWin(BET); m.textContent='Push.'; snd(600,0.08,'sine',0.04); }
    document.getElementById('ponDeal').disabled=false;
  }, 300);
}
document.getElementById('ponDeal').addEventListener('click',()=>{
  const m = document.getElementById('ponMsg');
  if(pon.active) return; if(!canBet(m)) return;
  pon.deck = newDeck();
  pon.player = [pon.deck.pop(), pon.deck.pop()]; pon.dealer = [pon.deck.pop(), pon.deck.pop()];
  pon.active = true; m.textContent = 'Hit or Stand?';
  document.getElementById('ponDeal').disabled = true;
  document.getElementById('ponHit').disabled = false; document.getElementById('ponStand').disabled = false;
  ponRender(true); snd(600,0.08,'sine',0.04);
  if(bjScore(pon.player) === 21) setTimeout(ponFinish, 500);
});
document.getElementById('ponHit').addEventListener('click',()=>{
  if(!pon.active) return;
  pon.player.push(pon.deck.pop()); snd(500,0.05,'square',0.03); ponRender(true);
  const score = bjScore(pon.player);
  if(score > 21){
    document.getElementById('ponHit').disabled=true; document.getElementById('ponStand').disabled=true;
    pon.active = false; ponRender(false);
    document.getElementById('ponMsg').textContent='BUST! Lost.'; loseSnd();
    document.getElementById('ponDeal').disabled=false;
  } else if(pon.player.length === 5){ ponFinish(); }
});
document.getElementById('ponStand').addEventListener('click',ponFinish);

// LET IT RIDE
const lir = {player:[], community:[], bet1:0, bet2:0, bet3:0, active:false, stage:0};
document.getElementById('lirDeal').addEventListener('click',()=>{
  const m = document.getElementById('lirMsg');
  if(lir.active) return; if(!canBet(m, BET*3)) return;
  lir.player = []; lir.community = []; lir.bet1 = BET; lir.bet2 = BET; lir.bet3 = BET;
  lir.active = true; lir.stage = 1;
  const deck = newDeck();
  lir.player = [deck.pop(), deck.pop(), deck.pop()];
  lir.community = [deck.pop(), deck.pop()];
  document.getElementById('lirP').innerHTML = lir.player.map(c=>cardHTML(c)).join('');
  document.getElementById('lirC').innerHTML = '<div class="card back">X</div><div class="card back">X</div>';
  document.getElementById('lirDeal').disabled = true;
  document.getElementById('lirPull1').disabled = false; document.getElementById('lirRide').disabled = false;
  m.textContent = 'Pull back bet 1 or Let It Ride?'; snd(600,0.08,'sine',0.04);
});
function lirReveal1(){
  document.getElementById('lirC').innerHTML = cardHTML(lir.community[0]) + '<div class="card back">X</div>';
  document.getElementById('lirPull1').disabled = true; document.getElementById('lirPull2').disabled = false;
  lir.stage = 2; document.getElementById('lirMsg').textContent = 'Pull back bet 2 or Let It Ride?';
  snd(600,0.08,'sine',0.04);
}
document.getElementById('lirPull1').addEventListener('click',()=>{
  if(lir.stage !== 1) return;
  addWin(BET); lir.bet1 = 0; snd(500,0.05,'square',0.03); lirReveal1();
});
document.getElementById('lirPull2').addEventListener('click',()=>{
  if(lir.stage !== 2) return;
  addWin(BET); lir.bet2 = 0; snd(500,0.05,'square',0.03); lir.stage = 3; lirFinish();
});
document.getElementById('lirRide').addEventListener('click',()=>{
  if(lir.stage === 1) lirReveal1();
  else if(lir.stage === 2){ lir.stage = 3; lirFinish(); }
});
function lirFinish(){
  document.getElementById('lirC').innerHTML = lir.community.map(c=>cardHTML(c)).join('');
  document.getElementById('lirPull2').disabled = true; document.getElementById('lirRide').disabled = true;
  const ev = evalHand([...lir.player, ...lir.community]);
  const pay = {1:0, 2:1, 3:2, 4:3, 5:5, 6:8, 7:11, 8:50, 9:200, 10:1000};
  const m = document.getElementById('lirMsg');
  const totalBet = lir.bet1 + lir.bet2 + lir.bet3;
  if(ev[0] === 2){
    const pairVal = ev[1];
    if(pairVal >= 10){ addWin(totalBet * 2); m.textContent = `Pair 10s+ — 1:1 win!`; winChime(); }
    else { m.textContent = `Pair below 10s — lost.`; loseSnd(); }
  } else if(ev[0] >= 3){
    const mult = pay[ev[0]] || 0;
    if(mult > 0){ addWin(totalBet * (1 + mult)); m.textContent = `${handName(ev)} — ${mult}:1! +${totalBet * mult}!`; winChime(); }
    else { m.textContent = 'No win.'; loseSnd(); }
  } else { m.textContent = `High card — no win.`; loseSnd(); }
  setTimeout(()=>{ lir.active = false; document.getElementById('lirDeal').disabled = false; }, 400);
}

// CHUCK-A-LUCK
let calChoice = '1';
document.querySelectorAll('[data-cal]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-cal]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); calChoice = b.dataset.cal;
}));
document.getElementById('calRoll').addEventListener('click',()=>{
  const m = document.getElementById('calMsg'); if(!canBet(m)) return;
  const btn = document.getElementById('calRoll'); btn.disabled = true;
  const dice = [1,2,3].map(()=>Math.floor(Math.random()*6)+1);
  ['cal1','cal2','cal3'].forEach(id=>document.getElementById(id).classList.add('rolling'));
  let ticks=0;
  const iv=setInterval(()=>{
    ['cal1','cal2','cal3'].forEach(id=>{ document.getElementById(id).textContent = DICE[Math.floor(Math.random()*6)]; });
    snd(400+Math.random()*200,0.03,'square',0.02);
    if(++ticks>15){clearInterval(iv);finish();}
  },70);
  function finish(){
    ['cal1','cal2','cal3'].forEach((id,i)=>{ const el = document.getElementById(id); el.classList.remove('rolling'); el.textContent = DICE[dice[i]-1]; });
    const sum = dice.reduce((a,b)=>a+b, 0); const isTrip = dice[0]===dice[1] && dice[1]===dice[2];
    if(calChoice === 'big' || calChoice === 'small'){
      if(isTrip){ m.textContent = `Triple ${dice[0]}! House wins.`; loseSnd(); }
      else if((calChoice === 'big' && sum >= 11) || (calChoice === 'small' && sum <= 10)){ addWin(BET*2); m.textContent = `${sum} — ${calChoice.toUpperCase()} +${BET}!`; winChime(); }
      else { m.textContent = `${sum} — lost.`; loseSnd(); }
    } else {
      const target = +calChoice;
      const matches = dice.filter(d=>d===target).length;
      if(matches === 0){ m.textContent = `No ${target}s — lost.`; loseSnd(); }
      else { const mult = matches === 1 ? 1 : matches === 2 ? 2 : 10; addWin(BET*(1+mult)); m.textContent = `${matches} x ${target} — ${mult}:1! +${BET*mult}!`; winChime(); }
    }
    btn.disabled = false;
  }
});

// BJ SWITCH
const bjs = {deck:[], h1:[], h2:[], dealer:[], active:false, h1Done:false, h2Done:false, bet:20};
function bjsRender(hide=true){
  document.getElementById('bjsH1').innerHTML = bjs.h1.map(c=>cardHTML(c)).join('');
  document.getElementById('bjsH2').innerHTML = bjs.h2.map(c=>cardHTML(c)).join('');
  document.getElementById('bjsD').innerHTML = bjs.dealer.map((c,i)=>(i===0||!hide)?cardHTML(c):cardHTML(c,true)).join('');
  document.getElementById('bjsS1').textContent = bjScore(bjs.h1);
  document.getElementById('bjsS2').textContent = bjScore(bjs.h2);
  document.getElementById('bjsDScore').textContent = hide?'?':bjScore(bjs.dealer);
}
document.getElementById('bjsDeal').addEventListener('click',()=>{
  const m = document.getElementById('bjsMsg');
  if(bjs.active) return; if(!canBet(m, 20)) return;
  bjs.deck = newDeck();
  bjs.h1 = [bjs.deck.pop(), bjs.deck.pop()]; bjs.h2 = [bjs.deck.pop(), bjs.deck.pop()];
  bjs.dealer = [bjs.deck.pop(), bjs.deck.pop()];
  bjs.active = true; bjs.h1Done = false; bjs.h2Done = false;
  document.getElementById('bjsDeal').disabled = true; document.getElementById('bjsSwitch').disabled = false;
  document.getElementById('bjsHit1').disabled = false; document.getElementById('bjsStand1').disabled = false;
  document.getElementById('bjsHit2').disabled = false; document.getElementById('bjsStand2').disabled = false;
  m.textContent = 'Switch 2nd cards or play?'; bjsRender(true); snd(600,0.08,'sine',0.04);
});
document.getElementById('bjsSwitch').addEventListener('click',()=>{
  if(!bjs.active) return;
  const tmp = bjs.h1[1]; bjs.h1[1] = bjs.h2[1]; bjs.h2[1] = tmp;
  document.getElementById('bjsSwitch').disabled = true;
  document.getElementById('bjsMsg').textContent = 'Cards switched!';
  bjsRender(true); snd(500,0.08,'sine',0.04);
});
function bjsCheckDone(){ if(bjs.h1Done && bjs.h2Done) bjsFinish(); }
document.getElementById('bjsHit1').addEventListener('click',()=>{
  if(!bjs.active || bjs.h1Done) return;
  bjs.h1.push(bjs.deck.pop()); bjsRender(true); snd(500,0.05,'square',0.03);
  if(bjScore(bjs.h1) > 21){ bjs.h1Done = true; document.getElementById('bjsHit1').disabled=true; document.getElementById('bjsStand1').disabled=true; bjsCheckDone(); }
});
document.getElementById('bjsStand1').addEventListener('click',()=>{
  if(!bjs.active || bjs.h1Done) return;
  bjs.h1Done = true; document.getElementById('bjsHit1').disabled=true; document.getElementById('bjsStand1').disabled=true; bjsCheckDone();
});
document.getElementById('bjsHit2').addEventListener('click',()=>{
  if(!bjs.active || bjs.h2Done) return;
  bjs.h2.push(bjs.deck.pop()); bjsRender(true); snd(500,0.05,'square',0.03);
  if(bjScore(bjs.h2) > 21){ bjs.h2Done = true; document.getElementById('bjsHit2').disabled=true; document.getElementById('bjsStand2').disabled=true; bjsCheckDone(); }
});
document.getElementById('bjsStand2').addEventListener('click',()=>{
  if(!bjs.active || bjs.h2Done) return;
  bjs.h2Done = true; document.getElementById('bjsHit2').disabled=true; document.getElementById('bjsStand2').disabled=true; bjsCheckDone();
});
function bjsFinish(){
  bjs.active = false; document.getElementById('bjsSwitch').disabled = true;
  while(bjScore(bjs.dealer) < 17) bjs.dealer.push(bjs.deck.pop());
  bjsRender(false);
  const d = bjScore(bjs.dealer); const m = document.getElementById('bjsMsg');
  let net = 0; const dealerPush = (d === 22);
  [bjs.h1, bjs.h2].forEach(h=>{
    const p = bjScore(h);
    if(p > 21) return;
    if(dealerPush){ net += 0; return; }
    if(d > 21 || p > d){ net += BET; }
    else if(p === d){ net += 0; }
    else { net -= BET; }
  });
  if(net > 0){ addWin(BET*2 + net); m.textContent = `Net +${net}! 🎉`; winChime(); }
  else if(net === 0){ addWin(BET*2); m.textContent = 'Push / tie.'; snd(600,0.08,'sine',0.04); }
  else { addWin(BET*2 + net); m.textContent = `Net ${net}.`; loseSnd(); }
  document.getElementById('bjsDeal').disabled = false;
}

// PAI GOW
function paiGowSplit(sevenCards){
  const n = sevenCards.length; let best = null;
  const idx = [...Array(n).keys()]; const combos = [];
  function pick(start, arr){
    if(arr.length === 2){ combos.push([...arr]); return; }
    for(let i=start;i<n;i++){ arr.push(i); pick(i+1, arr); arr.pop(); }
  }
  pick(0, []);
  for(const c of combos){
    const front = [sevenCards[c[0]], sevenCards[c[1]]];
    const backIdx = idx.filter(i=>!c.includes(i));
    const back = backIdx.map(i=>sevenCards[i]);
    const fe = evalHand(front); const be = best5of7(back);
    if(cmpEval(be, fe) <= 0) continue;
    const total = fe[0] + be[0];
    if(!best || total > best.total) best = {front, back, fe, be, total};
  }
  if(!best){
    const sorted = [...sevenCards].sort((a,b)=>(b.v===1?14:b.v)-(a.v===1?14:a.v));
    best = {front: [sorted[0], sorted[1]], back: sorted.slice(2)};
  }
  return best;
}
function twoCardEval(cards){
  const [a, b] = cards;
  const av = a.v===1?14:a.v, bv = b.v===1?14:b.v;
  if(av === bv) return [2, av];
  return [1, Math.max(av, bv), Math.min(av, bv)];
}
function cmp2(a, b){
  const n = Math.max(a.length, b.length);
  for(let i=0;i<n;i++){ const av=a[i]||0, bv=b[i]||0; if(av!==bv) return av-bv; }
  return 0;
}
document.getElementById('pgDeal').addEventListener('click',()=>{
  const m = document.getElementById('pgMsg'); if(!canBet(m)) return;
  const deck = newDeck();
  const seven = [deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
  const dealerSeven = [deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
  const split = paiGowSplit(seven); const dSplit = paiGowSplit(dealerSeven);
  document.getElementById('pgFront').innerHTML = split.front.map(c=>cardHTML(c)).join('');
  document.getElementById('pgBack').innerHTML = split.back.map(c=>cardHTML(c)).join('');
  document.getElementById('pgD').innerHTML = dealerSeven.map(c=>cardHTML(c)).join('');
  snd(600,0.08,'sine',0.04);
  const fe = twoCardEval(split.front); const dfe = twoCardEval(dSplit.front);
  const be = best5of7(split.back); const dbe = best5of7(dSplit.back);
  const frontCmp = cmp2(fe, dfe); const backCmp = cmpEval(be, dbe);
  setTimeout(()=>{
    if(frontCmp > 0 && backCmp > 0){ addWin(BET*2); m.textContent = `Both hands win! +${BET} 🎉`; winChime(); }
    else if(frontCmp < 0 && backCmp < 0){ m.textContent = 'Both lose.'; loseSnd(); }
    else if(frontCmp === 0 || backCmp === 0){ addWin(BET); m.textContent = 'Push.'; snd(600,0.08,'sine',0.04); }
    else { m.textContent = 'Split — push.'; addWin(BET); snd(600,0.08,'sine',0.04); }
  }, 400);
});

// CRICKET
let ckChoice = '4';
document.querySelectorAll('[data-ck]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('[data-ck]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); ckChoice = b.dataset.ck;
  });
});
document.getElementById('ckBowl').addEventListener('click',()=>{
  const m = document.getElementById('ckMsg'); if(!canBet(m)) return;
  const btn = document.getElementById('ckBowl'); btn.disabled = true;
  const ball = document.getElementById('ckBall'); const bat = document.getElementById('ckBat');
  const resultEl = document.getElementById('ckResult');
  resultEl.textContent = 'Bowling...'; m.textContent = '';
  ball.style.display = 'block'; ball.style.right = '5%'; ball.style.bottom = '30px'; ball.style.left = '';
  bat.style.transform = 'none';
  let tick = 0;
  const iv = setInterval(()=>{
    tick++; ball.style.right = (5 + tick*12) + '%'; ball.style.bottom = (30 + tick*2) + 'px';
    snd(280 + tick*30, 0.03, 'square', 0.02);
    if(tick >= 5){ clearInterval(iv); swing(); }
  }, 60);
  function swing(){
    bat.style.transform = 'rotate(-50deg)'; snd(700, 0.12, 'sawtooth', 0.06);
    setTimeout(()=>{ bat.style.transform = 'none'; decide(); }, 220);
  }
  function decide(){
    const outcomes = [{r:'0',p:35},{r:'1',p:30},{r:'2',p:15},{r:'3',p:5},{r:'4',p:10},{r:'6',p:4},{r:'W',p:1}];
    let rand = Math.random()*100, cum = 0, outcome = '0';
    for(const o of outcomes){ cum += o.p; if(rand < cum){ outcome = o.r; break; } }
    const payout = {'0':2, '1':2.5, '2':5, '3':10, '4':8, '6':20, 'W':50};
    const label = outcome === 'W' ? 'WICKET! 🎯' : outcome + ' Run(s)';
    if(outcome === 'W'){ ball.textContent = '💥'; ball.style.right = '55%'; ball.style.bottom = '30px'; }
    else if(outcome === '0'){ ball.textContent = '🔴'; ball.style.right = '60%'; ball.style.bottom = '35px'; }
    else {
      const dist = outcome === '6' ? 90 : outcome === '4' ? 80 : 60 + parseInt(outcome)*5;
      ball.textContent = outcome === '6' ? '🚀' : '🔴';
      ball.style.right = dist + '%'; ball.style.bottom = (outcome === '6' ? 110 : 60) + 'px';
    }
    snd(500, 0.1, 'sine', 0.05);
    resultEl.textContent = label;
    setTimeout(()=>{
      if(ckChoice === outcome){
        const w = Math.round(BET * payout[outcome]); addWin(w);
        m.textContent = `${label} — +${w-BET} coins! 🏏`; winChime();
      } else { m.textContent = `${label} — lost.`; loseSnd(); }
      ball.textContent = '🔴'; btn.disabled = false;
    }, 400);
  }
});

// ============ INIT (must be last) ============
(function init(){
  navigate();
  bootLiveFeed();
  initAuth();
  injectPaymentModal();
  injectGiftTab();
  injectVIPTab();
  updateVIPUI();
  injectAllGameHistories();
})();
