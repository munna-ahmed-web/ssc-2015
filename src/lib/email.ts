/**
 * Email adapter — free-tier friendly, transport-swappable.
 *
 * Current transport: nodemailer + Gmail App Password (free, ~500/day).
 *   Env: SMTP_USER (gmail address), SMTP_PASS (app password).
 *
 * When the site gets a verified custom domain, swap the transport inside
 * `sendEmail()` for Resend/Brevo — callers do not change.
 *
 * Dev fallback: if SMTP_USER/SMTP_PASS are not set, the email is logged to the
 * server console instead of sent, so the flow is testable without credentials.
 */

import nodemailer from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      `[email] SMTP not configured — email NOT sent.\n  To: ${input.to}\n  Subject: ${input.subject}\n  Text: ${input.text}`,
    );
    return;
  }

  await transport.sendMail({
    from: `"SSC-2015 Foundation" <${process.env.SMTP_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

/** Magic-link login email for the member portal. */
export async function sendMemberMagicLink(
  to: string,
  memberName: string,
  url: string,
): Promise<void> {
  const subject = "Your SSC-2015 Foundation login link";
  const text = `Hi ${memberName},\n\nClick the link below to open your member portal. The link works once and expires in 15 minutes.\n\n${url}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a; margin-bottom: 4px;">SSC-2015 Foundation</h2>
      <p style="color: #333;">Hi <strong>${memberName}</strong>,</p>
      <p style="color: #333;">Click the button below to open your member portal and view your contributions.</p>
      <p style="margin: 28px 0;">
        <a href="${url}"
           style="background: #16a34a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Open My Portal
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">This link works once and expires in <strong>15 minutes</strong>.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
    </div>`;

  await sendEmail({ to, subject, html, text });
}
