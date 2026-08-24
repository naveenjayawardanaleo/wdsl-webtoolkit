import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ScanProgress, Spinner } from '../components/ReportWidgets';

export default function ClientDashboard() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [developerEmail, setDeveloperEmail] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const refresh = async () => {
    setLoadingLists(true);
    const [p, r] = await Promise.all([apiFetch('/projects', { token }), apiFetch('/reports', { token })]);
    setProjects(p);
    setReports(r);
    setLoadingLists(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitScan = async (event) => {
    event.preventDefault();
    setError('');
    setScanning(true);
    setLastResult(null);
    try {
      const body = { url };
      if (projectId) {
        body.project_id = Number(projectId);
      } else {
        body.project_name = newProjectName;
        body.developer_email = developerEmail;
      }
      const result = await apiFetch('/analyze', { method: 'POST', body, token });
      setLastResult(result);
      setUrl('');
      setNewProjectName('');
      setDeveloperEmail('');
      await refresh();
    } catch (err) {
      setError(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Your reports</h1>
      <p className="mb-8 text-slate-500">
        {user?.subscription_status === 'active'
          ? 'Premium: plain-language AI suggestions are included with every scan.'
          : 'Free tier: submit a URL and get your accessibility score and screenshot. Upgrade to Client Premium for plain-language AI guidance.'}
      </p>

      {scanning ? (
        <div className="mb-10">
          <ScanProgress url={url} />
        </div>
      ) : (
      <form onSubmit={submitScan} className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Scan a website</h2>
        <label htmlFor="client-scan-url" className="sr-only">
          URL to scan
        </label>
        <input
          id="client-scan-url"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          required
        />
        <label htmlFor="client-scan-project" className="sr-only">
          Project
        </label>
        <select
          id="client-scan-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        >
          <option value="">+ Create a new project</option>
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.project_name}
            </option>
          ))}
        </select>
        {!projectId && (
          <div className="mb-1 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="client-scan-project-name" className="sr-only">
                New project name
              </label>
              <input
                id="client-scan-project-name"
                type="text"
                placeholder="New project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="client-scan-developer-email" className="sr-only">
                Developer&rsquo;s email (optional)
              </label>
              <input
                id="client-scan-developer-email"
                type="email"
                placeholder="Developer's email (optional — leave blank to work solo)"
                value={developerEmail}
                onChange={(e) => setDeveloperEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>
        )}
        {!projectId && (
          <p className="mb-3 mt-1 text-xs text-slate-500">
            Leave the developer email blank to manage this project solo. You can add a developer later.
          </p>
        )}
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Run scan
        </button>
      </form>
      )}

      {lastResult && !scanning && (
        <div className="mb-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          Scan complete &mdash; accessibility score {lastResult.accessibility_score}.{' '}
          <Link to={`/reports/${lastResult.report_id}`} className="font-semibold underline">
            View report
          </Link>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reports</h2>
      {loadingLists ? (
        <Spinner className="h-6 w-6 text-brand-500" />
      ) : reports.length === 0 ? (
        <p className="text-slate-500">No reports yet &mdash; scan a website above, or wait for your developer to run one for you.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.report_id}
              to={`/reports/${r.report_id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300"
            >
              <div>
                <p className="font-medium text-slate-900">{r.url}</p>
                <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <span className="text-lg font-bold text-slate-900">{r.accessibility_score}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
