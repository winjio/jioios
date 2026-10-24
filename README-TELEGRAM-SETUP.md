# Telegram admin approval setup (demo credits only)

This integration sends a pending demo-credit request to an admin Telegram chat. The admin can Approve/Reject it; approved requests add demo credits to the user's browser-local wallet. It does **not** verify real payments, and this browser-local wallet is not secure enough for real money or withdrawable balances.

## 1. Create Supabase table

1. Create a Supabase project.
2. Open **SQL Editor** and run `database/deposit_requests.sql`.
3. Copy the project URL and service-role key from Supabase project settings. Keep the service-role key secret.

## 2. Create Telegram bot

1. In Telegram, open `@BotFather`, run `/newbot`, and copy the bot token.
2. Find your numeric Telegram user/chat ID using a trusted bot or your bot's update data. Use your own private chat with the bot as the admin chat.
3. Do not share the bot token publicly or put it in frontend JavaScript.

## 3. Set Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (secret)
- `TELEGRAM_BOT_TOKEN` — token from BotFather (secret)
- `TELEGRAM_ADMIN_CHAT_ID` — your numeric Telegram user/chat ID
- `TELEGRAM_WEBHOOK_SECRET` — a long random secret string (use letters/numbers; keep private)

Redeploy after adding variables.

## 4. Set Telegram webhook

After deployment, replace `YOUR_VERCEL_DOMAIN` and `YOUR_WEBHOOK_SECRET` in this URL and open it once (keep the token private):

`https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_DOMAIN/api/telegram-webhook&secret_token=YOUR_WEBHOOK_SECRET`

Telegram should return `"ok":true`. Never share the full URL because it contains your bot token.

## 5. Important limitations

- This project currently uses `localStorage` for user accounts and wallet balances. The approved credit appears only in the browser where the user is logged in; it is not a secure shared/server-side wallet.
- The API validates request status and prevents repeated admin decisions, but it is a demo scaffold, not a production payment system.
- For real money, integrate a legitimate payment provider's signed server-side webhook and move authentication, wallet balance, ledger entries, and idempotency checks to a secure server-side database. Never credit funds based only on a screenshot or a Telegram button.

## Website live chat

For the website-to-Telegram support chat, also run `database/chat_messages.sql` in Supabase and follow `README-LIVE-CHAT-SETUP.md`. The same Telegram webhook handles both deposit buttons and `/reply SESSION_UUID your message` commands.

## Telegram manual credit commands (server-side demo ledger)

Run `database/wallet_ledger.sql` in the Supabase SQL Editor after `database/deposit_requests.sql`. It creates a server-side ledger and service-role-only RPCs. The Telegram webhook then supports:

- `/add user@example.com 500 reason` — admin-only manual **demo credit ledger** entry (1–100000 credits).
- Deposit inline buttons — atomically approve/reject a pending request; approval writes one ledger entry and repeated approvals cannot credit twice.
- `/help` — list commands.

Keep `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and admin chat ID private. Configure them only as Vercel environment variables and redeploy.

**Important wallet limitation:** this legacy game's gameplay balance is still maintained in browser JavaScript/localStorage. The new ledger records admin credits securely server-side, but it does not yet make every game bet/win or the displayed browser balance server-authoritative. Do not use this architecture for real money or withdrawable balances. A production wallet needs authenticated user accounts (e.g. Supabase Auth), server-side balance/ledger operations for every bet and win, and signed payment-provider webhooks.
