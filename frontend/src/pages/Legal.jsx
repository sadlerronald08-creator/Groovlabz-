export default function Legal({ kind = "privacy" }) {
  const isPrivacy = kind === "privacy";
  return (
    <div className="pt-24 pb-16" data-testid={`legal-${kind}-page`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-invert">
        <p className="mono-label mb-3">Legal</p>
        <h1 className="display text-4xl sm:text-5xl font-black mb-6">
          {isPrivacy ? "Privacy Policy" : "Terms of Service"}
        </h1>
        <p className="text-slate-400 text-sm mb-8 mono">
          Last updated: February 2026
        </p>
        <div className="space-y-6 text-slate-300 leading-relaxed">
          {isPrivacy ? (
            <>
              <p>
                GroovLabz respects your privacy. We collect only the minimum
                information required to deliver your music apps, hardware, and
                account activity. We never sell your data to third parties.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                What we collect
              </h2>
              <p>
                Email, name, purchase history, and app usage telemetry (only
                when you're signed in). Everything else stays on your device.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                Cookies
              </h2>
              <p>
                We use a single secure httpOnly cookie to keep you signed in.
                No advertising cookies, no third-party tracking.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                Contact
              </h2>
              <p>
                Questions? Email{" "}
                <a
                  href="mailto:privacy@groovlabz.com"
                  className="text-cyan-300"
                >
                  privacy@groovlabz.com
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p>
                By using GroovLabz apps, hardware, or this website, you agree
                to these terms. TL;DR — be excellent to each other, don't hack
                us, and please don't resell the hardware without permission.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                Accounts
              </h2>
              <p>
                You're responsible for keeping your password safe. Notify us if
                someone else accesses your account.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                Purchases
              </h2>
              <p>
                Hardware purchases include a 30-day return window and a 1-year
                warranty against manufacturing defects.
              </p>
              <h2 className="display text-2xl font-bold text-slate-100 mt-8">
                Content ownership
              </h2>
              <p>
                Music you create using our apps belongs to you. Always. We
                claim zero rights over your creations.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
