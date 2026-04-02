import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDeadlineAlertEmail } from "@/lib/email";
import { formatDateTime } from "@/lib/format-date";

// Vercel Cron calls this every hour: GET /api/incidents/check-deadlines
// Also accepts ?key=CRON_SECRET for manual/external triggers

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    // Also allow Vercel cron (no key needed when called internally)
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Fetch all non-closed incidents with upcoming or passed deadlines
    const incidents = await db.incident.findMany({
      where: {
        status: { in: ["draft", "reported", "investigating"] },
        reportingDeadline: { lte: in72h },
      },
      include: {
        organization: {
          select: {
            alertAt72h: true,
            alertAt24h: true,
            alertOnOverdue: true,
            users: {
              where: { role: { in: ["admin", "compliance_officer"] } },
              select: { email: true },
            },
          },
        },
      },
    });

    let emailsSent = 0;
    const updates: Array<{ id: string; data: Record<string, Date> }> = [];

    for (const incident of incidents) {
      const deadline = new Date(incident.reportingDeadline);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      const deadlineStr = formatDateTime(deadline);
      const incidentUsers = incident.organization.users;

      const org = incident.organization;

      // Overdue alert (sent once, if org has it enabled)
      if (hoursLeft < 0 && !incident.alertOverdueSentAt && org.alertOnOverdue) {
        for (const user of incidentUsers) {
          try {
            await sendDeadlineAlertEmail(user.email, incident.title, hoursLeft, deadlineStr, incident.id);
            emailsSent++;
          } catch { /* continue */ }
        }
        updates.push({ id: incident.id, data: { alertOverdueSentAt: now } });
        continue; // don't double-send
      }

      // 24h alert (sent once when < 24h remaining, if org has it enabled)
      if (hoursLeft <= 24 && hoursLeft > 0 && !incident.alert24hSentAt && org.alertAt24h) {
        for (const user of incidentUsers) {
          try {
            await sendDeadlineAlertEmail(user.email, incident.title, hoursLeft, deadlineStr, incident.id);
            emailsSent++;
          } catch { /* continue */ }
        }
        updates.push({ id: incident.id, data: { alert24hSentAt: now } });
        continue;
      }

      // 72h alert (sent once when < 72h remaining, if org has it enabled)
      if (hoursLeft <= 72 && hoursLeft > 24 && !incident.alert72hSentAt && org.alertAt72h) {
        for (const user of incidentUsers) {
          try {
            await sendDeadlineAlertEmail(user.email, incident.title, hoursLeft, deadlineStr, incident.id);
            emailsSent++;
          } catch { /* continue */ }
        }
        updates.push({ id: incident.id, data: { alert72hSentAt: now } });
      }
    }

    // Persist alert timestamps in parallel
    await Promise.all(
      updates.map(({ id, data }) =>
        db.incident.update({ where: { id }, data })
      )
    );

    return NextResponse.json({
      checked: incidents.length,
      alertsSent: updates.length,
      emailsSent,
    });
  } catch (err) {
    console.error("Deadline check error:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
