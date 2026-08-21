import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ReportWidgets';

export default function ClientDashboard() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/reports', { token })
      .then(setReports)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Your reports</h1>
      <p className="mb-8 text-slate-500">Plain-language accessibility results for your projects.</p>

      {loading ? (
        <Spinner className="h-6 w-6 text-sky-500" />
      ) : reports.length === 0 ? (
        <p className="text-slate-500">No reports yet. Your developer hasn't run a scan for you yet.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.report_id}
              to={`/reports/${r.report_id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <div>
                <p className="font-medium text-slate-900">{r.url}</p>
                <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <span className="text-lg font-bold text-slate-900">{r.accessibility_score}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
