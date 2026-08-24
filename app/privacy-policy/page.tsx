import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — BroFInAi",
  description: "How BroFInAi collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: August 24, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-[15px] leading-relaxed">
          <p>
            BroFInAi ("we", "us", "our") provides an AI-powered expense tracking service accessible
            through WhatsApp and Telegram (the "Service"). This Privacy Policy explains what
            information we collect when you use the Service, how we use it, and the choices you
            have. By using the Service, you agree to the collection and use of information as
            described here.
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>To provide the Service, we collect:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>WhatsApp / Telegram account info: your phone number or Telegram username and profile name, received when you message the BroFInAi bot.</li>
              <li>Messages you send: text messages and receipt photos you send to the bot for logging expenses.</li>
              <li>Expense data: amounts, categories, dates, merchants, and notes extracted from your messages.</li>
              <li>Usage data: timestamps, command usage, and error logs, used to keep the Service running and to improve it.</li>
            </ul>
            <p className="mt-3">
              We do not intentionally collect sensitive information such as your national ID, bank
              account numbers, or passwords. Please avoid sending these to the bot.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use AI Processing</h2>
            <p>
              Messages and receipt photos you send may be processed by an AI model to auto-scan
              receipts and extract expense details — amount, category, and merchant. This happens
              automatically to power real-time expense logging and dashboard tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To record and organize your expenses</li>
              <li>To generate dashboards, summaries, and reports you request</li>
              <li>To send daily, weekly, or monthly summaries you've opted into</li>
              <li>To respond to your messages and provide customer support</li>
              <li>To detect, prevent, and fix technical issues or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>WhatsApp / Meta and Telegram: as the messaging platforms through which the Service operates, subject to their own terms and privacy policies.</li>
              <li>AI &amp; infrastructure providers: to process messages and host data, under contracts requiring them to protect your data.</li>
              <li>Payment processor (Lemon Squeezy): for handling subscription payments, if you upgrade to a paid plan.</li>
              <li>Legal authorities: if required by law, regulation, or valid legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on secure servers with reasonable technical and organizational
              safeguards. However, no method of transmission or storage is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your expense data for as long as your account is active, or as needed to
              provide the Service. You can request deletion at any time (see Section 7).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Export your expense data</li>
              <li>Request deletion of your data</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@brofinai.com" className="text-emerald-400 hover:underline">support@brofinai.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Payment Information</h2>
            <p>
              Subscription payments for Bro Core and Bro Max are processed by Lemon Squeezy, our
              payment processor and Merchant of Record. We do not store your card details — Lemon
              Squeezy handles payment processing, billing, and applicable tax collection directly.
              See our{" "}
              <Link href="/refund-policy" className="text-emerald-400 hover:underline">Refund Policy</Link>{" "}
              for details on refunds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 13 (or the minimum age required in your
              country). We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We'll notify you of material
              changes via the bot or by updating the "Last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
            <p>
              Questions about this Privacy Policy, or about your data? Message the bot or email{" "}
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