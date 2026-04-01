import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmailVerificationToken, consumeToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const email = await validateEmailVerificationToken(token);
    if (!email) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await consumeToken(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
