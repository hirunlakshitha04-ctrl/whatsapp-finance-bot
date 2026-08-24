import Link from "next/link";

export const metadata = {
  title: "Terms of Service — BroFInAi",
  description: "The terms that govern your use of BroFInAi.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-semibold">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-8 h-8 object-contain" />
            BroFInAi
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">Legal</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: August 24, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-[15px] leading-relaxed">
          <p>
            These Terms of Service ("Terms") govern your use of BroFInAi (the "Service"), an
            AI-powered expense tracker accessible via WhatsApp and Telegram. By messaging our bot
            or otherwise using the Service, you agree to these Terms. If you don't agree, please
            don't use the Service.
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Description of Service</h2>
            <p>
              BroFInAi lets you log, categorize, and review personal expenses by sending messages
              (text or receipt photos) via WhatsApp or Telegram, using AI to interpret and organize
              the information into a real-time dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum age of consent in your country) to
              use the Service. By using the Service, you confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Your Account &amp; Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You're responsible for the accuracy of the information you send us.</li>
              <li>You must not use the Service for any unlawful purpose, to harass others, or to send harmful, abusive, or fraudulent content.</li>
              <li>You're responsible for keeping your WhatsApp or Telegram account secure, since anyone with access to it can access your expense data through the bot.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. AI-Generated Content &amp; Accuracy Disclaimer</h2>
            <p>
              The Service uses AI to read receipts and interpret your messages. AI-generated
              summaries, categorizations, and totals may occasionally be inaccurate or incomplete.
              You're responsible for reviewing your data for accuracy. The Service is not financial,
              tax, or investment advice and should not be relied upon as such.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Plans &amp; Billing</h2>
            <p>BroFInAi offers the following plans:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-white">Bro Lite — Free Forever ($0.00/month):</strong> 3 daily expense &amp; income logs, real-time web dashboard access, and 1 daily AI receipt OCR scan.</li>
              <li><strong className="text-white">Bro Core ($3.50/month):</strong> 10 daily expense &amp; income logs, real-time web dashboard access, 30 monthly AI receipt OCR scans, 5 daily voice note trackings, one-click Excel (.xlsx) export, and smart budget handling &amp; alerts.</li>
              <li><strong className="text-white">Bro Max ($6.99/month):</strong> unlimited daily expense &amp; income logs, real-time web dashboard access, unlimited monthly AI receipt OCR scans, unlimited voice note trackings, one-click Excel (.xlsx) export, and smart budget handling &amp; alerts.</li>
            </ul>
            <p className="mt-3">
              Pricing may vary slightly by messaging channel (WhatsApp vs. Telegram) due to
              differing operating costs; the price shown at checkout is the price that applies.
              Paid plans (Bro Core, Bro Max) are billed monthly on a recurring basis until
              cancelled. Payments are processed securely by our payment processor, Lemon Squeezy.
              You can upgrade, downgrade, or cancel your plan at any time from your dashboard;
              cancellation takes effect at the end of your current billing cycle. Fees are
              non‑refundable except where required by law or as described in our{" "}
              <Link href="/refund-policy" className="text-emerald-400 hover:underline">Refund Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Prohibited Uses</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Attempting to reverse-engineer, disrupt, or overload the Service</li>
              <li>Using automated systems (bots, scrapers) to interact with the Service beyond normal use</li>
              <li>Sending illegal, defamatory, or infringing content</li>
              <li>Using the Service to store data on someone else's behalf without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Intellectual Property</h2>
            <p>
              All rights, title, and interest in the Service — including its software, branding,
              and design — belong to BroFInAi. Your expense data remains yours; we don't claim
              ownership of it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              notice, if you violate these Terms or misuse the Service. You may stop using the
              Service at any time by no longer messaging the bot, and may request account or data
              deletion as described in our{" "}
              <Link href="/privacy-policy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. To the maximum extent
              permitted by law, BroFInAi will not be liable for any indirect, incidental, or
              consequential damages arising from your use of the Service, including errors in
              AI-generated expense data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Changes to the Service or Terms</h2>
            <p>
              We may modify or discontinue the Service, or update these Terms, at any time.
              Continued use of the Service after changes take effect means you accept the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Sri Lanka, without regard to conflict-of-law
              principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Contact Us</h2>
            <p>
              Questions about these Terms? Message the bot or email{" "}
              <a href="mailto:support@brofinai.com" className="text-emerald-400 hover:underline">support@brofinai.com</a>.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BroFInAi. All rights reserved. Bank-grade encryption on every message
        </div>
      </footer>
    </main>
  );
}