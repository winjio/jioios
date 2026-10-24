# 🎰 Casino Arcade — 25 Games

Multi-file casino game with login, deposit, withdraw, referral, VIP levels, gift codes and 25 games.

## 🚀 How to Run

1. Download/save all files preserving folder structure
2. Open `index.html` in any browser
3. Register an account → get ₹1000 welcome bonus
4. Start playing!

## 📁 Structure

- `index.html` — Main HTML
- `css/main.css` — Core styles
- `css/games.css` — Game-specific styles
- `css/account.css` — Auth/account/VIP/payment/live feed
- `js/core.js` — Utilities, cards, sounds, hand evaluators
- `js/livefeed.js` — Fake users, chips, big win animations
- `js/routing.js` — Hash navigation
- `js/auth.js` — Login/Register/Reset password
- `js/account.js` — Deposit/Withdraw/Refer/History
- `js/vip.js` — VIP levels
- `js/payment.js` — Payment gateway mockup + gift codes
- `js/games.js` — All 25 games + init

## 🎁 Gift Codes

WELCOME100 (₹100) • FESTIVE500 (₹500) • VIPBOOST (₹250) • NEWYEAR2024 (₹1000) • LUCKY777 (₹777)

## ⚠️ Demo Only

All payments/deposits/withdrawals are mock. No real money involved.

## Code Check Status

- JavaScript syntax check: passed for all 8 files.
- Game panel check: all 25 game panel IDs are present in `index.html`.
- `games.js` DOM reference check: all 124 statically referenced element IDs are present in `index.html`.
- Browser end-to-end gameplay: not fully verified; test each game after deployment before public use.

This is a front-end demo. Account data is stored in the browser and payment flows are mocked; do not use it for real-money transactions without a secure backend and provider-side verification.

## 🤖 Telegram Approval (Demo Credits)

A Telegram admin approval backend scaffold is included in `api/` with the SQL schema in `database/deposit_requests.sql`. Setup steps and required Vercel environment variables are in `README-TELEGRAM-SETUP.md`. It is for demo credits only; the current browser-local wallet is not suitable for real-money transactions.
