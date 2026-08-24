import { Link } from 'react-router-dom';

/**
 * variant="full"  -> full lockup (icon + wordmark), used in navbar/footer/headers
 * variant="icon"  -> icon-only mark, used in tight spaces (mobile nav, spinners)
 */
export default function Logo({ variant = 'full', className = '', to = '/', linkClassName = '' }) {
  const img =
    variant === 'icon' ? (
      <img src="/favicon-256.png" alt="" className={className || 'h-9 w-9'} />
    ) : (
      <img src="/logo.png" alt="WDSL WebToolkit" className={className || 'h-9 w-auto'} />
    );

  if (!to) return img;

  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${linkClassName}`} aria-label="WDSL WebToolkit home">
      {img}
      {variant === 'icon' && <span className="sr-only">WDSL WebToolkit</span>}
    </Link>
  );
}
