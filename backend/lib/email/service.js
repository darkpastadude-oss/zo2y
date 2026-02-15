const RESEND_API_URL = "https://api.resend.com/emails";

function assertEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("Missing EMAIL_FROM");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function baseTemplate({ title, subtitle, bodyHtml, ctaLabel, ctaUrl, footerText }) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeFooter = escapeHtml(footerText || "You are receiving this email because you have a Zo2y account.");
  const safeCtaLabel = escapeHtml(ctaLabel || "Open Zo2y");
  const safeCtaUrl = escapeHtml(ctaUrl || process.env.APP_BASE_URL || "https://zo2y.com");
  const baseUrl = String(process.env.APP_BASE_URL || "https://zo2y.com").replace(/\/+$/, "");
  const safeLogoUrl = escapeHtml(`${baseUrl}/images/logo.png`);

  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <style>
        body { margin: 0; padding: 0; background: #061022; }
        .outer { width: 100%; background: #061022; padding: 22px 10px; }
        .container { width: 100%; max-width: 660px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid #d9e1f2; background: #ffffff; }
        .hero {
          background: radial-gradient(130% 90% at 0% 0%, #27488d 0%, #132347 56%, #102347 100%);
          color: #ffffff;
          padding: 30px 30px 24px 30px;
        }
        .pill { display: inline-block; padding: 7px 12px; border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; color: #e2e8f0; font-size: 12px; }
        .hero-title { margin: 16px 0 8px 0; font-size: 40px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; }
        .hero-sub { margin: 0; font-size: 18px; line-height: 1.5; color: #dbeafe; }
        .brand-row { margin-bottom: 10px; }
        .brand-logo { width: 52px; height: 52px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); display: block; }
        .discover {
          margin-top: 18px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          padding: 16px;
        }
        .discover-title { font-size: 13px; font-weight: 700; color: #fde68a; margin-bottom: 10px; }
        .chips { line-height: 2; }
        .chip {
          display: inline-block;
          border-radius: 999px;
          padding: 6px 11px;
          margin-right: 6px;
          margin-bottom: 6px;
          background: rgba(255,255,255,0.15);
          color: #f8fafc;
          font-size: 15px;
        }
        .content { padding: 28px 30px 12px 30px; color: #334155; font-size: 24px; line-height: 1.66; }
        .action { padding: 10px 30px 26px 30px; }
        .btn {
          display: inline-block;
          text-decoration: none;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #111827;
          font-weight: 800;
          font-size: 16px;
          padding: 14px 18px;
          border-radius: 12px;
        }
        .grid { padding: 0 30px 24px 30px; }
        .grid-box {
          width: 100%;
          border: 1px solid #dbe4f2;
          border-radius: 12px;
          background: #f8fafc;
        }
        .grid-row { font-size: 14px; color: #1e293b; padding: 11px 14px; border-bottom: 1px solid #e2e8f0; }
        .grid-row:last-child { border-bottom: none; }
        .footer { border-top: 1px solid #e2e8f0; padding: 16px 30px 26px 30px; color: #64748b; font-size: 12px; line-height: 1.55; }
        @media only screen and (max-width: 620px) {
          .outer { padding: 0 !important; }
          .container { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .hero { padding: 22px 18px 18px 18px !important; }
          .hero-title { font-size: 32px !important; line-height: 1.1 !important; }
          .hero-sub { font-size: 17px !important; }
          .chip { font-size: 14px !important; }
          .content { padding: 20px 18px 8px 18px !important; font-size: 21px !important; line-height: 1.6 !important; }
          .action { padding: 10px 18px 18px 18px !important; }
          .grid { padding: 0 18px 18px 18px !important; }
          .footer { padding: 14px 18px 24px 18px !important; }
        }
      </style>
    </head>
    <body>
      <div class="outer">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="hero">
              <div class="brand-row">
                <img src="${safeLogoUrl}" alt="Zo2y" class="brand-logo" />
              </div>
              <span class="pill">Zo2y Updates</span>
              <h1 class="hero-title">${safeTitle}</h1>
              <p class="hero-sub">${safeSubtitle}</p>
              <div class="discover">
                <div class="discover-title">Discover</div>
                <div class="chips">
                  <span class="chip">Places</span>
                  <span class="chip">Movies</span>
                  <span class="chip">Music</span>
                  <span class="chip">Books</span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="content">${bodyHtml}</td>
          </tr>
          <tr>
            <td class="action">
              <a href="${safeCtaUrl}" class="btn">${safeCtaLabel}</a>
            </td>
          </tr>
          <tr>
            <td class="grid">
              <table role="presentation" class="grid-box" cellpadding="0" cellspacing="0">
                <tr><td class="grid-row">Save to custom lists in one tap</td></tr>
                <tr><td class="grid-row">Follow friends and discover new picks</td></tr>
                <tr><td class="grid-row">Get reminders when your lists need updates</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer">${safeFooter}</td>
          </tr>
        </table>
      </div>
    </body>
  </html>`;
}

function buildWelcomeEmail({ name, appUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeAppUrl = appUrl || process.env.APP_BASE_URL || "https://zo2y.com";
  return {
    subject: "Welcome to Zo2y",
    text: `Welcome to Zo2y, ${safeName}. Start building your lists at ${safeAppUrl}.`,
    html: baseTemplate({
      title: "Welcome to Zo2y",
      subtitle: "Track favorites, build custom lists, and follow friends.",
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Hi ${safeName},</p>
        <p style="margin:0 0 10px 0;">Your account is ready. You can start saving places, movies, books, games, and music into custom lists.</p>
        <p style="margin:0;">Use your profile to follow friends and discover what they are enjoying.</p>
      `,
      ctaLabel: "Open Zo2y",
      ctaUrl: safeAppUrl,
      footerText: "If you did not create this account, you can ignore this email."
    })
  };
}

function buildReminderEmail({ name, reminderText, actionUrl, actionLabel }) {
  const safeName = escapeHtml(name || "there");
  const safeReminderText = escapeHtml(reminderText || "You have items waiting in your lists.");
  return {
    subject: "Zo2y reminder",
    text: `Hi ${safeName}, ${safeReminderText}`,
    html: baseTemplate({
      title: "Friendly Reminder",
      subtitle: "Your lists are waiting for you.",
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Hi ${safeName},</p>
        <p style="margin:0;">${safeReminderText}</p>
      `,
      ctaLabel: actionLabel || "Continue on Zo2y",
      ctaUrl: actionUrl || process.env.APP_BASE_URL || "https://zo2y.com"
    })
  };
}

export async function sendEmail({ to, subject, html, text, tags = [] }) {
  assertEmailConfig();

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      tags: tags.length ? tags : undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Email send failed with ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function sendWelcomeEmail({ to, name, appUrl }) {
  const payload = buildWelcomeEmail({ name, appUrl });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: [{ name: "type", value: "welcome" }],
  });
}

export async function sendReminderEmail({ to, name, reminderText, actionUrl, actionLabel }) {
  const payload = buildReminderEmail({ name, reminderText, actionUrl, actionLabel });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: [{ name: "type", value: "reminder" }],
  });
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
