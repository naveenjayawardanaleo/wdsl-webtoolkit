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

export function ScoreGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((score ?? 0) / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ease-out ${scoreRingColor(score ?? 0)}`}
        />
      </svg>
      <div className={`absolute text-4xl font-bold ${scoreColor(score ?? 0)}`}>{score ?? '-'}</div>
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5 text-white' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function ViolationCard({ violation, statusControl }) {
  const impactClass = IMPACT_STYLES[violation.impact] || IMPACT_STYLES.minor;
  const fix = violation.affected_elements?.[0]?.fix_summary;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{violation.help}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${impactClass}`}>
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
          <a href={violation.help_url} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Learn more
          </a>
        )}
      </div>
      {statusControl}
    </div>
  );
}

export function PlainSuggestionCard({ suggestion }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-slate-700">{suggestion.message}</p>
    </div>
  );
}
