import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-emerald-500" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Reveal>
        <h1 className="text-center text-4xl font-extrabold text-slate-900">Pricing</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600">
          Simple, honest pricing. Developers scan for free; clients can add plain-language AI guidance.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Reveal delay={80}>
          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Developer</h2>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">Free</p>
            <ul className="mt-6 flex-1 space-y-3 text-slate-700">
              {['Full technical reports', 'Unlimited projects', 'Violation status tracking', 'Works with or without a client attached'].map(
                (item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check />
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
            <Link
              to="/register"
              className="mt-8 rounded-xl border border-brand-600 px-6 py-3 text-center font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Start as a Developer
            </Link>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="flex h-full flex-col rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-md">
            <h2 className="text-xl font-bold text-slate-900">Client Premium</h2>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              $15<span className="text-base font-medium text-slate-500">/month</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">2-month minimum ($30 due at signup)</p>
            <ul className="mt-6 flex-1 space-y-3 text-slate-700">
              {[
                'Plain-language AI suggestions',
                'Business-impact framing (legal, SEO, user impact)',
                'Collaboration Hub access',
                'Works with or without a developer attached',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/payment"
              className="mt-8 rounded-xl bg-brand-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
            >
              Get Premium
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={220}>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-slate-500">
          Premium access is activated manually after payment is verified, usually within 24 hours.
        </p>
      </Reveal>
    </div>
  );
}
