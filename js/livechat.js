(function(){
  const $=id=>document.getElementById(id);
  const toggle=$('chatToggle'), panel=$('chatPanel'), form=$('chatForm'), input=$('chatInput'), list=$('chatMessages'), status=$('chatStatus');
  if(!toggle||!panel||!form||!input||!list) return;
  let sessionId=localStorage.getItem('casinoChatSession');
  if(!sessionId){ sessionId=(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})); localStorage.setItem('casinoChatSession',sessionId); }
  let lastSignature='';
  function addMessage(m){
    const row=document.createElement('div'); row.className='chat-message '+(m.sender==='user'?'from-user':m.sender==='admin'?'from-admin':'from-bot');
    const who=document.createElement('strong'); who.textContent=m.sender==='user'?'You':m.sender==='admin'?'Support':'Bot';
    const body=document.createElement('div'); body.textContent=m.message;
    row.append(who,body); list.appendChild(row);
  }
  async function refresh(){
    try{
      const r=await fetch('/api/chat-messages?sessionId='+encodeURIComponent(sessionId),{cache:'no-store'});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||'Chat unavailable');
      const sig=(d.messages||[]).map(m=>m.id).join('|');
      if(sig!==lastSignature){list.replaceChildren();(d.messages||[]).forEach(addMessage);lastSignature=sig;list.scrollTop=list.scrollHeight;}
      status.textContent='Support online';
    }catch(e){status.textContent='Chat setup pending';}
  }
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden){refresh();input.focus();}});
  const close=$('chatClose'); if(close) close.addEventListener('click',()=>{panel.hidden=true;});
  form.addEventListener('submit',async e=>{
    e.preventDefault();const message=input.value.trim();if(!message)return;
    input.disabled=true;
    try{
      const r=await fetch('/api/chat-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,message})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not send message');
      input.value='';await refresh();
    }catch(err){status.textContent=err.message||'Message send failed';}
    finally{input.disabled=false;input.focus();}
  });
  refresh();setInterval(()=>{if(!panel.hidden)refresh();},4000);
})();
