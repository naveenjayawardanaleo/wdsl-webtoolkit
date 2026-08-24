import Reveal from '../components/Reveal';

export default function AboutUs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">About Us</h1>

        <div className="mt-8 space-y-6 text-slate-700">
          <p>
            WDSL WebToolkit is built by <span className="font-semibold text-slate-900">WDSL (Web Design Sri Lanka)</span>{' '}
            &mdash;{' '}
            <a
              href="https://wdsl.lk"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline hover:text-brand-800"
            >
              wdsl.lk
            </a>{' '}
            &mdash; a software development company based in Ja-Ela, Sri Lanka, with over six years of experience
            building web design, full-stack, and custom software solutions, including platforms for the tourism
            sector. WDSL's approach is built around three principles: on-time delivery, high-quality service, and
            quality over quantity &mdash; refining fewer things properly rather than shipping a lot of shallow work.
          </p>
          <p>
            WDSL WebToolkit grew out of real, repeated experience on the client-facing side of that work: the gap
            between a technical accessibility report and what a non-technical client actually needs to hear, and the
            cost of accessibility tooling that's built for enterprise budgets rather than freelancers and small
            agencies. This product is WDSL's attempt to close that gap directly &mdash; a dual-role tool that gives
            developers the full technical picture and gives their clients a plain-language, business-focused version
            of the same findings, in one shared workspace.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">Known limitations</h2>
          <ul className="mt-3 space-y-3 text-amber-900">
            <li>
              Each scan currently analyses a single page, not a full-site crawl. Scanning multiple pages means
              submitting each URL separately.
            </li>
            <li>
              AI-generated suggestions depend on Google's Gemini API being available; if it's temporarily
              unreachable, the technical report (axe-core, Lighthouse, computer vision) still completes normally and
              suggestions are added once the AI call succeeds.
            </li>
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
