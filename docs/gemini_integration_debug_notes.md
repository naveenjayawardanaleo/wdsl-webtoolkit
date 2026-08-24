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

## Status: not fixed — needs a real credential

This is not a bug in `wdsl/services/ai_suggestions.py`, `config.py`, or the analyze/rescan
pipeline; all four were verified working correctly end to end, including the "graceful
fallback" path itself, which behaved exactly as designed. The blocker is that the value
currently in `GEMINI_API_KEY` is not a working Gemini API key by Google's own account.

**To close this out:** get a key from https://aistudio.google.com/apikey specifically (the
dedicated Gemini API key generator, matching what `backend/.env.example` was written
against), paste the full string into `backend/.env`, restart the server, and re-run a scan.
The fastest independent way to confirm a new key works *before* even touching the app:

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"say hi"}]}]}'
```

A working key returns a `candidates` array with generated text; this project's key returns
the `401` above. Once that `curl` call succeeds, `report.ai_suggestions.generated_by` should
read `"gemini-1.5-flash"` instead of `"fallback"`, with real generated `technical` and
`plain_language` text instead of the `[AI suggestion unavailable: ...]` placeholder.
