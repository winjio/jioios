// Poll chat messages for a session. Demo scaffold: use authenticated sessions for production.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') return res.status(405).json({error:'GET only'});
  const sessionId = String(req.query?.sessionId || '');
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return res.status(400).json({error:'Invalid chat session'});
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return res.status(500).json({error:'Chat backend is not configured.'});
  try {
    const url = `${base}/rest/v1/chat_messages?session_id=eq.${encodeURIComponent(sessionId)}&select=id,sender,message,created_at&order=created_at.asc&limit=100`;
    const r = await fetch(url, {headers:{apikey:key, Authorization:`Bearer ${key}`}});
    const body = await r.json(); if (!r.ok) throw new Error('Database lookup failed');
    return res.status(200).json({messages:body});
  } catch(e) { return res.status(500).json({error:e.message || 'Chat error'}); }
};
