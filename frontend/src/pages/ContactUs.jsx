import { useState } from 'react';
import Reveal from '../components/Reveal';
import { Spinner } from '../components/ReportWidgets';

const API_BASE = 'http://localhost:5000/api';

function InfoRow({ label, value, href }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">
        {href ? (
          <a href={href} className="hover:text-brand-700 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;
      if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Could not send your message. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">Contact Us</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Questions about WDSL WebToolkit or WDSL's other work? Reach out and we'll get back to you.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-5">
        <Reveal delay={80} className="md:col-span-2">
          <dl className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <InfoRow label="Email" value="info@wdsl.lk" href="mailto:info@wdsl.lk" />
            <InfoRow label="Phone / WhatsApp" value="+94 72 2222 586" href="tel:+94722222586" />
            <InfoRow label="Location" value="346, Weligampitiya, Ja-Ela, Sri Lanka" />
          </dl>
        </Reveal>
        

        <Reveal delay={140} className="md:col-span-3">
          {status === 'success' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
              Thanks for reaching out &mdash; we'll get back to you shortly.
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={update('subject')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={update('message')}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
              >
                {status === 'loading' && <Spinner />}
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}
