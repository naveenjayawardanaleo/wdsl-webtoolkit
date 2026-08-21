import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = { developer: '/developer', client: '/client', admin: '/admin' };

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to={user ? ROLE_HOME[user.role] : '/'} className="text-lg font-bold text-slate-900">
          WDSL WebToolkit
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{user.email} &middot; <span className="capitalize">{user.role}</span></span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
