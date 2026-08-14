import Link from "next/link";

export const metadata = {
  title: "Terms of Service — BroFinAi",
  description: "The terms that govern your use of BroFinAi.",
};

const sections = [
  {
    title: "1. Description of Service",
    body: (
      <p>
        BroFinAi lets you log, categorize, and review personal expenses by
        sending messages (text or receipt photos) via WhatsApp, using AI to
        interpret and organize the information into a real-time dashboard.
      </p>
    ),
  },
  {
    title: "2. Eligibility",
    body: (
      <p>
        You must be at least 13 years old (or the minimum age of consent
        in your country) to use the Service. By using the Service, you
        confirm you meet this requirement.
      </p>
    ),
  },
  {
    title: "3. Your Account & Responsibilities",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>You're responsible for the accuracy of the information you send us.</li>
        <li>
          You must not use the Service for any unlawful purpose, to harass
          others, or to send harmful, abusive, or fraudulent content.
        </li>
        <li>
          You're responsible for keeping your WhatsApp account secure,
          since anyone with access to it can access your expense data
          through the bot.
        </li>
      </ul>
    ),
  },
  {
    title: "4. AI-Generated Content & Accuracy Disclaimer",
    body: (
      <p>
        The Service uses AI to read receipts and interpret your messages.
        AI-generated summaries, categorizations, and totals may
        occasionally be inaccurate or incomplete. You're responsible for
        reviewing your data for accuracy.{" "}
        <span className="text-white font-medium">
          The Service is not financial, tax, or investment advice
        </span>{" "}
        and should not be relied upon as such.
      </p>
    ),
  },
  {
    title: "5. Plans & Billing",
    body: (
      <>
        <p>BroFinAi offers the following plans:</p>
        <ul className="list-disc pl-5 space-y-3 mt-3">
          <li>
            <span className="text-white font-medium">Bro Lite — Free Forever ($0.00/month):</span>{" "}
            3 daily expense &amp; income logs, real-time web dashboard access,
            and 1 daily AI receipt OCR scan.
          </li>
          <li>
            <span className="text-white font-medium">Bro Core ($2.55/month):</span>{" "}
            10 daily expense &amp; income logs, real-time web dashboard access,
            30 monthly AI receipt OCR scans, 5 daily voice note trackings,
            one-click Excel (.xlsx) export, and smart budget handling &amp; alerts.
          </li>
          <li>
            <span className="text-white font-medium">Bro Max ($5.99/month):</span>{" "}
            unlimited daily expense &amp; income logs, real-time web dashboard
            access, unlimited monthly AI receipt OCR scans, unlimited voice
            note trackings, one-click Excel (.xlsx) export, and smart budget
            handling &amp; alerts.
          </li>
        </ul>
        <p className="mt-3">
          Paid plans (Bro Core, Bro Max) are billed monthly on a recurring
          basis until cancelled. Payments are processed securely by our
          payment processor, LemonSqueezy. You can upgrade, downgrade, or
          cancel your plan at any time from your dashboard; cancellation
          takes effect at the end of your current billing cycle. Fees are
          non-refundable except where required by law.
        </p>
      </>
    ),
  },
  {
    title: "6. Prohibited Uses",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Attempting to reverse-engineer, disrupt, or overload the Service</li>
        <li>Using automated systems (bots, scrapers) to interact with the Service beyond normal use</li>
        <li>Sending illegal, defamatory, or infringing content</li>
        <li>Using the Service to store data on someone else's behalf without their consent</li>
      </ul>
    ),
  },
  {
    title: "7. Intellectual Property",
    body: (
      <p>
        All rights, title, and interest in the Service — including its
        software, branding, and design — belong to BroFinAi. Your expense
        data remains yours; we don't claim ownership of it.
      </p>
    ),
  },
  {
    title: "8. Termination",
    body: (
      <p>
        We may suspend or terminate your access to the Service at any
        time, with or without notice, if you violate these Terms or
        misuse the Service. You may stop using the Service at any time by
        no longer messaging the bot, and may request account or data
        deletion as described in our Privacy Policy.
      </p>
    ),
  },
  {
    title: "9. Limitation of Liability",
    body: (
      <p>
        The Service is provided "as is" without warranties of any kind.
        To the maximum extent permitted by law, BroFinAi will not be
        liable for any indirect, incidental, or consequential damages
        arising from your use of the Service, including errors in
        AI-generated expense data.
      </p>
    ),
  },
  {
    title: "10. Changes to the Service or Terms",
    body: (
      <p>
        We may modify or discontinue the Service, or update these Terms,
        at any time. Continued use of the Service after changes take
        effect means you accept the updated Terms.
      </p>
    ),
  },
  {
    title: "11. Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of{" "}
        <span className="text-white font-medium">[Country/State]</span>,
        without regard to conflict-of-law principles.
      </p>
    ),
  },
  {
    title: "12. Contact Us",
    body: (
      <p>
        Questions about these Terms? Reach us at{" "}
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

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last updated: <span className="text-slate-300">August 10, 2026</span>
        </p>

        <p className="mt-8 text-base leading-relaxed">
          These Terms of Service ("Terms") govern your use of BroFinAi
          (the "Service"), an AI-powered expense tracker accessible via
          WhatsApp. By messaging our WhatsApp number or otherwise using
          the Service, you agree to these Terms. If you don't agree,
          please don't use the Service.
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
          Questions about these Terms? Message the bot or email{" "}
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