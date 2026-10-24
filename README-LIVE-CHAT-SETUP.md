# Website Live Chat → Telegram Admin (demo support)

This adds a chat widget to the website. User messages are saved in Supabase, sent to your Telegram admin chat, and receive a simple automatic reply. You can manually reply from Telegram and the reply appears in the website chat.

## 1. Supabase table

In Supabase → SQL Editor, run both:
- `database/deposit_requests.sql` (if using the existing demo deposit approval flow)
- `database/chat_messages.sql`

Keep the Supabase service-role key secret. Do not add it to frontend JavaScript.

## 2. Telegram bot and Vercel environment variables

Create a bot with `@BotFather`, then set these variables in Vercel → Project → Settings → Environment Variables:

- `TELEGRAM_BOT_TOKEN` — secret bot token
- `TELEGRAM_ADMIN_CHAT_ID` — your numeric Telegram user/chat ID (use a private chat with your bot)
- `TELEGRAM_WEBHOOK_SECRET` — long random secret, letters/numbers/underscore/hyphen only
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — secret service-role key

Redeploy after adding/updating environment variables.

## 3. Configure Telegram webhook

Use this URL in a browser or HTTP client, replacing every placeholder. Never share the resulting URL because it contains your bot token:

`https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_DOMAIN/api/telegram-webhook&secret_token=YOUR_WEBHOOK_SECRET`

Telegram should respond with `"ok":true`. This is the same webhook used by demo deposit Approve/Reject buttons and live chat replies.

## 4. Reply to a website visitor

When a visitor sends a chat message, the admin Telegram chat receives a message containing a session UUID and the visitor's text. Reply using this exact command format:

`/reply SESSION_UUID Your reply text here`

Example:

`/reply 123e4567-e89b-12d3-a456-426614174000 Hello, how can I help?`

The reply is stored in Supabase and appears in the visitor's chat on the next poll (normally within 4 seconds). Send `/help` to the bot for command syntax.

## 5. Important limitations and safety

- Automatic replies are simple keyword-based demo responses, not an AI assistant.
- This chat scaffold uses a browser-generated session UUID, which is not strong user authentication. Do not use it for sensitive account data. For production, bind sessions to authenticated users, add abuse/rate limiting and retention controls.
- This is a support chat, not payment verification. Never approve real payments based on chat text or screenshots alone.
- The site and API must be deployed on Vercel (or a compatible serverless host); opening `index.html` directly from a local file will not make `/api/...` endpoints work.
