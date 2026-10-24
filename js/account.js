// ============ ACCOUNT: DEPOSIT / WITHDRAW / REFER / HISTORY ============
function doDeposit(){
  if(!currentUser) return;
  const amt = +document.getElementById('depAmount').value;
  const msg = document.getElementById('depMsg');
  if(!amt || amt < 50){ if(msg){ msg.style.color='#e74c3c'; msg.textContent='Min ₹50'; } return; }
  // Payment gateway handles the flow (defined in payment.js)
  if(typeof openPG === 'function'){ openPG(amt); document.getElementById('depAmount').value=''; if(msg) msg.textContent=''; return; }
  // Fallback
  addWin(amt);
  currentUser.deposits = currentUser.deposits || [];
  currentUser.deposits.unshift({amount: amt, ts: Date.now(), status: 'Success'});
  saveCurrentUser();
  refreshAccountUI();
  if(msg){ msg.style.color='#2ecc71'; msg.textContent = `₹${amt} added!`; }
  winChime();
}

function doWithdraw(){
  if(!currentUser) return;
  const amt = +document.getElementById('wdAmount').value;
  const upi = document.getElementById('wdUpi').value.trim();
  const msg = document.getElementById('wdMsg');
  if(!amt || amt < 100){ msg.style.color='#e74c3c'; msg.textContent='Min ₹100'; return; }
  if(amt > balance){ msg.style.color='#e74c3c'; msg.textContent='Insufficient balance'; return; }
  if(!upi){ msg.style.color='#e74c3c'; msg.textContent='UPI ID required'; return; }
  balance -= amt; upd();
  currentUser.withdrawals = currentUser.withdrawals || [];
  currentUser.withdrawals.unshift({amount: amt, upi, ts: Date.now(), status: 'Processing'});
  saveCurrentUser();
  refreshAccountUI();
  msg.style.color='#2ecc71'; msg.textContent = `₹${amt} withdrawal requested`;
  document.getElementById('wdAmount').value = '';
  document.getElementById('wdUpi').value = '';
}

function copyRefCode(){
  const code = document.getElementById('refCode').textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(code);
  alert('Referral code copied: ' + code);
}

function injectAllGameHistories(){
  document.querySelectorAll('.panel').forEach(p=>{
    if(['home','account'].includes(p.id)) return;
    if(!p.querySelector('.game-bet-history')){
      const box = document.createElement('div');
      box.className = 'game-bet-history';
      p.appendChild(box);
    }
  });
}

function renderGameHistory(game){
  if(!game || !currentUser) return;
  const panel = document.getElementById(game);
  if(!panel) return;
  let box = panel.querySelector('.game-bet-history');
  if(!box){ injectAllGameHistories(); box = panel.querySelector('.game-bet-history'); }
  if(!box) return;
  const bets = (currentUser.bets || []).filter(b=>b.game===game).slice(0,3);
  let html = '<div class="game-bet-history-title">Your Recent Bets</div>';
  if(!bets.length) html += '<div class="gbh-row" style="color:#8fa3c8;justify-content:center">No bets yet — play karo!</div>';
  else bets.forEach(b=>{
    const net = (b.win||0) - b.bet;
    const cls = net > 0 ? 'gbh-win' : net < 0 ? 'gbh-loss' : '';
    html += `<div class="gbh-row"><span>Bet ₹${b.bet}${b.settled ? '' : ' ⏳'}</span><span class="${cls}">${b.settled ? (net>0?'+':'')+net : '...'}</span></div>`;
  });
  box.innerHTML = html;
}

function refreshAccountUI(){
  if(!currentUser) return;
  document.getElementById('acctUsername').textContent = `${currentUser.name} • ${currentUser.email}`;
  document.getElementById('acctBalance').textContent = '₹' + balance;
  document.getElementById('refCode').textContent = currentUser.refCode || '------';
  document.getElementById('refCount').textContent = currentUser.refCount || 0;
  document.getElementById('refEarn').textContent = '₹' + (currentUser.refEarn || 0);
  const bh = document.getElementById('betHistoryList');
  const bets = currentUser.bets || [];
  if(!bets.length) bh.innerHTML = '<div class="history-empty">No bets yet</div>';
  else bh.innerHTML = bets.slice(0,30).map(b=>{
    const net = (b.win||0) - b.bet;
    const cls = net > 0 ? '' : 'neg';
    const date = new Date(b.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    return `<div class="history-item"><div><div>${TITLES[b.game]||b.game}</div><div class="meta">${date}</div></div><div class="amt ${cls}">${b.settled ? ((net>0?'+':'')+net) : 'pending'}</div></div>`;
  }).join('');
  const tx = document.getElementById('txHistoryList');
  const deps = (currentUser.deposits||[]).map(d=>({...d, type:'Deposit'}));
  const wds = (currentUser.withdrawals||[]).map(w=>({...w, type:'Withdraw'}));
  const all = [...deps, ...wds].sort((a,b)=>b.ts-a.ts);
  if(!all.length) tx.innerHTML = '<div class="history-empty">No transactions</div>';
  else tx.innerHTML = all.map(t=>{
    const cls = t.type==='Deposit' ? '' : 'neg';
    const sign = t.type==='Deposit' ? '+' : '-';
    const date = new Date(t.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    return `<div class="history-item"><div><div>${t.type} ${t.status==='Processing'?'⏳':''}</div><div class="meta">${date} • ${t.status}</div></div><div class="amt ${cls}">${sign}₹${t.amount}</div></div>`;
  }).join('');
}

document.querySelectorAll('[data-acct]').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('[data-acct]').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('[data-acctp]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const el = document.querySelector(`[data-acctp="${b.dataset.acct}"]`);
    if(el) el.classList.add('active');
    refreshAccountUI();
  });
});

window.addEventListener('hashchange', ()=>{
  if(location.hash === '#account') refreshAccountUI();
  if(typeof renderGameHistory === 'function'){
    const g = location.hash.replace('#','');
    if(g && currentUser) renderGameHistory(g);
  }
});
