// ============ VIP LEVELS ============
const VIP_LEVELS = [
  {name:'Bronze',   min:0,      perk:'🎁 100% deposit match (min ₹500) + welcome bonus'},
  {name:'Silver',   min:5000,   perk:'💸 5% weekly cashback + faster withdrawals'},
  {name:'Gold',     min:20000,  perk:'💸 10% weekly cashback + priority VIP support'},
  {name:'Platinum', min:50000,  perk:'💸 15% cashback + exclusive high-stakes tables'},
  {name:'Diamond',  min:100000, perk:'💸 25% cashback + personal account manager'}
];

function getVIPLevel(w){ let l=VIP_LEVELS[0]; for(const x of VIP_LEVELS){ if(w>=x.min) l=x; } return l; }
function getNextVIP(w){ for(const x of VIP_LEVELS){ if(w < x.min) return x; } return null; }

function updateVIPUI(){
  if(!currentUser) return;
  const wagered = currentUser.totalWagered || 0;
  const lvl = getVIPLevel(wagered);
  const next = getNextVIP(wagered);
  const badge = document.getElementById('vipBadge');
  if(!badge) return;
  badge.textContent = lvl.name.toUpperCase();
  badge.className = 'vip-badge vip-' + lvl.name;
  const perk = document.getElementById('vipPerk');
  if(perk) perk.textContent = lvl.perk;
  const wEl = document.getElementById('vipWagered');
  if(wEl) wEl.textContent = '₹' + wagered.toLocaleString();
  const progress = document.getElementById('vipProgress');
  const nextAmt = document.getElementById('vipNextAmt');
  if(next && progress){
    const pct = ((wagered - lvl.min) / (next.min - lvl.min)) * 100;
    progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if(nextAmt) nextAmt.textContent = '₹' + next.min.toLocaleString();
  } else if(progress){
    progress.style.width = '100%';
    if(nextAmt) nextAmt.textContent = 'MAX LEVEL';
  }
}

// Wrap canBet for totalWagered tracking
const _cbVIP = canBet;
canBet = function(m, amt){
  const r = _cbVIP(m, amt);
  if(r && currentUser){
    currentUser.totalWagered = (currentUser.totalWagered || 0) + (amt || BET);
    saveCurrentUser();
    updateVIPUI();
  }
  return r;
};

function injectVIPTab(){
  const wallet = document.querySelector('[data-acctp="wallet"]');
  if(!wallet || document.getElementById('vipCard')) return;
  const card = document.createElement('div');
  card.className = 'vip-card';
  card.id = 'vipCard';
  card.innerHTML = `
    <div style="color:#8fa3c8;font-size:.7rem;text-transform:uppercase;letter-spacing:1px">Your VIP Level</div>
    <div id="vipBadge" class="vip-badge vip-Bronze" style="margin:8px 0">BRONZE</div>
    <div style="font-size:.72rem;color:#8fa3c8">Total Wagered: <b id="vipWagered" style="color:#ffd700">₹0</b></div>
    <div class="vip-progress"><div class="vip-progress-fill" id="vipProgress" style="width:0%"></div></div>
    <div class="vip-levels"><span>Now</span><span id="vipNextAmt">₹5,000</span></div>
    <div class="vip-perk" id="vipPerk">Loading...</div>
  `;
  wallet.insertBefore(card, wallet.firstChild);
}
