# Frontend self-accessibility scan

WDSL WebToolkit audits other websites for WCAG 2.2 compliance, so its own frontend was
checked with the same engine it ships to users: **axe-core**, driven headlessly via
Playwright (`axe-playwright-python`), the same library `backend/wdsl/services/scanner.py`
uses for every user-submitted scan.

**Date:** 2026-08-24
**Pages scanned:** all 9 public/pre-login pages — `/`, `/how-it-works`, `/pricing`,
`/payment`, `/privacy-policy`, `/cookie-policy`, `/terms`, `/login`, `/register`
**Viewport:** 1280×900 (desktop)

## First pass — 9 violations found

Every page returned exactly one `color-contrast` (serious) violation, all traced to two
sitewide patterns that predated this frontend pass:

1. `text-slate-400` (`#90a1b9`) used for small eyebrow labels and timestamps —
   measured contrast **2.63:1** against white (WCAG AA requires 4.5:1 for normal-size text).
2. The WhatsApp button on `/payment` — white text on `bg-emerald-600` (`#009966`) —
   measured contrast **3.65:1**.

## Fix

- `text-slate-400` → `text-slate-500` (`#62748e`, **4.76:1**) everywhere it appeared
  (Footer, AdminPanel, DeveloperDashboard, ClientDashboard, ReportView, CommentThread, Payment).
- `bg-emerald-600` → `bg-emerald-700` (**5.76:1**) with `hover:bg-emerald-800` on the
  WhatsApp button.

## Second pass — 0 violations

```json
{
  "/": [],
  "/how-it-works": [],
  "/pricing": [],
  "/payment": [],
  "/privacy-policy": [],
  "/cookie-policy": [],
  "/terms": [],
  "/login": [],
  "/register": []
}
```

All 9 pages return zero axe-core violations after the fix. Authenticated-app pages
(dashboards, report view, admin panel) inherited the same `text-slate-500` fix but were
not re-scanned standalone since they require a logged-in session with seeded data.
