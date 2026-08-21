import { useState } from 'react';

const API_URL = 'http://localhost:5000/api/analyze';

const IMPACT_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  serious: 'bg-orange-100 text-orange-700 border-orange-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  minor: 'bg-slate-100 text-slate-700 border-slate-200',
};

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
}

function scoreRingColor(score) {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 50) return 'stroke-orange-500';
  return 'stroke-red-500';
}

function ScoreGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-slate-100"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ease-out ${scoreRingColor(score)}`}
        />
      </svg>
      <div className={`absolute text-4xl font-bold ${scoreColor(score)}`}>{score}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function ViolationCard({ violation }) {
  const impactClass = IMPACT_STYLES[violation.impact] || IMPACT_STYLES.minor;
  const fix = violation.affected_elements?.[0]?.fix_summary;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{violation.help}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${impactClass}`}
        >
          {violation.impact || 'unknown'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{violation.description}</p>
      {fix && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">How to fix: </span>
          <span className="whitespace-pre-line">{fix}</span>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{violation.node_count} element{violation.node_count === 1 ? '' : 's'} affected</span>
        {violation.help_url && (
          <a
            href={violation.help_url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async (event) => {
    event.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL to analyze.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Analysis request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing this URL.');
    } finally {
      setLoading(false);
    }
  };

  const violations = result?.axe_results?.violations || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            WDSL WebToolkit
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            AI-powered accessibility &amp; UX analysis for any website
          </p>
        </header>

        <form
          onSubmit={analyze}
          className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner />}
            {loading ? 'Analyzing…' : 'Run Analysis'}
          </button>
        </form>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3 text-slate-500">
            <svg className="h-10 w-10 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p>Capturing screenshot, scanning accessibility, and classifying the page…</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-10 space-y-8">
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Accessibility Score
                </h2>
                <ScoreGauge score={result.accessibility_score} />
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Page Type (CV Model)
                </h2>
                <p className="text-2xl font-bold capitalize text-slate-900">
                  {result.cv_prediction.class}
                </p>
                <p className="mt-1 text-slate-500">
                  {result.cv_prediction.confidence}% confidence
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${result.cv_prediction.confidence}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Scan Summary
                </h2>
                <p className="text-slate-600">
                  <span className="text-2xl font-bold text-slate-900">
                    {result.axe_results.violations_count}
                  </span>{' '}
                  violation{result.axe_results.violations_count === 1 ? '' : 's'} found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {result.axe_results.passes_count} checks passed
                </p>
                <p className="mt-3 truncate text-xs text-slate-400" title={result.url}>
                  {result.url}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Screenshot
              </h2>
              <img
                src={result.screenshot}
                alt={`Screenshot of ${result.url}`}
                className="w-full rounded-xl border border-slate-200"
              />
            </section>

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Accessibility Violations
              </h2>
              {violations.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
                  No accessibility violations detected. Great job!
                </div>
              ) : (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <ViolationCard key={violation.id} violation={violation} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
