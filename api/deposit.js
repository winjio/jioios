// Vercel serverless endpoint for DEMO-credit deposit requests.
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
const { randomUUID } = require('crypto');
const BASE = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
async function db(path, options = {}) {
  const url = BASE();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Backend is not configured. Add Supabase environment variables in Vercel.');
  const r = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await r.text();
  if (!r.ok) throw new Error(`Database error (${r.status}): ${body.slice(0, 200)}`);
  return body ? JSON.parse(body) : null;
}
async function telegram(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !process.env.TELEGRAM_ADMIN_CHAT_ID) throw new Error('Telegram bot is not configured in Vercel environment variables.');
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (!data.ok) throw new Error(data.description || 'Telegram API error');
  return data.result;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { action, amount, email, requestId } = req.body || {};
    if (action === 'create') {
      const value = Number(amount);
      if (!Number.isInteger(value) || value < 50 || value > 100000) return res.status(400).json({ error: 'Amount must be ₹50–₹100000.' });
      if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) return res.status(400).json({ error: 'Please log in with a valid email.' });
      const id = randomUUID();
      const rows = await db('deposit_requests', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify([{ id, email: email.toLowerCase(), amount: value, status: 'pending', created_at: new Date().toISOString() }]) });
      const row = rows && rows[0];
      await telegram('sendMessage', { chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID, text: `🎰 Casino Arcade — DEMO CREDIT REQUEST\n\nRequest: ${id}\nUser: ${email}\nAmount: ₹${value}\nStatus: Pending\n\nApprove only if this is an authorized demo-credit request. No real payment is verified by this bot.`, reply_markup: { inline_keyboard: [[{ text: '✅ Approve demo credits', callback_data: `approve:${id}` }, { text: '❌ Reject', callback_data: `reject:${id}` }]] } });
      return res.status(200).json({ ok: true, requestId: row.id, status: row.status });
    }
    if (action === 'status') {
      if (typeof requestId !== 'string') return res.status(400).json({ error: 'Missing requestId' });
      const rows = await db(`deposit_requests?id=eq.${encodeURIComponent(requestId)}&select=id,email,amount,status`);
      if (!rows || !rows.length) return res.status(404).json({ error: 'Request not found' });
      // Email must match the logged-in browser identity. This is suitable only for demo credits;
      // production wallet balances must be authenticated and stored server-side.
      if (typeof email !== 'string' || rows[0].email !== email.toLowerCase()) return res.status(403).json({ error: 'Request identity mismatch' });
      return res.status(200).json({ ok: true, requestId: rows[0].id, amount: rows[0].amount, status: rows[0].status });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) { return res.status(500).json({ error: e.message || 'Server error' }); }
};
