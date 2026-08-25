# Task 1 (AI Suggestion Generator) — Gemini integration debug walkthrough

**Date:** 2026-08-24/25
**Symptom:** every scan's `ai_suggestions.generated_by` comes back `"fallback"` with
`[AI suggestion unavailable: the AI service call failed]` messages, even after adding
`GEMINI_API_KEY` to `backend/.env` and restarting the server.

This was root-caused end to end rather than guessed at. Each step below was actually run
against the live process, not inferred.

## Step 1 — is the key actually reaching `os.environ`?

Ran, from `backend/` (the directory the server is actually started from), the exact same
`load_dotenv()` call `wdsl/config.py` makes:

```
loaded: True
non-empty: True
length: 56
repr (first/last 6 chars only): AQ.Ab8...xrQsss
```

`cat -A backend/.env` on the `GEMINI_API_KEY=` line showed a clean single-line assignment —
no surrounding quotes, no stray `^M` (Windows CR), no trailing whitespace, variable name
spelled correctly. **Passes.** `load_dotenv()` runs at `wdsl/config.py` import time, before
`Config.GEMINI_API_KEY` is ever read, and `backend/.env` is exactly where the app looks
(cwd when the server is launched with `python app.py` from `backend/`).

## Step 2 — is the Gemini client initialized with that key?

Created a real Flask app instance, entered its app context, read
`current_app.config.get("GEMINI_API_KEY")`, and compared it byte-for-byte against the
`.env` value:

```
current_app.config GEMINI_API_KEY set: True
matches .env value: True
```

`ai_suggestions.py` reads `current_app.config.get("GEMINI_API_KEY")` fresh on every call and
passes it straight into `genai.configure(api_key=api_key)` — there is no hardcoded key, no
leftover empty-string default from earlier scaffolding, and no caching that could serve a
stale value. **Passes.**

## Step 3 — what actually happens when a real scan runs?

Triggered a real rescan (`POST /reports/11/rescan`) against the live server and read the
server's own stdout, not just the API response:

```
Gemini suggestion generation failed: 401 Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie or other valid authentication credential.
[reason: "ACCESS_TOKEN_TYPE_UNSUPPORTED"]
```

So: the request **is** being made (it reached Google's servers and got a real HTTP
response back — this rules out "request never sent"). It **is** throwing an exception, which
**is** being caught by the `except Exception` in `generate_suggestions()` — and that handler's
`logger.warning(...)` call was already printing the real exception to the server console the
whole time. It was never silent; nobody had looked at the server log before now. Response
parsing (`json.loads(response.text)`) was never reached, since the failure happens at the
HTTP/auth layer before a response body exists to parse.

## Step 4 — which root cause is it?

Tested the five candidates the debug request named, in order:

1. **Invalid/malformed API key** — tested directly: called
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
   with `curl`, completely bypassing the Python SDK, both as a `?key=` query parameter and as
   an `x-goog-api-key` header. **Identical `401 ACCESS_TOKEN_TYPE_UNSUPPORTED` both times.**
   This is Google's own server, at the production endpoint, saying the string in
   `GEMINI_API_KEY` is not recognized as a valid credential of any kind — not "valid key,
   wrong permissions," but "this doesn't parse as an API key." **Confirmed — this is the
   cause.**
2. **Model name no longer valid** — ruled out. An unavailable model returns `404 NOT_FOUND`
   *after* authentication succeeds. Every failure here is `401`, before the model is ever
   looked up.
3. **Free-tier rate limit** — ruled out. Rate limiting returns `429 RESOURCE_EXHAUSTED`. Never
   observed.
4. **Outbound network blocked** — ruled out. A blocked network path fails as a connection
   timeout/refusal/DNS error, not a well-formed JSON error body returned by Google's own
   server. We got a clean, structured response from `generativelanguage.googleapis.com` both
   times.
5. **SDK/API version mismatch** — ruled out. The `curl` reproduction above used zero SDK code
   and got the byte-identical error, which isolates the failure to the credential value
   itself, not to how `google-generativeai` (installed version `0.8.6`, itself now
   fully deprecated by Google in favour of `google-genai` — a separate, non-blocking
   follow-up) constructs the request.

## Resolution — a new key surfaced two more real issues, both fixed

A new key was generated and pasted into `.env` (and, briefly, hardcoded as the
`os.environ.get("GEMINI_API_KEY", ...)` default in `config.py` — flagged and reverted
immediately: baking a live secret into source as a fallback default means it ships in every
clone of the repo forever, and it's also functionally inert whenever `.env` sets the
variable, since `os.environ.get(name, default)` only returns `default` when the variable is
*absent*, not when it's present-but-invalid. `.env` is correctly gitignored and the key was
never actually committed, so no history rewrite was needed — just removed it).

Re-running the same `curl` reproduction from Step 4 with the new key surfaced two more
concrete, real problems, in order:

**Problem 2 — the pinned model name was retired.** `gemini-1.5-flash` (the model this code
originally called) now 404s for every key, including the new one — Google has fully retired
it. Worse, `curl .../v1beta/models?key=...` (`ListModels`) showed the *next* two obvious
replacements were also gone: `gemini-2.5-flash` 404s with *"This model ... is no longer
available to new users. Please update your code to use models/gemini-3.6-flash"* — Google's
own model catalogue had moved two full generations in the time since this integration was
written. This is exactly candidate cause #2 from the original debug request ("the model name
used in the code no longer being a valid/available model"), confirmed this time.

**Problem 3 — the newest alias was itself unreliable.** Fixed the model name to
`gemini-flash-latest` per Google's own suggestion, and it authenticated fine (proving the new
key really was valid) but then intermittently returned `503 UNAVAILABLE` ("high demand") and,
on other attempts, hung until timeout (`20s` via the SDK, `30-60s` via plain `curl` with zero
SDK code involved) — for the *identical* simple prompt that had succeeded in ~2 seconds
minutes earlier. This ruled out every code-side explanation (JSON-mode generation config,
prompt length, SDK transport — REST vs. the default gRPC — were all tested independently and
made no difference) and pointed at real-time capacity variance on Google's side for that
specific alias.

**Fix:** switched to `gemini-3.5-flash`, a specific pinned version (not an alias), which
answered correctly in ~3 seconds across every repeated test. `MODEL_NAME` is now a single
module-level constant in `ai_suggestions.py` used both to call the model and to populate
`generated_by`, instead of two separate string literals that could drift out of sync the way
they did before (`GenerativeModel("gemini-1.5-flash")` calling code updated to
`"gemini-flash-latest"` at one point while `parsed["generated_by"] = "gemini-1.5-flash"` a few
lines down stayed unchanged — the kind of thing that's easy to miss under exactly this sort
of iterative debugging). This is a known tradeoff, not an oversight: a pinned version gives
predictable dissertation-demo behaviour today at the cost of needing revisiting if
`gemini-3.5-flash` is retired later, the same way `gemini-1.5-flash` was.

## Confirmed working end to end

Re-ran a real rescan (`POST /reports/11/rescan`) against `skyhomesengineering.lk`'s 8 real
axe-core violations:

```
generated_by: gemini-3.5-flash
```

with genuinely distinct, on-topic generated text for both audiences — e.g. for
`color-contrast`, technical: *"Text elements fail to meet the WCAG 2.1 Success Criterion
1.4.3 minimum contrast ratio of 4.5:1 ... Modify the CSS 'color' and 'background-color'
declarations..."*; plain-language: *"Some text on your website is too hard to read because
the text color is too close to the background color. This makes reading difficult for people
with low vision, color blindness..."* — for all 8 violations, not a subset.

`tests/test_ai_suggestions.py::test_4_1_gemini_call_succeeds_when_key_configured` — previously
skipped in every test run in this project (no key was ever configured before) — now runs and
passes for the first time: `3 passed` where it was `2 passed, 1 skipped`.
