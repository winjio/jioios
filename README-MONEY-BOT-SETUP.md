# Telegram Money Add Bot — Setup

This feature is for **demo credits only**, not real money.

## 1) Supabase
1. Run `database/deposit_requests.sql`.
2. Run `database/wallet_ledger.sql`.
3. Keep the database tables private; do not add public/anon policies.

## 2) Vercel environment variables
Set these in Project → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secret; server only)
- `TELEGRAM_BOT_TOKEN` (secret; server only)
- `TELEGRAM_ADMIN_CHAT_ID` (your numeric private Telegram chat/user ID)
- `TELEGRAM_WEBHOOK_SECRET` (random secret used for Telegram webhook verification)

Redeploy after setting variables.

## 3) Configure Telegram webhook
Use Telegram Bot API `setWebhook` with URL `https://YOUR-VERCEL-DOMAIN/api/telegram-webhook` and `secret_token` equal to `TELEGRAM_WEBHOOK_SECRET`. Never share the URL containing the bot token.

## 4) Commands
- `/add user@example.com 500 optional reason` — record 500 demo credits for that email in the server ledger.
- `/reply SESSION_UUID your message` — reply to website live chat.
- Deposit request buttons — Approve/Reject; approval and ledger insertion happen atomically and duplicate approval is prevented.
- `/help` — commands list.

The webhook rejects messages and callbacks unless both the Telegram chat ID and sender ID match `TELEGRAM_ADMIN_CHAT_ID`.

## Important limitations
The existing site's sign-in and game balance are browser-local. The server ledger is protected and records credits, but it is not yet synchronized as the authoritative balance for gameplay. Do not use for real-money/withdrawable balances. To do that safely, migrate login to server-verified auth and route every bet, win, bonus, deposit, and withdrawal through transactional server-side wallet operations. Verify actual deposits with signed payment-provider webhooks, never just a screenshot or admin message.
