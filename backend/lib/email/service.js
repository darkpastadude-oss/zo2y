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

  return `
  <div style="margin:0;padding:24px;background:#061022;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:0;background:linear-gradient(140deg,#132347,#1f3a77 58%,#f59e0b 180%);">
          <div style="padding:28px 28px 18px 28px;color:#ffffff;">
            <div style="display:inline-block;padding:6px 10px;border:1px solid rgba(255,255,255,0.28);border-radius:999px;font-size:12px;letter-spacing:.3px;">Zo2y Updates</div>
            <h1 style="margin:14px 0 8px 0;font-size:30px;line-height:1.2;">${safeTitle}</h1>
            <p style="margin:0;color:#dbeafe;font-size:15px;line-height:1.5;">${safeSubtitle}</p>
          </div>
          <div style="padding:0 28px 22px 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.22);border-radius:12px;">
              <tr>
                <td style="padding:14px 16px;color:#ffffff;font-size:13px;">
                  <strong style="font-size:12px;letter-spacing:.3px;color:#fde68a;">Discover</strong>
                  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.12);">Places</span>
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.12);">Movies</span>
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.12);">Music</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 28px 10px 28px;color:#334155;font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 28px 10px 28px;">
          <a href="${safeCtaUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#111827;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700;font-size:14px;">${safeCtaLabel}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 26px 28px;color:#64748b;font-size:12px;line-height:1.5;border-top:1px solid #e2e8f0;">
          ${safeFooter}
        </td>
      </tr>
    </table>
  </div>`;
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
