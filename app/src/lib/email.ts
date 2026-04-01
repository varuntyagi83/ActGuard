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

export async function sendDeadlineAlertEmail(
  email: string,
  incidentTitle: string,
  hoursLeft: number,
  deadlineDate: string,
  incidentId: string
) {
  const incidentUrl = `${APP_URL}/incidents/${incidentId}`;
  const urgency = hoursLeft <= 0 ? "OVERDUE" : hoursLeft <= 6 ? "URGENT" : "Approaching";
  const urgencyColor = hoursLeft <= 0 ? "#dc2626" : hoursLeft <= 6 ? "#ea580c" : "#ca8a04";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[${urgency}] Incident Deadline: ${incidentTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <div style="background:${urgencyColor};color:#fff;padding:12px 16px;border-radius:6px 6px 0 0;font-weight:bold;font-size:14px;">
          ${urgency}: Reporting Deadline ${hoursLeft <= 0 ? "Passed" : "Approaching"}
        </div>
        <div style="border:1px solid #ddd;border-top:none;border-radius:0 0 6px 6px;padding:16px;">
          <h3 style="margin:0 0 8px;font-size:16px;">${incidentTitle}</h3>
          <p style="color:#555;font-size:13px;margin:0 0 12px;">
            Deadline: <strong>${deadlineDate}</strong><br/>
            ${hoursLeft > 0 ? `Time remaining: <strong>${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}m</strong>` : `<strong style="color:#dc2626;">This deadline has passed.</strong>`}
          </p>
          <a href="${incidentUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;">
            View Incident
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:11px;">ActGuard — EU AI Act Compliance Suite</p>
      </div>
    `,
  });
}

export async function sendIncidentReportEmail(
  authorityEmail: string,
  incidentTitle: string,
  reportType: string,
  pdfBuffer: Buffer
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: authorityEmail,
    subject: `[EU AI Act - Art. 73] Incident Report: ${incidentTitle} (${reportType})`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">EU AI Act - Article 73 Incident Report</h2>
        <p style="color:#555;line-height:1.6;">
          This is a formal notification under <strong>Article 73 of the EU AI Act</strong>.
          Please find attached the incident report for the following:
        </p>
        <div style="border:1px solid #ddd;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Incident:</strong> ${incidentTitle}</p>
          <p style="margin:0;"><strong>Report type:</strong> ${reportType}</p>
        </div>
        <p style="color:#555;line-height:1.6;">
          The full report is attached as a PDF document. Please review and acknowledge receipt
          at your earliest convenience.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:11px;">ActGuard — EU AI Act Compliance Suite</p>
      </div>
    `,
    attachments: [
      {
        filename: "incident-report.pdf",
        content: pdfBuffer,
      },
    ],
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
