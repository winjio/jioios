// ============ PAYMENT GATEWAY MOCKUP ============
let pgAmount = 0, pgMethod = 'upi';
const PG_FIELDS = {
  upi: `<div style="text-align:center;margin:10px 0 14px">
          <div style="color:#e8eefc;font-size:.9rem;font-weight:700;margin-bottom:10px">Scan &amp; Pay using PhonePe</div>
          <img src="/assets/phonepe-upi-qr.jpeg" alt="UPI payment QR code" style="display:block;width:min(100%,280px);height:auto;margin:0 auto;background:#fff;border-radius:12px;padding:8px;box-sizing:border-box">
          <div style="color:#8fa3c8;font-size:.75rem;margin-top:10px">1. Scan this QR in your UPI app. 2. Pay the exact amount shown above. 3. Then request admin review below.</div>
          <div style="color:#ffd166;font-size:.72rem;margin-top:8px">Payment is not automatically verified. Credits are demo-only and require admin approval.</div>
        </div>`,
  card: `<input class="pg-field" placeholder="Card Number" value="4242 4242 4242 4242" readonly>
         <div style="display:flex;gap:8px">
           <input class="pg-field" placeholder="MM/YY" value="12/28" readonly style="flex:1">
           <input class="pg-field" placeholder="CVV" value="123" readonly style="flex:1">
         </div>
         <input class="pg-field" placeholder="Name" value="DEMO USER" readonly>`,
  nb: `<select class="pg-field">
         <option>State Bank of India</option>
         <option>HDFC Bank</option>
         <option>ICICI Bank</option>
         <option>Axis Bank</option>
         <option>Punjab National Bank</option>
       </select>
       <div style="color:#8fa3c8;font-size:.72rem;text-align:center;margin:10px 0">Demo — no real transaction</div>`
};

function injectPaymentModal(){
  if(document.getElementById('pgModal')) return;
  const modal = document.createElement('div');
  modal.className = 'pg-modal';
  modal.id = 'pgModal';
  modal.innerHTML = `
    <div class="pg-box">
      <div class="pg-head">
        <strong>💳 Payment Gateway</strong>
        <button class="hdr-btn" onclick="closePG()">✕</button>
      </div>
      <div style="text-align:center;color:#8fa3c8;font-size:.7rem;margin-bottom:6px">📱 PhonePe UPI QR · Telegram Admin Approval (Demo Credits)</div>
      <div class="pg-amount" id="pgAmt">₹0</div>
      <div class="pg-methods">
        <div class="pg-method active" data-pgm="upi"><span class="pg-method-icon">📱</span>UPI</div>
        <div class="pg-method" data-pgm="card"><span class="pg-method-icon">💳</span>Card</div>
        <div class="pg-method" data-pgm="nb"><span class="pg-method-icon">🏦</span>NetBank</div>
      </div>
      <div id="pgFields"></div>
      <button class="pg-pay-btn" id="pgPayBtn" onclick="processPayment()">Request Approval</button>
      <div class="pg-spinner" id="pgSpinner"></div>
      <div class="pg-success" id="pgSuccess">
        <div class="pg-success-icon">✅</div>
        <div style="color:#2ecc71;font-weight:800;font-size:1.1rem">Request Status</div>
        <div style="color:#8fa3c8;font-size:.8rem;margin-top:6px" id="pgSuccessMsg"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.querySelectorAll('[data-pgm]').forEach(m=>{
    m.addEventListener('click', ()=>{
      document.querySelectorAll('.pg-method').forEach(x=>x.classList.remove('active'));
      m.classList.add('active');
      pgMethod = m.dataset.pgm;
      document.getElementById('pgFields').innerHTML = PG_FIELDS[pgMethod];
    });
  });
}

function openPG(amount){
  pgAmount = amount;
  document.getElementById('pgAmt').textContent = '₹' + amount.toLocaleString();
  document.getElementById('pgFields').innerHTML = PG_FIELDS.upi;
  const btn = document.getElementById('pgPayBtn');
  btn.style.display = 'block'; btn.disabled = false; btn.textContent = 'I Paid — Request Approval';
  document.getElementById('pgSpinner').classList.remove('show');
  document.getElementById('pgSuccess').classList.remove('show');
  document.querySelectorAll('.pg-method').forEach(m=>m.classList.remove('active'));
  document.querySelector('[data-pgm="upi"]').classList.add('active');
  pgMethod = 'upi';
  document.getElementById('pgModal').classList.add('open');
}
function closePG(){ document.getElementById('pgModal').classList.remove('open'); }

let depositPollTimer = null;
function processPayment(){
  const btn = document.getElementById('pgPayBtn');
  if (!currentUser || !currentUser.email) { alert('Please log in first.'); return; }
  btn.disabled = true; btn.textContent = 'Sending request...';
  document.getElementById('pgSpinner').classList.add('show');
  document.getElementById('pgSuccess').classList.remove('show');

  // This flow requests Telegram approval for DEMO credits only; it does not verify real payments.
  fetch('/api/deposit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', amount: pgAmount, email: currentUser.email })
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || 'Could not create deposit request.');
    document.getElementById('pgSpinner').classList.remove('show');
    btn.style.display = 'none';
    const success = document.getElementById('pgSuccess');
    success.classList.add('show');
    success.querySelector('.pg-success-icon').textContent = '⏳';
    success.querySelector('div[style*="font-weight:800"]').textContent = 'Waiting for Telegram approval';
    document.getElementById('pgSuccessMsg').textContent = `Request ${data.requestId.slice(0, 8)}… — ₹${pgAmount}. Wallet credit will be added only after admin approval.`;
    if (depositPollTimer) clearInterval(depositPollTimer);
    let attempts = 0;
    depositPollTimer = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch('/api/deposit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', requestId: data.requestId, email: currentUser.email })
        });
        const state = await r.json();
        if (!r.ok) throw new Error(state.error || 'Status check failed');
        if (state.status === 'approved' || state.status === 'rejected' || attempts >= 120) {
          clearInterval(depositPollTimer); depositPollTimer = null;
          if (state.status === 'approved') {
            const marker = 'casino_demo_credited_' + data.requestId;
            if (!localStorage.getItem(marker)) {
              localStorage.setItem(marker, '1');
              balance += Number(state.amount);
              upd();
              currentUser.deposits = currentUser.deposits || [];
              currentUser.deposits.unshift({ amount: Number(state.amount), ts: Date.now(), status: 'Approved (demo)', method: 'Telegram approval' });
              saveCurrentUser();
              if (typeof refreshAccountUI === 'function') refreshAccountUI();
            }
            success.querySelector('.pg-success-icon').textContent = '✅';
            success.querySelector('div[style*="font-weight:800"]').textContent = 'Demo credits approved!';
            document.getElementById('pgSuccessMsg').textContent = `₹${state.amount} demo credits added to this browser wallet.`;
            if (typeof showBigWin === 'function') showBigWin(Number(state.amount), window.innerWidth/2, window.innerHeight/2);
            winChime();
          } else if (state.status === 'rejected') {
            success.querySelector('.pg-success-icon').textContent = '❌';
            success.querySelector('div[style*="font-weight:800"]').textContent = 'Request rejected';
            document.getElementById('pgSuccessMsg').textContent = 'Admin rejected this demo-credit request. No credits added.';
          } else {
            document.getElementById('pgSuccessMsg').textContent = 'Still pending. Check Telegram; you can close this window and check your balance later.';
          }
          btn.style.display = 'block'; btn.disabled = false; btn.textContent = 'Request Again';
        }
      } catch (err) {
        clearInterval(depositPollTimer); depositPollTimer = null;
        document.getElementById('pgSuccessMsg').textContent = 'Status check error: ' + err.message;
        btn.style.display = 'block'; btn.disabled = false; btn.textContent = 'Try Again';
      }
    }, 3000);
  }).catch(err => {
    document.getElementById('pgSpinner').classList.remove('show');
    btn.disabled = false; btn.textContent = 'I Paid — Request Approval';
    alert('Telegram approval setup error: ' + err.message + '\nPlease configure the Vercel backend first.');
  });
}

// ============ GIFT CODES ============
const GIFT_CODES = {
  'WELCOME100':  {amount:100,  desc:'Welcome bonus'},
  'FESTIVE500':  {amount:500,  desc:'Festive special'},
  'VIPBOOST':    {amount:250,  desc:'VIP boost'},
  'NEWYEAR2024': {amount:1000, desc:'New year gift'},
  'LUCKY777':    {amount:777,  desc:'Lucky triple seven'}
};

function injectGiftTab(){
  const tabs = document.querySelector('.acct-tabs');
  if(!tabs || document.getElementById('giftTabBtn')) return;
  const btn = document.createElement('button');
  btn.dataset.acct = 'gift';
  btn.id = 'giftTabBtn';
  btn.textContent = '🎁 Gift Code';
  tabs.appendChild(btn);
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-acct]').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('[data-acctp]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const el = document.querySelector('[data-acctp="gift"]');
    if(el) el.classList.add('active');
  });
  const lastContent = document.querySelector('[data-acctp="txHist"]');
  if(!lastContent) return;
  const giftContent = document.createElement('div');
  giftContent.className = 'acct-content';
  giftContent.setAttribute('data-acctp', 'gift');
  giftContent.innerHTML = `
    <div class="label" style="margin-bottom:8px">Redeem Gift Code</div>
    <div class="gift-input-row">
      <input class="gift-input" id="giftCode" placeholder="ENTER CODE">
      <button class="gift-apply" onclick="redeemGift()">Apply</button>
    </div>
    <div class="msg" id="giftMsg" style="text-align:center;min-height:24px"></div>
    <div style="margin-top:14px;font-size:.78rem;color:#8fa3c8;padding:10px;background:rgba(0,0,0,.25);border-radius:8px;line-height:1.7">
      <b style="color:#ffd700">🎁 Available Codes:</b><br>
      • <b>WELCOME100</b> — ₹100<br>
      • <b>FESTIVE500</b> — ₹500<br>
      • <b>VIPBOOST</b> — ₹250<br>
      • <b>NEWYEAR2024</b> — ₹1000<br>
      • <b>LUCKY777</b> — ₹777
    </div>
  `;
  lastContent.parentNode.insertBefore(giftContent, lastContent.nextSibling);
}

function redeemGift(){
  if(!currentUser) return;
  const code = document.getElementById('giftCode').value.trim().toUpperCase();
  const msg = document.getElementById('giftMsg');
  if(!code){ msg.style.color = '#e74c3c'; msg.textContent = 'Enter a code'; return; }
  const gift = GIFT_CODES[code];
  if(!gift){ msg.style.color = '#e74c3c'; msg.textContent = '❌ Invalid code'; loseSnd(); return; }
  currentUser.usedGifts = currentUser.usedGifts || [];
  if(currentUser.usedGifts.includes(code)){ msg.style.color = '#e74c3c'; msg.textContent = '⚠️ Code already used'; loseSnd(); return; }
  currentUser.usedGifts.push(code);
  balance += gift.amount; upd();
  if(typeof showBigWin === 'function') showBigWin(gift.amount, window.innerWidth/2, window.innerHeight/2);
  currentUser.deposits = currentUser.deposits || [];
  currentUser.deposits.unshift({amount: gift.amount, ts: Date.now(), status: 'Gift', method: 'Code: ' + code});
  saveCurrentUser();
  if(typeof refreshAccountUI === 'function') refreshAccountUI();
  msg.style.color = '#2ecc71'; msg.textContent = `🎉 ${gift.desc} — ₹${gift.amount} added!`;
  document.getElementById('giftCode').value = '';
  winChime();
}
