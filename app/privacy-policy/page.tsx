import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — BroFInAi",
  description: "How BroFInAi collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-600">
      {/* Top nav — same sticky, green channel-colored bar used on the
          landing page (WhatsApp/emerald variant). Links point back to the
          landing page's own sections since this is a separate route. */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-emerald-500 via-emerald-800 to-emerald-950 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black text-white hidden sm:inline">
              Bro<span className="text-emerald-300">FInAi</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/80">
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" prefetch={false} className="hidden sm:inline text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition whitespace-nowrap">
              Login
            </Link>
            <a
              href="/#pricing"
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-white text-slate-900 hover:bg-white/90 transition shadow-lg flex items-center gap-1.5 overflow-hidden whitespace-nowrap cursor-pointer"
            >
              <span className="hidden sm:inline">Get Started</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 mb-3">Legal</div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: September 24, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-[15px] leading-relaxed">
          <p>
            BroFInAi ("we", "us", "our") provides an AI-powered expense tracking service accessible
            through WhatsApp and Telegram (the "Service"). This Privacy Policy explains what
            information we collect when you use the Service, how we use it, and the choices you
            have. By using the Service, you agree to the collection and use of information as
            described here.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
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
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use AI Processing</h2>
            <p>
              Messages and receipt photos you send may be processed by an AI model to auto-scan
              receipts and extract expense details — amount, category, and merchant. This happens
              automatically to power real-time expense logging and dashboard tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To record and organize your expenses</li>
              <li>To generate dashboards, summaries, and reports you request</li>
              <li>To send daily, weekly, or monthly summaries you've opted into</li>
              <li>To respond to your messages and provide customer support</li>
              <li>To detect, prevent, and fix technical issues or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>WhatsApp / Meta and Telegram: as the messaging platforms through which the Service operates, subject to their own terms and privacy policies.</li>
              <li>AI &amp; infrastructure providers: to process messages and host data, under contracts requiring them to protect your data.</li>
              <li>Payment processor (Lemon Squeezy): for handling subscription payments, if you upgrade to a paid plan.</li>
              <li>Legal authorities: if required by law, regulation, or valid legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on secure servers with reasonable technical and organizational
              safeguards. However, no method of transmission or storage is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your expense data for as long as your account is active, or as needed to
              provide the Service. You can request deletion at any time (see Section 7).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Your Rights &amp; Self-Service Tools</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Export your expense data</li>
              <li>Request deletion of your data</li>
            </ul>
            <p className="mt-3">
              You don't need to email us to exercise the export or deletion rights — they're
              self-service. Log in to your{" "}
              <Link href="/dashboard" className="text-emerald-600 hover:underline">dashboard</Link>{" "}
              → <strong>Settings → Privacy &amp; Data</strong> to instantly download a CSV of every
              transaction and account detail we hold, or to permanently delete your account
              (transactions, budgets, and bot connection included). Account deletion is irreversible
              and typically takes effect immediately.
            </p>
            <p className="mt-3">
              For anything else — correction requests, questions about what we hold, or if
              self-service isn't working for you — contact us at{" "}
              <a href="mailto:support@brofinai.com" className="text-emerald-600 hover:underline">support@brofinai.com</a>.
              We respond to verified requests within 30 days (or sooner where local law requires it).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7a. EEA / UK Users — Your GDPR Rights</h2>
            <p>
              If you're located in the European Economic Area or the UK, the General Data Protection
              Regulation (GDPR) / UK GDPR gives you additional, specific rights over your personal
              data, and requires us to tell you the legal basis we rely on to process it.
            </p>
            <p className="mt-3 font-semibold text-slate-800">Legal basis for processing:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Contract</strong> — processing your messages, receipts, and transaction data is necessary to provide the expense-tracking Service you signed up for.</li>
              <li><strong>Consent</strong> — for optional features you opt into, like daily/weekly/monthly summary messages, which you can withdraw at any time.</li>
              <li><strong>Legitimate interests</strong> — for fraud prevention, abuse detection, and improving the Service, balanced against your privacy interests.</li>
              <li><strong>Legal obligation</strong> — where we must retain or disclose information to comply with the law (e.g. tax records related to payments).</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-800">Your GDPR rights:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Right to access</strong> — a copy of the personal data we hold about you.</li>
              <li><strong>Right to rectification</strong> — correction of inaccurate or incomplete data.</li>
              <li><strong>Right to erasure</strong> ("right to be forgotten") — deletion of your data, self-service via the dashboard (Section 7 above).</li>
              <li><strong>Right to restrict processing</strong> — limit how we use your data in certain circumstances.</li>
              <li><strong>Right to data portability</strong> — receive your data in a portable format (CSV export, Section 7 above) or have it transferred to another provider where technically feasible.</li>
              <li><strong>Right to object</strong> — object to processing based on legitimate interests, including profiling.</li>
              <li><strong>Right to withdraw consent</strong> — at any time, without affecting the lawfulness of processing before withdrawal.</li>
              <li><strong>Right to lodge a complaint</strong> — with your local data protection supervisory authority if you believe we've mishandled your data.</li>
            </ul>
            <p className="mt-3">
              <strong>International transfers:</strong> our infrastructure and AI/hosting providers may
              process data outside the EEA/UK (e.g. the United States). Where that happens, we rely on
              appropriate safeguards such as Standard Contractual Clauses or an equivalent lawful
              transfer mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7b. California Residents — Your CCPA/CPRA Rights</h2>
            <p>
              If you're a California resident, the California Consumer Privacy Act (CCPA), as amended
              by the CPRA, gives you the following rights over your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Right to know</strong> — what categories of personal information we collect, use, and disclose, and for what purpose (see Sections 1–4 above).</li>
              <li><strong>Right to delete</strong> — request deletion of your personal information, self-service via the dashboard (Section 7 above).</li>
              <li><strong>Right to correct</strong> — request correction of inaccurate personal information.</li>
              <li><strong>Right to opt out of sale/sharing</strong> — we do not sell or share your personal information for cross-context behavioral advertising, so there's nothing to opt out of.</li>
              <li><strong>Right to limit use of sensitive personal information</strong> — we don't use your financial transaction data for anything beyond providing the Service itself.</li>
              <li><strong>Right to non-discrimination</strong> — we won't deny you the Service, charge you differently, or provide a lower quality of service for exercising any of these rights.</li>
            </ul>
            <p className="mt-3">
              To exercise any CCPA/CPRA right, use the dashboard self-service tools (Section 7) or
              email <a href="mailto:support@brofinai.com" className="text-emerald-600 hover:underline">support@brofinai.com</a> —
              we'll verify your identity via your registered phone/email before acting on the request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Payment Information</h2>
            <p>
              Subscription payments for Bro Core and Bro Max are processed by Lemon Squeezy, our
              payment processor and Merchant of Record. We do not store your card details — Lemon
              Squeezy handles payment processing, billing, and applicable tax collection directly.
              See our{" "}
              <Link href="/refund-policy" className="text-emerald-600 hover:underline">Refund Policy</Link>{" "}
              for details on refunds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 13 (or the minimum age required in your
              country). We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We'll notify you of material
              changes via the bot or by updating the "Last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contact Us</h2>
            <p>
              Questions about this Privacy Policy, or about your data? Message the bot or email{" "}
              <a href="mailto:support@brofinai.com" className="text-emerald-600 hover:underline">support@brofinai.com</a>.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BroFInAi. All rights reserved. Bank-grade encryption on every message
        </div>
      </footer>
    </main>
  );
}