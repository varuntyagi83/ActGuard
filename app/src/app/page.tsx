import Link from "next/link";
import { Shield, FileText, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold">ActGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            EU AI Act high-risk enforcement: August 2, 2026
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Compliance before the
            <br />
            <span className="text-blue-600">clock runs out.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Classify your AI systems, generate audit-ready documentation, and
            manage incident reporting — all in one platform built for the EU AI
            Act.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 border-t">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Two modules. Full compliance coverage.
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl border p-8">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Compliance-as-a-Service
                </h3>
                <p className="text-gray-600 mb-4">
                  Risk classification powered by AI. Technical documentation,
                  risk management plans, and data governance records generated in
                  minutes — not weeks.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Article 6 + Annex III risk classification
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Article 11 technical documentation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Audit-ready PDF exports
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl border p-8">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  AI Incident Reporting
                </h3>
                <p className="text-gray-600 mb-4">
                  24-hour SLA tracking, severity classification, and automatic
                  authority routing across all 27 EU member states. Never miss a
                  reporting deadline.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                    Article 72 incident reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                    Auto-route to national authorities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                    Remediation workflows + audit trail
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            From EUR 0 to enterprise
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Free tier to get started. Pro at EUR 99/mo for growing teams.
            Enterprise at EUR 499/mo for full compliance coverage.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Start free today <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ActGuard
          </div>
          <p>EU AI Act compliance made simple.</p>
        </div>
      </footer>
    </div>
  );
}
