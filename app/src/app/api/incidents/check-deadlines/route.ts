import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDeadlineAlertEmail } from "@/lib/email";

// This endpoint can be called by a cron job (e.g., Vercel Cron, Railway Cron)
// to check for approaching deadlines and send email alerts.
// Call every 30 minutes: GET /api/incidents/check-deadlines?key=CRON_SECRET

export async function GET(req: Request) {
  // Simple secret key auth for cron jobs
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    // Find incidents with deadlines within 6 hours or already overdue
    // that haven't been reported yet
    const urgentIncidents = await db.incident.findMany({
      where: {
        status: { in: ["draft", "reported", "investigating"] },
        reportingDeadline: { lte: sixHoursFromNow },
      },
      include: {
        organization: {
          include: {
            users: {
              where: { role: { in: ["admin", "compliance_officer"] } },
              select: { email: true },
            },
          },
        },
      },
    });

    let emailsSent = 0;

    for (const incident of urgentIncidents) {
      const deadline = new Date(incident.reportingDeadline);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send to all admins and compliance officers in the org
      for (const user of incident.organization.users) {
        try {
          await sendDeadlineAlertEmail(
            user.email,
            incident.title,
            hoursLeft,
            deadline.toLocaleString(),
            incident.id
          );
          emailsSent++;
        } catch {
          // Continue sending to other users
        }
      }
    }

    return NextResponse.json({
      checked: urgentIncidents.length,
      emailsSent,
    });
  } catch (err) {
    console.error("Deadline check error:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
