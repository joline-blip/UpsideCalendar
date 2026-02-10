import { Resend } from "resend";
import { env } from "@/lib/env";

export async function sendMagicLinkEmail(toEmail: string, link: string) {
  const { RESEND_API_KEY, EMAIL_FROM } = env();

  // In dev (or if not configured), print the link so you can click it.
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.log(`[MagicLink] To: ${toEmail}\n${link}`);
    // Never crash the app in production due to missing email configuration.
    // If env vars are missing, we log the link so it can be retrieved from server logs.
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  await resend.emails.send({
    from: EMAIL_FROM,
    to: toEmail,
    subject: "Your UpsideCalendar sign-in link",
    text: `Sign in:\n\n${link}\n\nThis link expires soon.`,
  });
}

