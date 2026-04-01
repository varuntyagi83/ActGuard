import crypto from "crypto";
import { db } from "@/lib/db";

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Remove any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  });

  await db.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token,
      expires,
    },
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (!record.identifier.startsWith("reset:")) return null;
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  return record.identifier.replace("reset:", "");
}

export async function consumeToken(token: string) {
  await db.verificationToken.delete({ where: { token } });
}

export async function generateEmailVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.verificationToken.deleteMany({
    where: { identifier: `verify:${email}` },
  });

  await db.verificationToken.create({
    data: {
      identifier: `verify:${email}`,
      token,
      expires,
    },
  });

  return token;
}

export async function validateEmailVerificationToken(token: string) {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (!record.identifier.startsWith("verify:")) return null;
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  return record.identifier.replace("verify:", "");
}
