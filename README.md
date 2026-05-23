# QA Platform — Subscription & Payments

A question-posting platform with tiered subscription plans, built-in payments (no Razorpay/Stripe required), daily posting limits, IST payment window, and optional invoice emails.

## Plans

| Plan   | Price      | Questions per day |
|--------|------------|-------------------|
| Free   | ₹0         | 1                 |
| Bronze | ₹100/month | 5                 |
| Silver | ₹300/month | 10                |
| Gold   | ₹1000/month| Unlimited         |

## Payment window

Payments are accepted **only between 10:00 AM and 11:00 AM IST**.

## Setup

### Backend

```powershell
cd backend
npm install
npm run db:push
npm run dev
```

API: `http://localhost:4000`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## How payment works

1. User selects a paid plan during the payment window.
2. Backend creates an order with invoice number.
3. User confirms payment in the on-screen modal.
4. Subscription activates for one month; optional invoice email is sent if SMTP is configured in `.env`.

No Razorpay keys or external payment account needed.

## Optional: invoice email

Add to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=QA Platform <your@gmail.com>
```

## Testing outside 10–11 AM IST

For local demos, temporarily edit `WINDOW_START_HOUR` / `WINDOW_END_HOUR` in `backend/src/config/paymentWindow.ts`.
