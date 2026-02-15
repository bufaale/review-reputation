import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com";

export async function sendWelcomeEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to SaaS AI Boilerplate!",
    html: `
      <h1>Welcome, ${escapeHtml(name || "there")}!</h1>
      <p>Thanks for signing up. You're all set to start building amazing things.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard</a></p>
    `,
  });
}

export async function sendSubscriptionEmail(email: string, plan: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `You're now on the ${escapeHtml(plan)} plan!`,
    html: `
      <h1>Subscription Confirmed</h1>
      <p>You've been upgraded to the <strong>${escapeHtml(plan)}</strong> plan.</p>
      <p>Enjoy all the premium features!</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendReviewRequestEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  reviewLink: string;
  primaryColor?: string;
}) {
  const { to, customerName, businessName, reviewLink, primaryColor } = params;
  const color = primaryColor || "#2563eb";

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${businessName} would love your feedback!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${escapeHtml(color)};">Hi ${escapeHtml(customerName)}!</h2>
        <p>Thank you for choosing <strong>${escapeHtml(businessName)}</strong>. We hope you had a great experience!</p>
        <p>Would you mind taking a moment to share your feedback? Your review helps us improve and helps others discover us.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(reviewLink)}" style="background-color: ${escapeHtml(color)}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Leave a Review
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Thank you for your time!<br>${escapeHtml(businessName)}</p>
      </div>
    `,
  });
}
