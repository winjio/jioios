// Website live-chat endpoint. Requires Supabase + Telegram env vars.
const { randomUUID } = require('crypto');
const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
async function db(path, options = {}) {
  const url = base(), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Chat backend is not configured.');
  const r = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const t = await r.text(); if (!r.ok) throw new Error(`Database error (${r.status})`); return t ? JSON.parse(t) : [];
}
async function tg(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN, admin = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !admin) throw new Error('Telegram bot is not configured.');
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:admin, text, disable_web_page_preview:true}) });
  const d = await r.json(); if (!d.ok) throw new Error('Telegram notification failed');
}
function autoReply(text) {
  const t = text.toLowerCase();
  if (/deposit|payment|add money|जमा/.test(t)) return 'Deposit help: apni request ID aur transaction reference share karein. Admin Telegram se check karega. Payment screenshot alone confirmation nahi hai.';
  if (/withdraw|cashout|निकाल/.test(t)) return 'Withdrawal requests ke liye Account section check karein. Yeh demo site hai; real-money withdrawal enabled nahi hai.';
  if (/login|password|register|account/.test(t)) return 'Login/register help: email sahi enter karein. Password issue ho to website ke reset option ka use karein.';
  if (/game|error|bug|not working|problem/.test(t)) return 'Game issue ke liye game ka naam, device/browser aur error ka short detail bhejein. Admin jald reply karega.';
  if (/hello|hi\b|namaste|hey/.test(t)) return 'Namaste! 👋 Casino Arcade support mein welcome. Deposit, account ya game issue likhein; admin bhi Telegram se reply kar sakta hai.';
  return 'Thanks for contacting support! Aapka message admin ko Telegram par bhej diya gaya hai. Admin ka reply isi chat mein dikhega.';
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
  try {
    const { sessionId, message } = req.body || {};
    if (!/^[0-9a-f-]{36}$/i.test(String(sessionId || ''))) return res.status(400).json({error:'Invalid chat session'});
    if (typeof message !== 'string' || !message.trim() || message.length > 1000) return res.status(400).json({error:'Message must be 1–1000 characters'});
    const clean = message.trim();
    await db('chat_messages', { method:'POST', headers:{Prefer:'return=minimal'}, body:JSON.stringify([{id:randomUUID(), session_id:sessionId, sender:'user', message:clean}]) });
    await tg(`💬 Casino Arcade — LIVE CHAT\nSession: ${sessionId}\nUser: ${clean}\n\nReply using:\n/reply ${sessionId} Your message here`);
    const reply = autoReply(clean);
    await db('chat_messages', { method:'POST', headers:{Prefer:'return=minimal'}, body:JSON.stringify([{id:randomUUID(), session_id:sessionId, sender:'bot', message:reply}]) });
    return res.status(200).json({ok:true});
  } catch(e) { return res.status(500).json({error:e.message || 'Chat error'}); }
};
