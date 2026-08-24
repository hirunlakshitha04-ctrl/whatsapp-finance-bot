import Link from "next/link";

export const metadata = {
  title: "Refund Policy — BroFInAi",
  description: "BroFInAi's refund policy for Bro Core and Bro Max subscriptions.",
};

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: August 24, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-[15px] leading-relaxed">
          <p>
            This Refund Policy explains how refunds work for BroFInAi's paid subscription plans
            (Bro Core and Bro Max), purchased and billed through our payment processor, Lemon
            Squeezy. It should be read together with our{" "}
            <Link href="/terms-of-service" className="text-emerald-400 hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Free Plan &amp; Free Trials</h2>
            <p>
              Bro Lite is free to use with no payment required. Where a free trial is offered on a
              paid plan (for example, a 7‑day trial on WhatsApp), you will not be charged during the
              trial period. If you do not cancel before the trial ends, your subscription
              automatically converts to a paid plan and billing begins — no refunds are issued
              simply for forgetting to cancel a trial, but you can cancel at any time going forward
              to stop future charges.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. General Refund Policy</h2>
            <p>
              Subscription fees for Bro Core and Bro Max are billed in advance on a recurring
              monthly basis. Because you have access to the full plan for the billing period you've
              paid for, <strong className="text-white">fees are generally non‑refundable</strong>,
              including for partial months, unused features, or early cancellation. This mirrors
              standard practice for digital subscription services and is stated in our Terms of
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Exceptions — When We Do Refund</h2>
            <p>We will review refund requests made in good faith on a case‑by‑case basis, and may issue a full or partial refund where:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You were charged due to a billing error or duplicate charge on our end.</li>
              <li>A technical fault with the Service prevented you from using core features for a significant part of your billing period, and our support team was unable to resolve it.</li>
              <li>You were charged after a cancellation request that we failed to process correctly.</li>
              <li>Refund is required under applicable consumer protection law in your country.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. How to Request a Refund</h2>
            <p>To request a refund, contact us within 14 days of the charge with your registered WhatsApp number or Telegram username and the reason for your request:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Email: <a href="mailto:support@brofinai.com" className="text-emerald-400 hover:underline">support@brofinai.com</a></li>
              <li>WhatsApp Support: <a href="https://wa.me/94729367157" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">+94 729 367 157</a></li>
              <li>Telegram Support: <a href="https://t.me/BroFinAi_support" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">@BroFInAi_Support</a></li>
            </ul>
            <p className="mt-3">
              We aim to review and respond to every refund request within 5 business days. Approved
              refunds are issued to your original payment method via Lemon Squeezy and may take
              5–10 business days to appear, depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Cancelling Your Subscription</h2>
            <p>
              You can cancel Bro Core or Bro Max at any time from your dashboard or by asking the
              bot to cancel your plan. Cancellation stops future billing but does not itself trigger
              a refund — you'll keep access to your paid plan until the end of the billing period
              you've already paid for, then your account moves to Bro Lite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Chargebacks</h2>
            <p>
              If you believe you were charged in error, please contact us first so we can resolve
              it directly — this is faster than a chargeback. Filing a chargeback without contacting
              us first may result in your account being suspended while the dispute is investigated
              by Lemon Squeezy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Refund Policy from time to time. Material changes will be reflected
              by updating the "Last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Contact Us</h2>
            <p>
              Questions about this Refund Policy? Reach us at{" "}
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