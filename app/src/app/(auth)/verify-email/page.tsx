"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Missing verification token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json();
          setErrorMsg(data.error || "Verification failed");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Something went wrong");
        setStatus("error");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">ActGuard</span>
        </Link>
        <CardTitle className="text-2xl">Email Verification</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Verifying your email...</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Your email has been verified successfully!
            </p>
            <Link href="/sign-in">
              <Button>Continue to sign in</Button>
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
            <Link href="/sign-in">
              <Button variant="outline">Back to sign in</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
