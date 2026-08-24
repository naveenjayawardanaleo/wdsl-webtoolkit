import Reveal from '../components/Reveal';

export default function CookiePolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">Cookie Policy</h1>
        <div className="mt-8 space-y-6 text-slate-700">
          <p>WDSL WebToolkit uses a small number of cookies, and nothing beyond what's needed to run the service:</p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              An authentication/session cookie, so you stay logged in between page loads. This is required for the
              app to function.
            </li>
            <li>A cookie-consent preference, so the consent banner doesn't reappear once you've dismissed it.</li>
          </ul>
          <p>
            WDSL WebToolkit does not use advertising cookies, third-party tracking cookies, or analytics cookies.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
