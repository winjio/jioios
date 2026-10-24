// ============ NAVIGATION ============
function navigate(){
  const id = (location.hash || '#home').replace('#','') || 'home';
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');
  else document.getElementById('home').classList.add('active');
  document.getElementById('pageTitle').textContent = TITLES[id] || TITLES.home;
  window.scrollTo({top:0,behavior:'smooth'});
  snd(600,0.05,'sine',0.03);
}
window.addEventListener('hashchange', navigate);
