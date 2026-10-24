// Telegram webhook: admin-only deposit decisions and live-chat replies.
// Required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
async function answer(token, method, payload) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
}
async function db(path, options = {}) {
  const base=(process.env.SUPABASE_URL||'').replace(/\/$/,''), key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key) throw new Error('Supabase not configured');
  const r=await fetch(`${base}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(options.headers||{})}});
  const t=await r.text(); if(!r.ok) throw new Error(`Database error (${r.status}): ${t.slice(0,150)}`); return t?JSON.parse(t):[];
}
async function rpc(name, args) {
  const base=(process.env.SUPABASE_URL||'').replace(/\/$/,''), key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r=await fetch(`${base}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
  const t=await r.text(); if(!r.ok) throw new Error(`Wallet RPC failed (${r.status}): ${t.slice(0,180)}`); return t?JSON.parse(t):null;
}
module.exports = async (req, res) => {
  if(req.method!=='POST') return res.status(405).send('POST only');
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!secret||req.headers['x-telegram-bot-api-secret-token']!==secret) return res.status(401).send('Unauthorized');
  try {
    const update=req.body||{}, token=process.env.TELEGRAM_BOT_TOKEN, admin=String(process.env.TELEGRAM_ADMIN_CHAT_ID||'');
    if(!token||!admin) throw new Error('Telegram not configured');
    // Admin manual reply: /reply <session-uuid> <message>
    const msg=update.message;
    if(msg) {
      if(String(msg.chat?.id)!==admin || String(msg.from?.id)!==admin) return res.status(200).json({ok:true});
      const text=String(msg.text||'').trim();
      if(text==='/start' || text==='/help') {
        await answer(token,'sendMessage',{chat_id:admin,text:'Casino Arcade admin commands:\n/add EMAIL AMOUNT [reason] — add demo credits\n/reply SESSION_UUID Your reply here\n\nDeposit requests can be approved/rejected with buttons. Only this configured admin account is authorized.'});
        return res.status(200).json({ok:true});
      }
      const add=text.match(/^\/add\s+(\S{3,254})\s+(\d{1,6})(?:\s+([\s\S]{1,120}))?$/i);
      if(add) {
        const email=add[1].toLowerCase(), amount=Number(add[2]), reason=(add[3]||'Admin manual demo credit').trim();
        if(!email.includes('@') || !Number.isInteger(amount) || amount<1 || amount>100000) {
          await answer(token,'sendMessage',{chat_id:admin,text:'Usage: /add user@example.com 500 optional reason (1–100000 demo credits)'});
          return res.status(200).json({ok:true});
        }
        const result=await rpc('admin_add_demo_credits',{p_email:email,p_amount:amount,p_reason:reason,p_admin_id:admin});
        await answer(token,'sendMessage',{chat_id:admin,text:`✅ Demo credits recorded\nUser: ${email}\nAmount: ₹${amount}\nLedger ID: ${result?.ledger_id||result?.[0]?.ledger_id||'recorded'}\nReason: ${reason}\n\nNote: existing browser-local game balance does not automatically sync from this ledger.`});
        return res.status(200).json({ok:true});
      }
      const m=text.match(/^\/reply\s+([0-9a-f-]{36})\s+([\s\S]{1,1000})$/i);
      if(m) {
        const sessionId=m[1], reply=m[2].trim();
        if(!reply) { await answer(token,'sendMessage',{chat_id:admin,text:'Reply text is empty.'}); return res.status(200).json({ok:true}); }
        await db('chat_messages',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify([{id:require('crypto').randomUUID(),session_id:sessionId,sender:'admin',message:reply}])});
        await answer(token,'sendMessage',{chat_id:admin,text:`✅ Reply sent to chat session ${sessionId}`});
      } else {
        await answer(token,'sendMessage',{chat_id:admin,text:'Use: /reply SESSION_UUID Your message here\nUse /help for help.'});
      }
      return res.status(200).json({ok:true});
    }
    const q=update.callback_query;
    if(!q) return res.status(200).json({ok:true});
    const chatId=String(q.message?.chat?.id||''), userId=String(q.from?.id||'');
    if(chatId!==admin||userId!==admin) {
      await answer(token,'answerCallbackQuery',{callback_query_id:q.id,text:'Not authorized',show_alert:true});
      return res.status(200).json({ok:true});
    }
    const [decision,id]=String(q.data||'').split(':');
    if(!['approve','reject'].includes(decision)||! /^[0-9a-f-]{36}$/i.test(id||'')) return res.status(400).json({error:'Invalid callback'});
    const rows=await db(`deposit_requests?id=eq.${encodeURIComponent(id)}&status=eq.pending&select=id,amount,email`);
    if(!rows.length) {
      await answer(token,'answerCallbackQuery',{callback_query_id:q.id,text:'Already handled or request not found',show_alert:true});
      return res.status(200).json({ok:true});
    }
    const status=decision==='approve'?'approved':'rejected';
    const result=await rpc('admin_decide_demo_deposit',{p_request_id:id,p_decision:status,p_admin_id:admin});
    if(!result || result.ok===false || (Array.isArray(result)&&result[0]?.ok===false)) {
      await answer(token,'answerCallbackQuery',{callback_query_id:q.id,text:'Already handled or request failed',show_alert:true});
      return res.status(200).json({ok:true});
    }
    await answer(token,'answerCallbackQuery',{callback_query_id:q.id,text:status==='approved'?'Demo credits recorded':'Request rejected'});
    await answer(token,'editMessageText',{chat_id:admin,message_id:q.message.message_id,text:`🎰 Casino Arcade — DEMO CREDIT REQUEST\n\nRequest: ${id}\nUser: ${rows[0].email}\nAmount: ₹${rows[0].amount}\nStatus: ${status.toUpperCase()}\n\nServer-side demo ledger updated: ${status==='approved'?'yes':'no'}`,reply_markup:{inline_keyboard:[]}});
    return res.status(200).json({ok:true});
  } catch(e) { return res.status(500).json({error:e.message||'Server error'}); }
};
