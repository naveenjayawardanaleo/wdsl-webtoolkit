# WDSL WebToolkit — Build-out prompt for Claude Code

Paste everything below into Claude Code, run from the root of the WDSL WebToolkit repository.

---

## Context

WDSL WebToolkit is a dual-role (developer / client / admin) web accessibility and UX analyzer. Stack: React.js + Tailwind CSS frontend (port 5173), Flask backend (port 5000), MySQL, Playwright for page rendering, axe-core for WCAG 2.2 scanning, a fine-tuned EfficientNet-B0 model for visual/UX classification, and JWT for authentication.

Current real state of the repo, verified against the code (not the pitch deck):

- `backend/app.py` calls axe-core via `axe-playwright-python`. No Lighthouse call exists anywhere.
- The EfficientNet-B0 model (`AImodels/wdsl_cv_finetuned.pth`) is trained and runs, classifying screenshots into 4 categories. Validation accuracy during fine-tuning reached about 83 to 84%, but a held-out inference test (200 screenshots, 50 per class) only scored 68%. That gap needs investigating, not just accepting.
- There is no LLM or AI-text generation call anywhere. Violations are returned to the frontend as raw axe JSON only.
- There is no collaboration workspace, no multi-user comment system, and only partial auth exists.
- No test files exist anywhere in the repo.
- No dataset folder remains to verify size or label balance for the CV model.

The system design for this project (ER diagram, Use Case diagram, Class diagram, Activity diagram, Sequence diagram) has already been finalized for the dissertation and must be treated as the spec to build against, not redesigned. The schema and flows below are taken directly from that finalized design. Do not invent new entities, rename fields, or change relationships without flagging it first, since the written dissertation chapters already describe this exact structure and any drift between the code and the documented design is a real problem, not a cosmetic one.

---

## Target database schema

Implement (or migrate the current schema to) exactly this, adding real foreign key columns even though the ER diagram itself represents them as relationship diamonds rather than attributes:

```
USERS
  user_id            PK
  email
  password_hash
  role               ENUM('developer','client','admin')
  created_at

SUBSCRIPTIONS
  subscription_id    PK
  user_id            FK -> USERS.user_id (1:1)
  status             ENUM('active','inactive')
  granted_at

PROJECTS
  project_id         PK
  project_name
  developer_id       FK -> USERS.user_id
  client_id          FK -> USERS.user_id
  created_at

REPORTS
  report_id          PK
  project_id         FK -> PROJECTS.project_id
  url
  screenshot_path
  annotated_screenshot_path   -- new, see Task 2
  accessibility_score
  cv_prediction
  cv_confidence
  axe_violations     JSON
  lighthouse_result  JSON     -- new, see Task 4
  ai_suggestions     JSON
  created_at

VIOLATIONS
  violation_id       PK
  report_id          FK -> REPORTS.report_id
  axe_id
  impact             ENUM('minor','moderate','serious','critical')
  description
  help_url
  target_selector    -- new, needed for Task 2 (bounding box lookup)
  status             ENUM('todo','in_progress','completed')

COMMENTS
  comment_id         PK
  report_id          FK -> REPORTS.report_id
  user_id            FK -> USERS.user_id (author)
  parent_comment_id  FK -> COMMENTS.comment_id, nullable (self-referencing, for replies)
  comment_text
  status             ENUM('open','closed')
  created_at
```

Subscriptions are never purchased online. Only an admin can flip a user's subscription between active and inactive from the admin panel. Do not build a payment flow.

---

## Priority-ordered build tasks

### Task 1: AI Suggestion Generator (highest priority)

Wire up the Gemini API so the existing `/api/analyze` flow (or equivalent) sends the axe-core violations (not the CV output, that stays separate) to Gemini after a scan completes, and generates two versions from the same findings:

- A technical version for the developer role: keeps terminology like selectors and WCAG success criteria, oriented at someone who will fix the code.
- A plain-language version for the client role: rewrites each violation as something a non-technical stakeholder can understand, avoiding jargon. This is the single most-quoted line in the project's own pitch script, so it needs to actually work, not just exist as a stub.

Store both versions in `reports.ai_suggestions` as JSON (e.g. `{"technical": [...], "plain_language": [...]}`), and serve the correct one based on the requesting user's role. Handle the Gemini API failing or timing out gracefully (store a fallback message, do not crash the analyze request).

### Task 2: Highlighted/annotated screenshots

axe-core already returns a `target` CSS selector per violation. At scan time, while Playwright still has the page open, use `page.locator(selector).bounding_box()` to get pixel coordinates for each violation and store them (`violations.target_selector`, plus the coordinates either alongside it or recomputed at render time). Generate an annotated copy of the captured screenshot with bounding boxes or numbered markers drawn over each violation's location (Pillow is fine for this), save it to `reports.annotated_screenshot_path`, and show it in the developer's technical report view. The client's plain-language view does not need the annotated image.

### Task 3: Collaboration Hub

Implement the `COMMENTS` table above and the three actions it needs to support:

- Client opens a comment on a report (`status = 'open'`, `parent_comment_id = NULL`).
- Developer replies to an open comment (`parent_comment_id` set to the original comment's id).
- Client closes the thread once satisfied (`status = 'closed'`).

Enforce these actions by role at the API layer (a developer cannot open a new top-level comment, a client cannot post a developer-style reply, only the client who owns the thread or an admin can close it). Build the corresponding frontend thread UI attached to the report view: show open threads distinctly from closed ones, and render replies nested under their parent.

### Task 4: Lighthouse integration

Add a Google Lighthouse scan alongside the existing axe-core scan for the same rendered page, and store the result in `reports.lighthouse_result`. This completes objective 1 from the original proposal ("axe-core + Google Lighthouse"), which right now only has axe-core wired in. Surface Lighthouse's performance/best-practices scores somewhere sensible in the developer's technical report view; they do not need to feed into the AI suggestion generator for now, just be visible and stored.

### Task 5: Auth, roles, subscriptions, and the missing pages

Some of this may partially exist; audit first, then fill gaps rather than assuming a rebuild is needed.

- JWT-based auth carrying the user's role (`developer`, `client`, or `admin`) on every request.
- Registration flow that lets a new user register as either a developer or a client (admin accounts are seeded/created by an existing admin, not self-registered).
- Admin panel: list users, grant or revoke a user's subscription (toggle `subscriptions.status`), and a basic system usage overview (counts of projects/reports/users is enough).
- Middleware that gates subscription-only features behind an active subscription check.

Build (or finish) these frontend pages, all in React + Tailwind, matching the roles and flows already fixed in the Use Case/Class/Sequence diagrams:

1. Login
2. Register
3. Developer dashboard (list of projects/reports)
4. Client dashboard (list of their projects/reports)
5. Technical report view (raw axe violations, Lighthouse scores, CV prediction and confidence, annotated screenshot, technical AI suggestions, violation status control)
6. Plain-language report view (client-facing AI suggestions only, no raw technical data)
7. Collaboration Hub thread view (attached to a report)
8. Admin panel (user list, subscription toggle, usage overview)

### Task 6: Testing and documentation

Nothing exists yet for this phase, and it is due now per the project's own timeline. Build a backend test suite (pytest is fine) covering at minimum this test plan, grouped exactly as listed, so the results can be dropped directly into the dissertation's Testing chapter:

```
TC 1  Authentication & Registration
  1.1 Validate email format on registration
  1.2 Validate password requirements
  1.3 Prevent duplicate account registration
  1.4 Login with valid credentials routes to the correct role-based dashboard
  1.5 Login with invalid credentials shows an error

TC 2  URL Submission & Scanning Pipeline
  2.1 Validate submitted URL format
  2.2 Reject an unreachable URL
  2.3 Confirm the frontend-to-backend analyze request succeeds
  2.4 Confirm Playwright renders the page and captures a screenshot
  2.5 Confirm axe-core returns a violations list

TC 3  Computer Vision Model
  3.1 Confirm the screenshot is passed to the CV model
  3.2 Confirm the CV model returns a prediction and confidence score

TC 4  AI Suggestion Generation
  4.1 Confirm the Gemini API call succeeds
  4.2 Confirm technical and plain-language suggestions differ by role

TC 5  Report Viewing & Role-Based Access
  5.1 Developer sees the full technical report
  5.2 Client sees only the plain-language report
  5.3 Developer can update a violation's status

TC 6  Collaboration Hub
  6.1 Client can open a comment
  6.2 Developer can reply
  6.3 Client can close a thread

TC 7  Subscriptions
  7.1 Admin can grant a subscription
  7.2 Admin can revoke a subscription
  7.3 A user without an active subscription is denied a restricted feature
```

Do not force every test to pass silently. If something genuinely fails on first run, fix it and keep a note of what broke and how it was fixed. One honest fail-then-fix cycle in the write-up is worth more than a suspiciously perfect 100% pass record.

Also write or update a `README.md` covering setup, environment variables (Gemini API key, DB connection, JWT secret), and how to run the backend, frontend, and test suite.

### Task 7: Investigate the CV model's validation-vs-inference gap

Fine-tuning validation accuracy reached about 83 to 84%, but a separate held-out inference test (200 screenshots, 50 per class) only scored 68%, with tourism the strongest class (38/50 correct) and machinery the weakest (9 of 50 misclassified as sport). Before this gets presented as a finished, working deliverable, check for the usual causes: overlap between train/validation splits, inconsistent preprocessing or augmentation between training and inference, class imbalance, or the held-out test set being drawn from a meaningfully different distribution than the training data. Write up what you find in a short markdown note (a few paragraphs is enough) so it can go into the dissertation's Model Evaluation section honestly, whether the answer is "here's the bug and the fix" or "here's why the gap is expected and how large a gap is acceptable to disclose."

---

## Final step: seed demo data and capture screenshots

Once the pages above exist and the pipeline runs end to end, seed the database with realistic demo data: one developer account, one client account, one admin account, and at least one project with a completed report (so pages are not shown empty). Then write a small Playwright script (`capture_screenshots.py` or similar) that logs in as each role in turn and screenshots every page in Task 5's list, saving them into a `screenshots/` folder with filenames that match these dissertation figure captions:

```
fig_6_1_registration_page.png
fig_6_2_login_page.png
fig_6_3_developer_dashboard.png
fig_6_4_technical_report_view.png
fig_6_5_client_dashboard.png
fig_6_6_plain_language_report_view.png
fig_6_7_url_submission_form.png
fig_6_9_cv_model_output.png
fig_6_10_ai_suggestion_output.png
fig_6_11_comment_thread_open.png
fig_6_12_comment_thread_closed.png
fig_6_13_admin_subscription_management.png
```

These correspond directly to the screenshot placeholders already sitting in the dissertation's Implementation chapter, so once this script runs, the screenshots can be dropped straight into the document without renaming anything.

---

## Working notes

- Build in the priority order above; do not skip ahead to testing before the AI Suggestion Generator and Collaboration Hub exist, since those are the two most-quoted features in the project's own pitch and currently sit at 0%.
- Flag clearly, at the point it happens, any place where the real implementation has to diverge from the schema or flow described above, so the dissertation text can be corrected to match rather than silently drifting out of sync with the code.
- Keep commits small and per-feature so the GitHub history itself can serve as evidence in the dissertation's version-control section.
