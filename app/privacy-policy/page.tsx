import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — BroFinAi",
  description: "How BroFinAi collects, uses, and protects your data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: (
      <>
        <p>To provide the Service, we collect:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>
            <span className="text-white font-medium">WhatsApp account info:</span>{" "}
            your phone number and WhatsApp profile name, received when you
            message the BroFinAi bot.
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
            <span className="text-white font-medium">WhatsApp / Meta:</span>{" "}
            as the messaging platform through which the Service operates,
            subject to WhatsApp's own terms and privacy policy.
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
            className="text-teal-300 hover:text-teal-200 underline underline-offset-4"
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
        you of material changes via the WhatsApp bot or by updating the
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
          className="text-teal-300 hover:text-teal-200 underline underline-offset-4"
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
    <main className="min-h-screen bg-[#040309] text-slate-300">
      {/* nav */}
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-sm">
              🤖
            </span>
            <span className="text-lg font-bold text-white">
              Bro<span className="bg-gradient-to-r from-teal-300 to-purple-400 bg-clip-text text-transparent">FInAi</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-teal-300">
          Legal
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last updated: <span className="text-slate-300">August 10, 2026</span>
        </p>

        <p className="mt-8 text-base leading-relaxed">
          BroFinAi ("we", "us", "our") provides an AI-powered expense
          tracking service accessible through WhatsApp (the "Service").
          This Privacy Policy explains what information we collect when
          you use the Service, how we use it, and the choices you have. By
          using the Service, you agree to the collection and use of
          information as described here.
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

        <div className="mt-14 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/10 to-purple-500/10 p-6 text-sm text-slate-400">
          Questions about your data? Message the bot or email{" "}
          <a
            href="mailto:support@brofinai.com"
            className="text-teal-300 hover:text-teal-200 underline underline-offset-4"
          >
            support@brofinai.com
          </a>
          .
        </div>
      </div>
    </main>
  );
}