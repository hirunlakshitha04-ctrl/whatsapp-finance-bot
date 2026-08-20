import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — BroFInAi",
  description: "How BroFInAi collects, uses, and protects your data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: (
      <>
        <p>To provide the Service, we collect:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>
            <span className="text-white font-medium">WhatsApp / Telegram account info:</span>{" "}
            your phone number or Telegram username and profile name, received when you
            message the BroFInAi bot.
          </li>
          <li>
            <span className="text-white font-medium">Messages you send:</span>{" "}
            text messages and receipt photos you send to the bot for logging
            expenses.
          </li>
          <li>
            <span className="text-white font-medium">Expense data:</span>{" "}
            amounts, categories, dates, merchants, and notes extracted from
            your messages.
          </li>
          <li>
            <span className="text-white font-medium">Usage data:</span>{" "}
            timestamps, command usage, and error logs, used to keep the
            Service running and to improve it.
          </li>
        </ul>
        <p className="mt-3">
          We do not intentionally collect sensitive information such as your
          national ID, bank account numbers, or passwords. Please avoid
          sending these to the bot.
        </p>
      </>
    ),
  },
  {
    title: "2. How We Use AI Processing",
    body: (
      <p>
        Messages and receipt photos you send may be processed by an AI
        model to auto-scan receipts and extract expense details — amount,
        category, and merchant. This happens automatically to power
        real-time expense logging and dashboard tracking.
      </p>
    ),
  },
  {
    title: "3. How We Use Your Information",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>To record and organize your expenses</li>
        <li>To generate dashboards, summaries, and reports you request</li>
        <li>To send daily, weekly, or monthly summaries you've opted into</li>
        <li>To respond to your messages and provide customer support</li>
        <li>To detect, prevent, and fix technical issues or abuse</li>
      </ul>
    ),
  },
  {
    title: "4. Sharing of Information",
    body: (
      <>
        <p>We do not sell your personal data. We may share information with:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>
            <span className="text-white font-medium">WhatsApp / Meta and Telegram:</span>{" "}
            as the messaging platforms through which the Service operates,
            subject to their own terms and privacy policies.
          </li>
          <li>
            <span className="text-white font-medium">
              AI &amp; infrastructure providers:
            </span>{" "}
            to process messages and host data, under contracts requiring
            them to protect your data.
          </li>
          <li>
            <span className="text-white font-medium">
              Payment processor (Lemon Squeezy):
            </span>{" "}
            for handling subscription payments, if you upgrade to a paid
            plan.
          </li>
          <li>
            <span className="text-white font-medium">Legal authorities:</span>{" "}
            if required by law, regulation, or valid legal process.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Data Storage & Security",
    body: (
      <p>
        Your data is stored on secure servers with reasonable technical and
        organizational safeguards. However, no method of transmission or
        storage is 100% secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: "6. Data Retention",
    body: (
      <p>
        We retain your expense data for as long as your account is active,
        or as needed to provide the Service. You can request deletion at
        any time (see Section 7).
      </p>
    ),
  },
  {
    title: "7. Your Rights",
    body: (
      <>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Access the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Export your expense data</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, contact us at{" "}
          <a
            href="mailto:support@brofinai.com"
            className="text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
          >
            support@brofinai.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "8. Children's Privacy",
    body: (
      <p>
        The Service is not directed at children under 13 (or the minimum
        age required in your country). We do not knowingly collect data
        from children.
      </p>
    ),
  },
  {
    title: "9. Changes to This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. We'll notify
        you of material changes via the bot or by updating the
        "Last updated" date above.
      </p>
    ),
  },
  {
    title: "10. Contact Us",
    body: (
      <p>
        Questions about this Privacy Policy? Reach us at{" "}
        <a
          href="mailto:support@brofinai.com"
          className="text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
        >
          support@brofinai.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-slate-300 selection:bg-purple-500 selection:text-white overflow-x-hidden relative">
      {/* Ambient Lights — same soft aurora blooms as the homepage */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-10%] w-[650px] h-[650px] bg-pink-600/15 rounded-full blur-[190px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none -z-10 bg-emerald-600/15" />

      {/* Navigation Header — matches the homepage nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/70 border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
          Legal
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last updated: <span className="text-slate-300">August 10, 2026</span>
        </p>

        <p className="mt-8 text-base leading-relaxed">
          BroFInAi ("we", "us", "our") provides an AI-powered expense
          tracking service accessible through WhatsApp and Telegram (the
          "Service"). This Privacy Policy explains what information we
          collect when you use the Service, how we use it, and the choices
          you have. By using the Service, you agree to the collection and
          use of information as described here.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
              <div className="text-[15px] leading-relaxed text-slate-400 [&_.text-white]:text-slate-200">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 p-6 text-sm text-slate-400">
          Questions about your data? Message the bot or email{" "}
          <a
            href="mailto:support@brofinai.com"
            className="text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
          >
            support@brofinai.com
          </a>
          .
        </div>
      </div>

      {/* Footer — matches the homepage footer's brand + legal styling */}
      <footer className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 pt-10 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500">© {new Date().getFullYear()} BroFInAi. All rights reserved.</span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank-grade encryption on every message
          </span>
        </div>
      </footer>
    </main>
  );
}