// ============ AUTH + PERSISTENCE ============
const USERS_KEY = 'casino_users_v1';
const CURRENT_KEY = 'casino_current_v1';
let currentUser = null;

function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch(e){ return []; } }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function saveCurrentUser(){
  if(!currentUser) return;
  const users = loadUsers();
  const idx = users.findIndex(u=>u.email===currentUser.email);
  if(idx<0) return;
  users[idx] = currentUser;
  saveUsers(users);
}
function persistBalance(){
  if(!currentUser) return;
  currentUser.balance = balance;
  saveCurrentUser();
}

// Wrap upd for persistence
const _prevUpd = upd;
upd = function(){ _prevUpd(); persistBalance(); };

// Wrap canBet for bet history
const _prevCanBet = canBet;
canBet = function(m, amt){
  const before = balance;
  const result = _prevCanBet(m, amt);
  if(result){
    const game = document.querySelector('.panel.active')?.id;
    if(game && currentUser){
      const spent = before - balance;
      currentUser.bets = currentUser.bets || [];
      currentUser.bets.unshift({game, bet: spent, win: 0, ts: Date.now(), settled: false});
      if(currentUser.bets.length > 300) currentUser.bets.length = 300;
      saveCurrentUser();
      if(typeof renderGameHistory === 'function') renderGameHistory(game);
    }
  }
  return result;
};

// Wrap addWin to settle last bet
const _prevAddWin = addWin;
addWin = function(n){
  _prevAddWin(n);
  const game = document.querySelector('.panel.active')?.id;
  if(game && currentUser){
    const bets = currentUser.bets || [];
    const last = bets.find(b=>b.game===game && !b.settled);
    if(last){ last.win = n; last.settled = true; saveCurrentUser(); }
    if(typeof renderGameHistory === 'function') renderGameHistory(game);
  }
};

function showAuthGate(){ document.getElementById('authGate').style.display = 'flex'; }
function hideAuthGate(){ document.getElementById('authGate').style.display = 'none'; }

function doLogin(){
  const msg = document.getElementById('authMsg');
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  if(!email || !pass){ msg.className='auth-msg err'; msg.textContent='Email & password required'; return; }
  const users = loadUsers();
  const u = users.find(x=>x.email===email && x.password===pass);
  if(!u){ msg.className='auth-msg err'; msg.textContent='Invalid credentials'; return; }
  currentUser = u;
  localStorage.setItem(CURRENT_KEY, email);
  balance = u.balance || 0;
  upd();
  msg.className='auth-msg ok'; msg.textContent='Login successful!';
  setTimeout(()=>{ hideAuthGate(); if(typeof refreshAccountUI === 'function') refreshAccountUI(); }, 500);
}

function doRegister(){
  const msg = document.getElementById('authMsg');
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPass').value;
  const refCode = document.getElementById('regRef').value.trim().toUpperCase();
  if(!name || !email || !pass){ msg.className='auth-msg err'; msg.textContent='All fields required'; return; }
  if(pass.length < 4){ msg.className='auth-msg err'; msg.textContent='Password min 4 chars'; return; }
  const users = loadUsers();
  if(users.find(u=>u.email===email)){ msg.className='auth-msg err'; msg.textContent='Email already registered'; return; }
  const myRef = 'CAS' + Math.random().toString(36).substring(2,8).toUpperCase();
  const user = {
    name, email, password: pass, balance: 1000,
    refCode: myRef, refBy: refCode || null, refCount: 0, refEarn: 0,
    bets: [], deposits: [], withdrawals: []
  };
  if(refCode){
    const refUser = users.find(u=>u.refCode === refCode);
    if(refUser){
      refUser.balance += 50;
      refUser.refEarn = (refUser.refEarn || 0) + 50;
      refUser.refCount = (refUser.refCount || 0) + 1;
    }
  }
  users.push(user);
  saveUsers(users);
  msg.className='auth-msg ok'; msg.textContent='Account created! ₹1000 bonus!';
  setTimeout(()=>doLoginWith(email, pass), 700);
}

function doLoginWith(email, pass){
  const users = loadUsers();
  const u = users.find(x=>x.email===email && x.password===pass);
  if(!u) return;
  currentUser = u;
  localStorage.setItem(CURRENT_KEY, email);
  balance = u.balance;
  upd();
  hideAuthGate();
  if(typeof refreshAccountUI === 'function') refreshAccountUI();
}

function doLogout(){
  localStorage.removeItem(CURRENT_KEY);
  currentUser = null;
  balance = 1000;
  upd();
  location.hash = '#home';
  showAuthGate();
}

function doResetPassword(){
  const msg = document.getElementById('authMsg');
  const email = document.getElementById('fpEmail').value.trim().toLowerCase();
  const newPass = document.getElementById('fpNewPass').value;
  if(!email || !newPass){ msg.className='auth-msg err'; msg.textContent='Both fields required'; return; }
  if(newPass.length < 4){ msg.className='auth-msg err'; msg.textContent='Password min 4 chars'; return; }
  const users = loadUsers();
  const u = users.find(x=>x.email===email);
  if(!u){ msg.className='auth-msg err'; msg.textContent='Email not registered'; return; }
  u.password = newPass;
  saveUsers(users);
  msg.className='auth-msg ok'; msg.textContent='✅ Password reset! You can login now.';
  setTimeout(()=>{ backToLogin(); document.getElementById('loginEmail').value = email; }, 1400);
}

function showForgotPw(){
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'block';
  document.getElementById('authTitle').textContent = 'Reset Password';
  document.getElementById('authMsg').textContent = '';
}
function backToLogin(){
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('authTitle').textContent = 'Welcome Back';
  document.getElementById('authMsg').textContent = '';
}

function injectForgotForm(){
  const loginForm = document.getElementById('loginForm');
  if(!loginForm || document.getElementById('forgotForm')) return;
  const forgotLink = document.createElement('div');
  forgotLink.className = 'forgot-link';
  forgotLink.textContent = 'Forgot Password?';
  forgotLink.onclick = showForgotPw;
  loginForm.appendChild(forgotLink);
  const forgotForm = document.createElement('div');
  forgotForm.id = 'forgotForm';
  forgotForm.style.display = 'none';
  forgotForm.innerHTML = `
    <input class="auth-input" id="fpEmail" placeholder="Registered Email" type="email">
    <input class="auth-input" id="fpNewPass" type="password" placeholder="New Password (min 4 chars)">
    <button class="auth-submit" onclick="doResetPassword()">Reset Password</button>
    <div class="forgot-link" onclick="backToLogin()">← Back to Login</div>
  `;
  loginForm.parentNode.insertBefore(forgotForm, loginForm.nextSibling);
}

// Auth tabs
document.querySelectorAll('[data-auth]').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('[data-auth]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('loginForm').style.display = b.dataset.auth==='login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = b.dataset.auth==='register' ? 'block' : 'none';
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('authTitle').textContent = b.dataset.auth==='login' ? 'Welcome Back' : 'Create Account';
    document.getElementById('authMsg').textContent = '';
  });
});

// Account button
document.getElementById('accountBtn').addEventListener('click', ()=>{ location.hash = '#account'; });

// Init auth
function initAuth(){
  injectForgotForm();
  const email = localStorage.getItem(CURRENT_KEY);
  if(email){
    const users = loadUsers();
    const u = users.find(x=>x.email===email);
    if(u){
      currentUser = u;
      balance = u.balance || 1000;
      upd();
      hideAuthGate();
      if(typeof injectAllGameHistories === 'function') injectAllGameHistories();
      if(typeof refreshAccountUI === 'function') refreshAccountUI();
      return;
    }
  }
  showAuthGate();
  if(typeof injectAllGameHistories === 'function') injectAllGameHistories();
}
