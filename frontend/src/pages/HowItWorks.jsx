import Reveal from '../components/Reveal';

const DEVELOPER_STEPS = [
  'Register and choose the Developer role.',
  "Create a project and submit the URL you want to review. Add a client to the project if you're working with one, or leave it solo and manage it yourself.",
  "Read the technical report: violations grouped by WCAG success criterion, an annotated screenshot showing where each issue sits on the page, Lighthouse scores, and the computer vision model's UX read on the page.",
  "Update each violation's status as you fix it (to do, in progress, completed) so progress is visible to anyone else on the project.",
  'Use the Collaboration Hub to discuss specific findings with a client, if one is attached to the project.',
];

const CLIENT_STEPS = [
  'Register and choose the Client role.',
  'Create a project and submit a URL yourself, or wait for a developer to add you to theirs — either way works.',
  'Read the plain-language report: each issue explained in terms of legal risk, SEO impact, and user impact, without technical jargon.',
  'Open a comment on any finding you want addressed, and close it once you\'re satisfied.',
];

const ADMIN_STEPS = [
  'Review new user registrations and manage accounts from the Admin panel.',
  "Review payment slips sent by email or WhatsApp against the Client Premium plan, then grant or revoke a client's subscription from the Admin panel.",
  'Check the usage overview for a snapshot of total projects, reports, and users.',
];

function StepList({ steps }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {idx + 1}
          </span>
          <p className="pt-1 text-slate-700">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Reveal>
        <h1 className="text-center text-4xl font-extrabold text-slate-900">How to Use WDSL WebToolkit</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-600">
          WDSL WebToolkit works the same way whether you're a developer, a client, or both.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">For Developers</h2>
          <StepList steps={DEVELOPER_STEPS} />
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">For Clients</h2>
          <StepList steps={CLIENT_STEPS} />
        </section>
      </Reveal>

      <Reveal delay={200}>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">For Admins</h2>
          <StepList steps={ADMIN_STEPS} />
        </section>
      </Reveal>
    </div>
  );
}
