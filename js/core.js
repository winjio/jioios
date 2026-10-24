// ============ CORE ============
let balance = 1000, BET = 10, audioCtx = null;
function upd(){ document.getElementById('balance').textContent = balance; }
function snd(f=440,d=0.08,t='square',v=0.04){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type=t; o.frequency.value=f; g.gain.value=v;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime+d);
  }catch(e){}
}
function winChime(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>snd(f,0.12,'triangle',0.06),i*100)); }
function loseSnd(){ snd(180,0.2,'sawtooth',0.04); }

function canBet(m, amt){
  amt = amt || BET;
  if(balance < amt){ m.textContent='Coins kam! Refresh karo.'; loseSnd(); return false; }
  balance -= amt; upd();
  const btn = document.querySelector('.panel.active .btn:not(:disabled)');
  if(btn && typeof animateChips === 'function'){
    const r = btn.getBoundingClientRect();
    animateChips(r.left + r.width/2, r.top + r.height/2, 6);
  }
  if(typeof updateTableBet === 'function') updateTableBet(amt);
  return true;
}
function addWin(n){
  balance += n; upd();
  const panel = document.querySelector('.panel.active');
  if(panel && n >= 20 && typeof showBigWin === 'function'){
    const r = panel.getBoundingClientRect();
    showBigWin(n, r.left + r.width/2, r.top + r.height/2);
  }
}

const SUITS = ['♠','♥','♦','♣'];
const DICE = ['⚀','⚁','⚂','⚃','⚄','⚅'];
function newDeck(){ const d=[]; for(const s of SUITS) for(let v=1;v<=13;v++) d.push({v,s}); return d.sort(()=>Math.random()-0.5); }
function rName(v){ return v===1?'A':v===11?'J':v===12?'Q':v===13?'K':v; }
function cardHTML(c, hidden){
  if(hidden) return '<div class="card back">X</div>';
  const red = c.s==='♥'||c.s==='♦';
  const r = rName(c.v);
  return `<div class="card ${red?'red':''}"><div class="tl">${r}${c.s}</div><div class="mid">${c.s}</div><div class="br">${r}${c.s}</div></div>`;
}
function bjScore(h){ let s=0,a=0; h.forEach(c=>{ if(c.v===1){s+=11;a++} else s+=(c.v>=10?10:c.v) }); while(s>21&&a>0){s-=10;a--} return s; }
function bjScoreSoft(h){ let s=0,a=0; h.forEach(c=>{ if(c.v===1){s+=11;a++} else s+=(c.v>=10?10:c.v) }); while(s>21&&a>0){s-=10;a--} return [s,a>0]; }

function evalHand(cards){
  const v = cards.map(c=>c.v===1?14:c.v).sort((a,b)=>b-a);
  const suits = cards.map(c=>c.s);
  const flush = suits.every(s=>s===suits[0]);
  const uniq = [...new Set(v)];
  let straight=false, sHigh=0;
  if(uniq.length===5){
    if(uniq[0]-uniq[4]===4){ straight=true; sHigh=uniq[0]; }
    else if(uniq[0]===14 && uniq[1]===5){ straight=true; sHigh=5; }
  }
  const cnt={}; v.forEach(x=>cnt[x]=(cnt[x]||0)+1);
  const grp = Object.entries(cnt).map(([k,c])=>({v:+k,c})).sort((a,b)=>b.c-a.c||b.v-a.v);
  const freq = grp.map(g=>g.c), ord = grp.map(g=>g.v);
  if(flush && straight && sHigh===14) return [10, sHigh];
  if(flush && straight) return [9, sHigh];
  if(freq[0]===4) return [8, ...ord];
  if(freq[0]===3 && freq[1]===2) return [7, ...ord];
  if(flush) return [6, ...v];
  if(straight) return [5, sHigh];
  if(freq[0]===3) return [4, ...ord];
  if(freq[0]===2 && freq[1]===2) return [3, ...ord];
  if(freq[0]===2) return [2, ...ord];
  return [1, ...v];
}
function cmpEval(a,b){ const n=Math.max(a.length,b.length); for(let i=0;i<n;i++){ const av=a[i]||0,bv=b[i]||0; if(av!==bv) return av-bv; } return 0; }
function best5of7(cards){
  let best=null; const n=cards.length;
  for(let i=0;i<n-4;i++) for(let j=i+1;j<n-3;j++) for(let k=j+1;k<n-2;k++) for(let l=k+1;l<n-1;l++) for(let m=l+1;m<n;m++){
    const e = evalHand([cards[i],cards[j],cards[k],cards[l],cards[m]]);
    if(!best||cmpEval(e,best)>0) best=e;
  }
  return best;
}
function handName(ev){ return ['','High Card','One Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Royal Flush'][ev[0]]||''; }

function threeCat(hand){
  const v = hand.map(c=>c.v===1?14:c.v).sort((a,b)=>b-a);
  const suits = hand.map(c=>c.s);
  const flush = suits.every(s=>s===suits[0]);
  const isTrail = v[0]===v[1] && v[1]===v[2];
  let isSeq = (v[0]-1===v[1] && v[1]-1===v[2]);
  if(v[0]===14 && v[1]===3 && v[2]===2) isSeq=true;
  let cat=1;
  if(isTrail) cat=6;
  else if(isSeq && flush) cat=5;
  else if(isSeq) cat=4;
  else if(flush) cat=3;
  else if(v[0]===v[1]||v[1]===v[2]||v[0]===v[2]) cat=2;
  return {cat, v};
}
function cmp3(a,b){
  const ra=threeCat(a), rb=threeCat(b);
  if(ra.cat!==rb.cat) return ra.cat-rb.cat;
  for(let i=0;i<3;i++) if(ra.v[i]!==rb.v[i]) return ra.v[i]-rb.v[i];
  return 0;
}

const TITLES = {
  home:'🎰 Casino Arcade',
  ud:'🎲 7 Up Down', bj:'🃏 Blackjack', bacc:'👑 Baccarat', rou:'🎡 Roulette',
  dt:'🐉 Dragon Tiger', ab:'🎴 Andar Bahar', tp:'🃏 Teen Patti', sb:'🎲 Sic Bo',
  hl:'⬆️ Hi-Lo', war:'⚔️ War', tcp:'♠️ 3-Card Poker', he:'🏆 Texas Hold\'em',
  cb:'🏝️ Caribbean Stud', rd:'🐕 Red Dog', pd:'🎲 Poker Dice', cr:'🎯 Craps',
  fpc:'🦀 Fish-Prawn-Crab', mw:'💰 Money Wheel', cw:'⚔️ Casino War',
  pon:'🎩 Pontoon', lir:'🚗 Let It Ride', cal:'🎲 Chuck-a-Luck',
  bjs:'🔄 BJ Switch', pg:'🀄 Pai Gow', ck:'🏏 Cricket',
  account:'👤 My Account'
};
