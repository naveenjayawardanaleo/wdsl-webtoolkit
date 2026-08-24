import { useEffect, useRef, useState } from 'react';

const MAX_DELAY_MS = 100; // keeps delay+animation well under "a fraction of a second" total

/** Fades/slides a section in once it scrolls into view. No-op until then; content is always in the DOM.
 *  Deliberately brief (see index.css) so a manually-taken screenshot can never land mid-reveal. */
export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cappedDelay = Math.min(delay, MAX_DELAY_MS);

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}
      style={visible ? { animationDelay: `${cappedDelay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
