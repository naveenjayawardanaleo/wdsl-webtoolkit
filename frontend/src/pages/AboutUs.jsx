import Reveal from '../components/Reveal';

const VALUES = [
  {
    title: 'On-time delivery',
    body: 'We commit to realistic timelines and keep them, for our clients and for our own products.',
  },
  {
    title: 'High-quality service',
    body: "Every engagement gets the same standard of care, whether it's a client project or a tool we build ourselves.",
  },
  {
    title: 'Quality over quantity',
    body: 'We refine fewer things properly rather than shipping a lot of shallow work.',
  },
  {
    title: 'Accessibility by default',
    body: "A tool that audits other websites for accessibility should visibly practice what it preaches in its own interface — so we hold WDSL WebToolkit to that standard too.",
  },
];

export default function AboutUs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">About Us</h1>
        <a
          href="https://wdsl.lk"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          A product of WDSL (Web Design Sri Lanka) &mdash; wdsl.lk
        </a>

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
            sector.
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

      <Reveal delay={80}>
        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Our Vision</h2>
            <p className="mt-2 text-slate-700">
              A web where accessibility is part of how a site gets built, not an afterthought bolted on after a
              client or regulator complains &mdash; and where checking for it doesn't require an enterprise budget.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Our Mission</h2>
            <p className="mt-2 text-slate-700">
              To give developers and their clients one shared, honest picture of a website's accessibility &mdash;
              technical enough for a developer to act on, plain enough for a client to actually understand.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Our Values</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
