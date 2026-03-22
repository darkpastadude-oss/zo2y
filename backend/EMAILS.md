# Email Setup

This backend now supports transactional emails for:
- welcome emails
- reminder emails
- bulk reminder sends
- authenticated post-signup welcome triggers

## 1) Environment Variables

Set these in `backend/.env`:

- `RESEND_API_KEY`
- `EMAIL_FROM` (example: `Zo2y <noreply@yourdomain.com>`)
- `EMAIL_REPLY_TO` (optional)
- `APP_BASE_URL` (example: `https://zo2y.com`)
- `EMAIL_API_KEY` (recommended to protect endpoints)
- `AUTO_SEND_WELCOME_EMAIL=true` (optional, for backend `/api/auth/signup` flow)

Important:
- The live `sign-up.html` flow uses Supabase Auth, so signup confirmation emails are sent by Supabase.
- Zo2y's own welcome email is triggered after the confirmed user lands on `/auth-callback.html`.
- `POST /api/emails/welcome/trigger` uses the authenticated user's bearer token instead of `x-email-api-key`.

## 2) Endpoints

Base path: `/api/emails`

- `GET /health`
- `POST /welcome`
- `POST /welcome/trigger`
- `POST /reminder`
- `POST /reminders/bulk`

If `EMAIL_API_KEY` is set, pass it in header:

`x-email-api-key: <YOUR_KEY>`

## 3) Example Requests

### Welcome

```bash
curl -X POST http://localhost:5000/api/emails/welcome \
  -H "Content-Type: application/json" \
  -H "x-email-api-key: YOUR_KEY" \
  -d '{
    "email": "user@example.com",
    "name": "Sigma"
  }'
```

### Reminder

```bash
curl -X POST http://localhost:5000/api/emails/reminder \
  -H "Content-Type: application/json" \
  -H "x-email-api-key: YOUR_KEY" \
  -d '{
    "email": "user@example.com",
    "name": "Sigma",
    "reminderText": "You still have 8 saved places to review.",
    "actionUrl": "https://zo2y.com/profile.html",
    "actionLabel": "Review my lists"
  }'
```

### Authenticated welcome trigger

```bash
curl -X POST http://localhost:5000/api/emails/welcome/trigger \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer USER_ACCESS_TOKEN" \
  -d '{
    "appUrl": "https://zo2y.com"
  }'
```

### Bulk reminders

```bash
curl -X POST http://localhost:5000/api/emails/reminders/bulk \
  -H "Content-Type: application/json" \
  -H "x-email-api-key: YOUR_KEY" \
  -d '{
    "recipients": [
      { "email": "a@example.com", "name": "A" },
      { "email": "b@example.com", "name": "B" }
    ],
    "reminderText": "Your saved lists are waiting.",
    "actionUrl": "https://zo2y.com/profile.html",
    "actionLabel": "Open Zo2y"
  }'
```
