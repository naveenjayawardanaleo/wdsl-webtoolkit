import Reveal from '../components/Reveal';

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
        <div className="prose-legal mt-8 space-y-6 text-slate-700">
          <p>
            WDSL WebToolkit collects the information needed to run the service: your account email and a securely
            hashed password, your selected role (developer, client, or admin), the URLs you submit for scanning,
            screenshots captured of those pages, the resulting reports and violation data, and any comments you post
            in the Collaboration Hub. If you pay for Client Premium, the payment slip you send us by email or
            WhatsApp is used only to verify your payment and is not stored in the application database.
          </p>
          <p>
            To generate plain-language and technical suggestions, WDSL WebToolkit sends the accessibility violations
            found by axe-core (not full screenshots, and not your personal account details) to Google's Gemini API.
            Page rendering, the axe-core and Lighthouse scans, and the computer vision model all run within WDSL
            WebToolkit's own backend and are not shared with any other third party.
          </p>
          <p>
            Your data is kept for as long as your account is active. You can request access to, correction of, or
            deletion of your data at any time by contacting{' '}
            <a href="mailto:premodya667@gmail.com" className="font-medium text-brand-700 hover:underline">
              premodya667@gmail.com
            </a>
            . See the{' '}
            <a href="/cookie-policy" className="font-medium text-brand-700 hover:underline">
              Cookie Policy
            </a>{' '}
            for details on the cookies this site uses.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
