import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const ROLE_HOME = { developer: '/developer', client: '/client', admin: '/admin' };

const PUBLIC_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about-us', label: 'About Us' },
  { to: '/pricing', label: 'Pricing' },
];

function navLinkClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'text-brand-700' : 'text-slate-600 hover:text-brand-700'
  }`;
}

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo linkClassName="shrink-0" to={user ? ROLE_HOME[user.role] : '/'} className="h-8 w-auto sm:h-9" />

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {!user &&
            PUBLIC_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          {user && (
            <NavLink to={ROLE_HOME[user.role]} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="max-w-[16rem] truncate">
                {user.email} &middot; <span className="capitalize">{user.role}</span>
              </span>
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-slate-100 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {!user &&
              PUBLIC_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
            {user && (
              <NavLink to={ROLE_HOME[user.role]} className={navLinkClass} onClick={closeMenu}>
                Dashboard
              </NavLink>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <span className="px-3 text-sm text-slate-500 truncate">
                    {user.email} &middot; <span className="capitalize">{user.role}</span>
                  </span>
                  <button
                    onClick={() => {
                      closeMenu();
                      logout();
                      navigate('/login');
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
