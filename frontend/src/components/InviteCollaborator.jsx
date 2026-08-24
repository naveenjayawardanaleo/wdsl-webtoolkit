import { useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const MISSING_ROLE_LABEL = { developer: 'developer', client: 'client' };

/** Lets the solo owner of a project (developer or client) invite the missing counterpart by email. */
export default function InviteCollaborator({ project, onAdded }) {
  const { token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const isOwner =
    (user?.role === 'developer' && project.developer_id === user.user_id) ||
    (user?.role === 'client' && project.client_id === user.user_id);
  const missingRole = !project.developer_id ? 'developer' : !project.client_id ? 'client' : null;

  if (!isOwner || !missingRole) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await apiFetch(`/projects/${project.project_id}/collaborator`, { method: 'POST', body: { email }, token });
      setStatus('success');
      setEmail('');
      onAdded?.();
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Could not add collaborator');
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5">
      <h2 className="text-sm font-semibold text-brand-800">
        Working solo &mdash; invite a {MISSING_ROLE_LABEL[missingRole]}
      </h2>
      <p className="mt-1 text-sm text-brand-700">
        This project doesn't have a {MISSING_ROLE_LABEL[missingRole]} attached yet. Add one to unlock the
        Collaboration Hub.
      </p>
      {status === 'success' ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">Collaborator added.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="invite-email" className="sr-only">
            {MISSING_ROLE_LABEL[missingRole]}&rsquo;s email
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`${MISSING_ROLE_LABEL[missingRole]}'s email`}
            className="flex-1 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'loading' ? 'Adding…' : 'Invite'}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
