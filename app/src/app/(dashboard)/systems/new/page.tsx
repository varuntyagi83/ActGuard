import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NewSystemForm from "./form";

export default async function NewSystemPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const UNLIMITED_EMAILS = ["varun.tyagi83@gmail.com"];
  if (!UNLIMITED_EMAILS.includes(session!.user.email!)) {
    const count = await db.aiSystem.count({ where: { orgId } });
    if (count >= 1) {
      redirect("/systems");
    }
  }

  return <NewSystemForm />;
}
