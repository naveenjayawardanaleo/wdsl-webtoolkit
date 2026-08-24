import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

const STEPS = [
  {
    title: 'Submit a URL',
    body: 'Paste any public website address and start a scan.',
  },
  {
    title: 'Automated scan runs',
    body: "Axe-core and Google Lighthouse check for WCAG 2.2 issues while a fine-tuned computer vision model reviews the page's visual and UX design.",
  },
  {
    title: 'AI turns findings into guidance',
    body: "Google's Gemini model rewrites the technical results into two versions: a developer-ready technical report and a plain-language, business-focused summary.",
  },
  {
    title: 'Collaborate in one place',
    body: 'Developers and clients discuss findings, track fixes, and close out issues together in the Collaboration Hub, when both are on the same project.',
  },
];

const FEATURES = [
  { title: 'Rule-based WCAG 2.2 scanning', body: 'Powered by axe-core and Google Lighthouse.' },
  { title: 'Computer vision UX analysis', body: 'A fine-tuned EfficientNet-B0 model reviews visual and UX design.' },
  {
    title: 'AI-generated suggestions for two audiences',
    body: "Technical and plain-language guidance, generated with Google's Gemini API.",
  },
  { title: 'Collaboration Hub', body: 'Shared comments, with open/closed issue tracking.' },
  {
    title: 'Works solo or together',
    body: 'A developer can scan and manage a project on their own, and a client can do the same — no counterpart account required.',
  },
  {
    title: 'Manually verified subscription activation',
    body: 'Premium access is reviewed and approved by a real person, not an automated charge.',
  },
];

function TechnicalList() {
  return (
    <ul className="space-y-3 text-slate-700">
      <li>Every axe-core violation with its WCAG success criterion</li>
      <li>An annotated screenshot showing exactly where each issue appears</li>
      <li>Lighthouse performance and best-practice scores</li>
      <li>The computer vision model's UX classification</li>
      <li>A status tracker for marking issues as in progress or resolved</li>
    </ul>
  );
}

function PlainLanguageList() {
  return (
    <ul className="space-y-3 text-slate-700">
      <li>The same findings rewritten in everyday language</li>
      <li>Each issue explained in terms of legal compliance risk</li>
      <li>SEO impact, spelled out in plain terms</li>
      <li>The effect on real users, without the jargon</li>
      <li>Technical detail left out entirely</li>
    </ul>
  );
}

export default function Landing() {
  const [tab, setTab] = useState('developer');

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Accessibility feedback developers act on, and clients actually understand.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            WDSL WebToolkit scans any website with automated accessibility testing and computer vision, then turns the
            results into a technical report for your developer and a plain-language action plan for your client, in
            one shared workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-brand-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
            >
              Start as a Developer
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-700"
            >
              Start as a Client
            </Link>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <Reveal key={step.title} delay={idx * 80}>
                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Dual-role explainer */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-slate-900">Two reports, one scan</h2>
          </Reveal>

          <Reveal delay={100}>
            <div
              role="tablist"
              aria-label="Report view by role"
              className="mx-auto mt-8 flex w-fit rounded-xl border border-slate-200 bg-white p-1"
            >
              {[
                { key: 'developer', label: 'Developer view' },
                { key: 'client', label: 'Client view' },
              ].map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-selected={tab === t.key}
                  aria-controls={`panel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-brand-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              {tab === 'developer' ? (
                <div role="tabpanel" id="panel-developer" aria-labelledby="tab-developer">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">The full technical report</h3>
                  <TechnicalList />
                </div>
              ) : (
                <div role="tabpanel" id="panel-client" aria-labelledby="tab-client">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">The plain-language report</h3>
                  <PlainLanguageList />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-slate-900">What you get</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, idx) => (
              <Reveal key={f.title} delay={idx * 60}>
                <div className="h-full rounded-2xl border border-slate-200 p-6 transition hover:border-brand-200 hover:shadow-sm">
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility line */}
      <section className="py-16">
        <Reveal className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-lg text-slate-600">
            Built for freelance developers, small agencies, and the clients they work with &mdash; a lightweight
            alternative to enterprise accessibility suites.
          </p>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="bg-ink-800 py-20">
        <Reveal className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to see your site's accessibility score?</h2>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-block rounded-xl bg-brand-500 px-8 py-3 font-semibold text-white transition hover:bg-brand-400"
            >
              Start free as a Developer
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
