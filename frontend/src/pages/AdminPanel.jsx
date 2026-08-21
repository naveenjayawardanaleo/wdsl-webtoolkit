import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ReportWidgets';

export default function AdminPanel() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () =>
    Promise.all([apiFetch('/admin/users', { token }), apiFetch('/admin/overview', { token })]).then(([u, o]) => {
      setUsers(u);
      setOverview(o);
    });

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSubscription = async (userId, currentStatus) => {
    setError('');
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await apiFetch(`/admin/users/${userId}/subscription`, { method: 'PATCH', body: { status: nextStatus }, token });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-sky-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Admin panel</h1>

      {overview && (
        <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Object.entries(overview).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </section>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Users</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.subscription_status || 'n/a'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleSubscription(u.user_id, u.subscription_status)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {u.subscription_status === 'active' ? 'Revoke' : 'Grant'} subscription
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
