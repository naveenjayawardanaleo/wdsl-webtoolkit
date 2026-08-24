import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';
import { Spinner } from '../components/ReportWidgets';

const API_BASE = 'http://localhost:5000/api';
const WHATSAPP_MESSAGE = "Hi, I've paid $30 for 2 months of WDSL WebToolkit premium access. Attaching my payment slip.";
const WHATSAPP_URL = `https://wa.me/94722222586?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function Payment() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a payment slip (image or PDF) to upload.');
      return;
    }

    setStatus('loading');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('slip', file);

      const response = await fetch(`${API_BASE}/payment/slip`, { method: 'POST', body: formData });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;
      if (!response.ok) throw new Error(data?.error || `Upload failed (${response.status})`);

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Upload failed. Please try again or send your slip by WhatsApp instead.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">Activate Premium Access</h1>
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="font-semibold text-brand-800">Client Premium &mdash; $15/month, 2-month minimum</p>
          <p className="text-brand-700">$30 due now</p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Pay by PayPal</h2>
          <p className="mt-2 text-slate-700">
            Send $30 via PayPal to <span className="font-semibold">premodya667@gmail.com</span>. Include your account
            email as the payment note so it can be matched to your account.
          </p>
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Pay by Bank Transfer</h2>
          <dl className="mt-3 space-y-2">
            <InfoRow label="Account Name" value="WDSL" />
            <InfoRow label="Account Number" value="111000300884" />
            <InfoRow label="Bank" value="NDB Bank, Kandana Branch" />
          </dl>
          <p className="mt-3 text-sm text-slate-600">Include your account email as the transfer reference.</p>
        </section>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Coming soon
          </span>
          <span>Online payment via OnePay</span>
        </div>
      </Reveal>

      <Reveal delay={260}>
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">After you've paid</h2>
          <p className="mt-2 text-slate-700">Send your payment slip so it can be verified and your account activated:</p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Send via WhatsApp &mdash; +94 72 222 2586
          </a>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            Or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {status === 'success' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              Thanks &mdash; your payment slip has been sent for verification. We'll activate Premium access within 24
              hours.
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label htmlFor="payment-email" className="mb-1 block text-sm font-medium text-slate-700">
                Account email
              </label>
              <input
                id="payment-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />

              <label htmlFor="payment-slip" className="mb-1 block text-sm font-medium text-slate-700">
                Payment slip (image or PDF)
              </label>
              <input
                id="payment-slip"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />

              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {status === 'loading' && <Spinner />}
                {status === 'loading' ? 'Sending…' : 'Upload payment slip'}
              </button>
            </form>
          )}
        </section>
      </Reveal>

      <Reveal delay={320}>
        <p className="mt-8 text-center text-sm text-slate-500">
          We'll activate Premium access within 24 hours of verifying your payment. No card details are collected on
          this page.
        </p>
      </Reveal>
    </div>
  );
}
