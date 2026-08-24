import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ScanProgress, ScoreGauge, Spinner, ViolationCard, PlainSuggestionCard } from '../components/ReportWidgets';
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
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scans, setScans] = useState([]);
  const [rescanning, setRescanning] = useState(false);
  const [rescanError, setRescanError] = useState('');

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

  useEffect(() => {
    if (!report?.project?.project_id) return;
    apiFetch(`/projects/${report.project.project_id}/reports`, { token })
      .then(setScans)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.project?.project_id, reportId]);

  const updateViolationStatus = async (violationId, status) => {
    await apiFetch(`/violations/${violationId}/status`, { method: 'PATCH', body: { status }, token });
    load();
  };

  const canRescan =
    report?.project &&
    ((user?.role === 'developer' && report.project.developer_id === user.user_id) ||
      (user?.role === 'client' && report.project.client_id === user.user_id));

  const rescan = async () => {
    setRescanError('');
    setRescanning(true);
    try {
      const result = await apiFetch(`/reports/${reportId}/rescan`, { method: 'POST', token });
      navigate(`/reports/${result.report_id}`);
    } catch (err) {
      setRescanError(err.message || 'Rescan failed');
      setRescanning(false);
    }
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">
            {isTechnical ? 'Technical report' : 'Your accessibility report'}
          </h1>
          <p className="truncate text-slate-500">{report.url}</p>
        </div>

        {!rescanning && (
          <div className="flex flex-wrap items-center gap-3">
            {scans.length > 1 && (
              <>
                <label htmlFor="scan-picker" className="sr-only">
                  Previous scans
                </label>
                <select
                  id="scan-picker"
                  value={reportId}
                  onChange={(e) => navigate(`/reports/${e.target.value}`)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  {scans.map((s, idx) => (
                    <option key={s.report_id} value={s.report_id}>
                      {idx === 0 ? 'Latest — ' : ''}
                      {new Date(s.created_at).toLocaleString()} (score {s.accessibility_score})
                    </option>
                  ))}
                </select>
              </>
            )}
            {canRescan && (
              <button
                onClick={rescan}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Rescan
              </button>
            )}
          </div>
        )}
      </div>

      {rescanError && <p className="mb-6 text-sm text-red-600">{rescanError}</p>}

      {rescanning ? (
        <ScanProgress url={report.url} />
      ) : (
        <>
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
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
                    No violations detected.
                  </div>
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
        </>
      )}
    </div>
  );
}
