import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ScoreGauge, Spinner, ViolationCard, PlainSuggestionCard } from '../components/ReportWidgets';
import AuthedImage from '../components/AuthedImage';
import CommentThread from '../components/CommentThread';
import InviteCollaborator from '../components/InviteCollaborator';

const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', completed: 'Completed' };

function ViolationStatusControl({ violation, onChange }) {
  return (
    <select
      value={violation.status}
      onChange={(e) => onChange(violation.violation_id, e.target.value)}
      className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
    >
      {Object.entries(STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default function ReportView() {
  const { reportId } = useParams();
  const { token, user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTechnical = user?.role === 'developer' || user?.role === 'admin';

  const load = () =>
    apiFetch(`/reports/${reportId}`, { token })
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const updateViolationStatus = async (violationId, status) => {
    await apiFetch(`/violations/${violationId}/status`, { method: 'PATCH', body: { status }, token });
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }
  if (error || !report) {
    return <p className="mx-auto mt-16 max-w-2xl px-4 text-red-600">{error || 'Report not found'}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">{isTechnical ? 'Technical report' : 'Your accessibility report'}</h1>
      <p className="mb-8 truncate text-slate-500">{report.url}</p>

      {report.project && <InviteCollaborator project={report.project} onAdded={load} />}

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Accessibility score</h2>
          <ScoreGauge score={report.accessibility_score} />
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Page type (CV model)</h2>
          <p className="text-2xl font-bold capitalize text-slate-900">{report.cv_prediction}</p>
          <p className="mt-1 text-slate-500">{report.cv_confidence}% confidence</p>
        </div>
        {isTechnical && report.lighthouse_result && !report.lighthouse_result.error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Lighthouse</h2>
            {Object.entries(report.lighthouse_result.categories || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm text-slate-600">
                <span className="capitalize">{key.replace('-', ' ')}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Screenshot</h2>
        <AuthedImage
          path={`/reports/${reportId}/screenshot${isTechnical ? '/annotated' : ''}`}
          alt={`Screenshot of ${report.url}`}
          className="w-full rounded-xl border border-slate-200"
        />
      </section>

      {isTechnical ? (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Violations ({report.violations?.length ?? 0})
            </h2>
            {(report.axe_violations || []).length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">No violations detected.</div>
            ) : (
              <div className="space-y-4">
                {report.axe_violations.map((v, idx) => {
                  const dbViolation = report.violations?.[idx];
                  return (
                    <ViolationCard
                      key={v.id + idx}
                      violation={v}
                      statusControl={
                        dbViolation && <ViolationStatusControl violation={dbViolation} onChange={updateViolationStatus} />
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Technical AI suggestions</h2>
            {(report.ai_suggestions_technical || []).length === 0 ? (
              <p className="text-slate-500">No AI suggestions on this report yet.</p>
            ) : (
              <div className="space-y-3">
                {report.ai_suggestions_technical.map((s) => (
                  <PlainSuggestionCard key={s.id} suggestion={s} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">What this means for your site</h2>
          {(report.ai_suggestions || []).length === 0 ? (
            <p className="text-slate-500">Your developer's account doesn't have AI suggestions enabled on this report.</p>
          ) : (
            <div className="space-y-3">
              {report.ai_suggestions.map((s) => (
                <PlainSuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {report.collaboration_enabled && <CommentThread reportId={reportId} />}
    </div>
  );
}
