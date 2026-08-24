import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo className="h-8 w-auto" />
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Accessibility feedback developers act on, and clients actually understand.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end">
          <Link to="/about-us" className="hover:text-brand-700 hover:underline">
            About Us
          </Link>
          <Link to="/contact-us" className="hover:text-brand-700 hover:underline">
            Contact Us
          </Link>
          <Link to="/privacy-policy" className="hover:text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/cookie-policy" className="hover:text-brand-700 hover:underline">
            Cookie Policy
          </Link>
          <Link to="/terms" className="hover:text-brand-700 hover:underline">
            Terms &amp; Conditions
          </Link>
          <a href="mailto:info@wdsl.lk" className="hover:text-brand-700 hover:underline">
            info@wdsl.lk
          </a>
        </nav>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} WDSL WebToolkit. All rights reserved.</p>
        <p className="mt-1">
          A product by{' '}
          <a
            href="https://wdsl.lk"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            WDSL &mdash; wdsl.lk
          </a>
        </p>
      </div>
    </footer>
  );
}
