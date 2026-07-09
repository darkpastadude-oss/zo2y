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

function baseTemplate({ title, subtitle, bodyHtml, ctaLabel, ctaUrl, footerText, preheader }) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle || "");
  const safeFooter = escapeHtml(footerText || "you're getting this because you have a zo2y account.");
  const safeCtaLabel = escapeHtml(ctaLabel || "open zo2y");
  const safeCtaUrl = escapeHtml(ctaUrl || process.env.APP_BASE_URL || "https://zo2y.com");
  const safePreheader = escapeHtml(preheader || subtitle || title || "zo2y update");
  const safeSupportAddress = escapeHtml(process.env.EMAIL_REPLY_TO || "darkpastadude@gmail.com");

  const subtitleHtml = safeSubtitle
    ? `<p style="margin:0 0 20px 0;color:#6b7280;font-size:16px;line-height:1.5;">${safeSubtitle}</p>`
    : "";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <style>
        @media (prefers-color-scheme: dark) {
          body, .email-bg { background-color: #0f172a !important; }
          .email-wrap { background-color: #1e293b !important; }
          h1 { color: #ffffff !important; }
          .email-subtitle { color: #94a3b8 !important; }
          .email-body { color: #e2e8f0 !important; }
          .email-divider { border-color: #334155 !important; }
          .email-footer { color: #64748b !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f9fafb;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrap" style="max-width:480px;background-color:#ffffff;border-radius:12px;">
              <tr>
                <td style="padding:32px 28px 0 28px;">
                  <img src="https://zo2y.com/newlogo.png" alt="zo2y" width="40" height="40" style="display:block;border-radius:10px;" />
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 0 28px;">
                  <h1 class="email-title" style="margin:0;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">${safeTitle}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 28px 0 28px;">
                  ${subtitleHtml ? `<div class="email-subtitle">${subtitleHtml}</div>` : ""}
                  <div class="email-body" style="color:#374151;font-size:15px;line-height:1.6;">${bodyHtml}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 0 28px;">
                  <a href="${safeCtaUrl}" style="display:inline-block;background-color:#f59e0b;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:8px;">${safeCtaLabel}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 28px 28px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td class="email-divider" style="border-top:1px solid #e5e7eb;padding-top:20px;">
                      <p class="email-footer" style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;line-height:1.5;">${safeFooter}</p>
                      <p class="email-footer" style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">need help? reply to this email or contact ${safeSupportAddress}.</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function buildWelcomeEmail({ name, appUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeAppUrl = appUrl || process.env.APP_BASE_URL || "https://zo2y.com";
  return {
    subject: "welcome to zo2y",
    text: `hey ${safeName}, your zo2y account is ready. start building lists at ${safeAppUrl}.`,
    html: baseTemplate({
      title: "welcome to zo2y",
      subtitle: "your account is all set.",
      preheader: "your zo2y account is ready. start building lists across every category.",
      bodyHtml: `
        <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">hey ${safeName},</p>
        <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">you're in. start saving places, movies, books, games, and music into your own lists.</p>
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">follow friends and see what they're into.</p>
      `,
      ctaLabel: "open zo2y",
      ctaUrl: safeAppUrl,
      footerText: "you didn't create this account? just ignore this email."
    })
  };
}

function buildReminderEmail({ name, reminderText, actionUrl, actionLabel }) {
  const safeName = escapeHtml(name || "there");
  const safeReminderText = escapeHtml(reminderText || "you have items waiting in your lists.");
  return {
    subject: "zo2y reminder",
    text: `hey ${safeName}, ${safeReminderText}`,
    html: baseTemplate({
      title: "friendly reminder",
      subtitle: "your lists are waiting.",
      preheader: safeReminderText,
      bodyHtml: `
        <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">hey ${safeName},</p>
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${safeReminderText}</p>
      `,
      ctaLabel: actionLabel || "open zo2y",
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

function buildVerificationEmail({ name, confirmationUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(confirmationUrl || process.env.APP_BASE_URL || "https://zo2y.com");
  return {
    subject: "confirm your email",
    text: `hey ${safeName}, click here to verify your zo2y account: ${safeUrl}`,
    html: baseTemplate({
      title: "confirm your email",
      preheader: "click below to verify your email and get started.",
      bodyHtml: `
        <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">hey ${safeName},</p>
        <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">tap the button below to verify your email and you're good to go.</p>
      `,
      ctaLabel: "confirm account",
      ctaUrl: safeUrl,
      footerText: "you didn't sign up for zo2y? just ignore this email."
    })
  };
}

export async function sendVerificationEmail({ to, name, confirmationUrl }) {
  const payload = buildVerificationEmail({ name, confirmationUrl });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: [{ name: "type", value: "verification" }],
  });
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
