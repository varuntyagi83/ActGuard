import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "ActGuard <noreply@corevisionailabs.com>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your ActGuard password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">Reset your password</h2>
        <p style="color:#555;line-height:1.6;">
          You requested a password reset for your ActGuard account. Click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:11px;">ActGuard — EU AI Act Compliance Suite</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your ActGuard email",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">Verify your email</h2>
        <p style="color:#555;line-height:1.6;">
          Welcome to ActGuard! Please verify your email address to complete your registration.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin:16px 0;">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:11px;">ActGuard — EU AI Act Compliance Suite</p>
      </div>
    `,
  });
}
