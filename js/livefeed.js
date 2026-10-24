// ============ LIVE USERS + ANIMATIONS ============
const FAKE_NAMES = ['Rahul','Priya','Amit','Sneha','Vikram','Anjali','Rohit','Kavita','Suresh','Neha','Arjun','Pooja','Karan','Divya','Raj','Meera','Sandeep','Sunita','Ajay','Ritu','Manish','Swati','Nikhil','Tina','Ashok','Geeta','Varun','Rekha','Deepak','Nisha','Sanjay','Anita','Sunil','Kiran','Ramesh','Sonal','Vijay','Rani','Arun','Suman','Manoj','Usha','Rakesh','Madhu','Anil','Lata','Prakash','Shreya','Krishna','Radha','Gopal','Isha','Dev','Tara','Om','Zara','Shiva','Meena','Ganesh','Lakshmi','Akash','Diksha','Yash','Roshni'];
const AVATARS = ['👨','👩','🧑','👴','👵','🧔','👱','👲','🧕','👳','👨‍🦰','👩‍🦰','👨‍🦱','👩‍🦱','👨‍🦳','👩‍🦳'];
let liveUsers = [], feedInterval = null;

function initLiveUsers(){
  liveUsers = [];
  const shuffled = [...FAKE_NAMES].sort(()=>Math.random()-0.5);
  for(let i=0;i<60;i++){
    liveUsers.push({
      name: shuffled[i%shuffled.length],
      avatar: AVATARS[Math.floor(Math.random()*AVATARS.length)]
    });
  }
}

function renderLiveStrip(){
  document.querySelectorAll('.panel').forEach(panel=>{
    if(panel.id === 'home' || panel.id === 'account' || panel.querySelector('.live-strip')) return;
    const strip = document.createElement('div');
    strip.className = 'live-strip';
    const onlineCount = 60 + Math.floor(Math.random()*45);
    strip.innerHTML = `<span class="live-badge">🟢 <b>${onlineCount}</b> online</span><div class="user-scroll"></div>`;
    const title = panel.querySelector('.game-header-title');
    if(title) title.parentNode.insertBefore(strip, title.nextSibling);
    else panel.insertBefore(strip, panel.firstChild);
  });
}

function startBettingFeed(){
  clearInterval(feedInterval);
  feedInterval = setInterval(()=>{
    const panel = document.querySelector('.panel.active');
    if(!panel || panel.id === 'home' || panel.id === 'account') return;
    const scrollEl = panel.querySelector('.user-scroll');
    if(!scrollEl) return;
    for(let i=0;i<2;i++){
      const user = liveUsers[Math.floor(Math.random()*liveUsers.length)];
      const bet = [10,20,50,100,200,500][Math.floor(Math.random()*6)];
      const entry = document.createElement('div');
      entry.className = 'bet-entry';
      entry.innerHTML = `<span class="b-avatar">${user.avatar}</span><span class="b-name">${user.name}</span><span class="b-amt">+₹${bet}</span>`;
      scrollEl.appendChild(entry);
      setTimeout(()=>entry.classList.add('show'), 20);
      while(scrollEl.children.length > 6) scrollEl.removeChild(scrollEl.firstChild);
    }
  }, 1800);
}

function animateChips(x, y, count=5){
  for(let i=0;i<count;i++){
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = ['🪙','💰','🟡','🔵'][Math.floor(Math.random()*4)];
    chip.style.left = x + 'px';
    chip.style.top = y + 'px';
    chip.style.animationDelay = (i*80) + 'ms';
    chip.style.setProperty('--tx', (Math.random()*240-120) + 'px');
    chip.style.setProperty('--ty', (-120 - Math.random()*120) + 'px');
    document.body.appendChild(chip);
    setTimeout(()=>chip.remove(), 1400);
  }
}

function showBigWin(amount, x, y){
  const winEl = document.createElement('div');
  winEl.className = 'big-win';
  winEl.textContent = '+₹' + amount;
  winEl.style.left = (x||window.innerWidth/2) + 'px';
  winEl.style.top = (y||window.innerHeight/2) + 'px';
  document.body.appendChild(winEl);
  setTimeout(()=>winEl.remove(), 2100);
  for(let i=0;i<35;i++){
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random()*window.innerWidth + 'px';
    conf.style.top = '-20px';
    conf.style.background = ['#ffd700','#ff6a5c','#6a5cff','#00c2ff','#2ecc71','#ff9a3c'][Math.floor(Math.random()*6)];
    conf.style.animationDelay = (Math.random()*0.6) + 's';
    document.body.appendChild(conf);
    setTimeout(()=>conf.remove(), 3200);
  }
}

function updateTableBet(amount){
  const panel = document.querySelector('.panel.active');
  if(!panel) return;
  let tb = panel.querySelector('.table-bet');
  if(!tb){
    tb = document.createElement('div');
    tb.className = 'table-bet';
    const firstBtn = panel.querySelector('.btn');
    if(firstBtn) firstBtn.parentNode.insertBefore(tb, firstBtn);
    else panel.appendChild(tb);
  }
  const current = parseInt(tb.dataset.val || 0);
  const newVal = current + amount;
  tb.dataset.val = newVal;
  tb.innerHTML = `💰 On Table: <b>₹${newVal}</b>`;
  tb.classList.add('pulse');
  setTimeout(()=>tb.classList.remove('pulse'), 400);
}

// Boot live feed (must run at end of all scripts)
function bootLiveFeed(){
  initLiveUsers();
  renderLiveStrip();
  startBettingFeed();
  window.addEventListener('hashchange', ()=>{
    setTimeout(()=>{
      const panel = document.querySelector('.panel.active');
      if(panel){
        const tb = panel.querySelector('.table-bet');
        if(tb) tb.dataset.val = 0;
      }
      startBettingFeed();
    }, 50);
  });
}
