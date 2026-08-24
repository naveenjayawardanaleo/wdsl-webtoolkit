import Reveal from '../components/Reveal';

const SECTIONS = [
  {
    title: 'Acceptable use',
    body: "Only submit URLs for websites you own or have explicit permission to test. WDSL WebToolkit actively renders, screenshots, and analyses submitted pages, so scanning a site without authorisation may violate that site's own terms of use, and is not permitted through this service.",
  },
  {
    title: 'Accounts',
    body: 'You must provide accurate registration details and are responsible for activity on your account. One account per person.',
  },
  {
    title: 'Subscription terms',
    body: 'Client Premium is $15/month with a 2-month minimum commitment ($30 due at signup). Payment is made manually by PayPal or bank transfer (see the Payment page for details); there is no automatic recurring billing. Premium access is activated after your payment is manually verified, typically within 24 hours.',
  },
  {
    title: 'Liability',
    body: 'WDSL WebToolkit assists with accessibility review but does not guarantee compliance with WCAG, the ADA, the EAA, or any other law or standard. Findings should be reviewed and verified by a qualified professional where compliance is a legal requirement.',
  },
  {
    title: 'Termination',
    body: 'Accounts found scanning websites without authorisation, or otherwise misusing the service, may be suspended.',
  },
  {
    title: 'Governing law',
    body: 'These terms are governed by the laws of Sri Lanka.',
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-slate-900">Terms and Conditions</h1>
        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
