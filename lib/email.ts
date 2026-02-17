import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.APP_EMAIL_FROM || "no-reply@bacinventra.com";
const fromName = process.env.APP_EMAIL_FROM_NAME || "BAC-Inventra";

type EmailPayload = {
  to: string | null | undefined;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!to || !resendKey) {
    return { skipped: true };
  }
  const resend = new Resend(resendKey);
  return resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html
  });
}
