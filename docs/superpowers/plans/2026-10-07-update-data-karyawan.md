# Update Data Karyawan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PIN-protected, responsive employee contact update form that appends each valid submission to the configured Google Spreadsheet.

**Architecture:** A small Next.js application renders the PIN gate and form. `POST /api/submissions` validates a body containing the submitted PIN and fields, then uses a server-only Google Sheets client to append one row. The client never receives environment values.

**Tech Stack:** Next.js, React, Node.js `node:test`, Google Sheets API through `googleapis`, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-10-07-update-data-karyawan-design.md`

## Global Constraints

- Store `FORM_PIN=4491`, Google service-account credentials, spreadsheet ID, and tab name in local/Vercel environment variables only.
- Add one row per submission; never update or deduplicate entries.
- Append timestamp, name, domicile, family contact name, relationship, and phone in that exact order.
- Keep the UI usable from 320 px mobile widths through desktop widths.
- Do not add authentication, persistence, dashboards, or a database beyond the requested Google Spreadsheet.

## Review Focus

- A whitespace-only required field must not append a row; test validation in Task 1.
- A missing or incorrect PIN must produce 401 before the sheet append; test the submission handler in Task 1.
- Indonesian phone-number characters such as `+`, spaces, and hyphens must be retained as text; test the normalized payload in Task 1.
- Misconfigured or unshared Google credentials must present a retryable generic failure rather than expose credentials; test route error mapping in Task 2.
- A 320 px viewport must keep controls readable with no horizontal overflow; manually verify in Task 3.

---

## File structure

- `package.json`, `next.config.mjs`, `jsconfig.json`: minimal application and scripts.
- `lib/submission.js`: pure request validation and payload-to-row mapping.
- `lib/google-sheets.js`: server-only authenticated Google Sheets append operation.
- `app/api/submissions/route.js`: HTTP boundary and error mapping.
- `app/page.jsx`: PIN gate and form interaction.
- `app/globals.css`, `tokens.css`: responsive visual system.
- `test/submission.test.js`: dependency-free server behavior checks.
- `.env.example`, `README.md`: Vercel and spreadsheet setup instructions.

### Task 1: Validated submission core

**Files:**
- Create: `package.json`, `jsconfig.json`, `test/submission.test.js`
- Create: `lib/submission.js`

**Interfaces:**
- Produces: `validateSubmission(body, expectedPin) -> { data } | { error, status }`
- Produces: `submissionRow(data, submittedAt) -> string[]`

- [ ] **Step 1: Write the failing validation tests**

```js
test('accepts complete data and preserves a formatted phone number', () => {
  const result = validateSubmission(validBody, '4491');
  assert.deepEqual(result.data.phone, '+62 812-3456-7890');
});

test('rejects blank required fields and an incorrect PIN', () => {
  assert.equal(validateSubmission({ ...validBody, domicile: ' ' }, '4491').status, 400);
  assert.equal(validateSubmission({ ...validBody, pin: '0000' }, '4491').status, 401);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- test/submission.test.js`

Expected: FAIL because `lib/submission.js` does not exist.

- [ ] **Step 3: Implement `validateSubmission(body, expectedPin)` and `submissionRow(data, submittedAt)` in `lib/submission.js`**

Trim required text fields, preserve phone punctuation, validate the PIN before accepting data, and produce the six columns in the spec's order.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- test/submission.test.js`

Expected: PASS.

### Task 2: Server route and Google Sheets append

**Files:**
- Create: `lib/google-sheets.js`, `app/api/submissions/route.js`
- Modify: `test/submission.test.js`, `package.json`

**Interfaces:**
- Consumes: `validateSubmission(body, expectedPin)` and `submissionRow(data, submittedAt)`.
- Produces: `appendSubmission(data) -> Promise<void>`.
- Produces: `POST(request) -> Response`.

- [ ] **Step 1: Write a failing test for route-level error mapping**

```js
test('maps an append failure to a generic 502 response', async () => {
  const response = await createSubmissionResponse(validBody, {
    pin: '4491', append: async () => { throw new Error('permission denied'); }
  });
  assert.equal(response.status, 502);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- test/submission.test.js`

Expected: FAIL because `createSubmissionResponse` is not exported.

- [ ] **Step 3: Implement server-only sheet append and the POST route**

Use `googleapis` with `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (converting literal `\\n` to newlines), `GOOGLE_SPREADSHEET_ID`, and `GOOGLE_SHEET_TAB`. Append with `USER_ENTERED`; construct Jakarta timestamp in the route. Export the dependency-injected `createSubmissionResponse` helper for the test and keep the production `POST` route as its small wrapper.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- test/submission.test.js`

Expected: PASS.

### Task 3: Responsive form and deployment setup

**Files:**
- Create: `app/page.jsx`, `app/globals.css`, `tokens.css`, `.env.example`, `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `POST /api/submissions` with `{ pin, fullName, domicile, contactName, relationship, phone }`.
- Produces: a PIN gate and submitted-form experience.

- [ ] **Step 1: Write the failing application build check**

Run: `npm run build`

Expected: FAIL because the Next.js application entry point does not exist.

- [ ] **Step 2: Implement the minimal form page**

Create the numeric PIN gate, server-validated submit flow, labelled required fields, field errors, and loading/success/retry UI. Keep PIN only in React state and clear it on refresh.

- [ ] **Step 3: Implement tokenized responsive styling**

Create `tokens.css`, import it from `globals.css`, and implement a one-column mobile layout, a desktop grid only for short contact fields, touch-friendly controls, `:focus-visible`, and reduced-motion support. No external UI library or imagery.

- [ ] **Step 4: Add deployment/setup guidance**

Document Google Cloud service-account creation, spreadsheet sharing, required local/Vercel variables, the tab-name configuration, and the first-row header labels. Include an `.env.example` with placeholders only.

- [ ] **Step 5: Verify build and responsive behavior**

Run: `npm test && npm run build`

Expected: PASS.

Manually inspect at 320, 375, 414, 768, and 1440 px. Confirm there is no horizontal overflow, the form is accessible after a valid PIN, and a bad PIN never reveals it.

## Plan self-review

- Spec coverage: Tasks 1–2 cover validation, data order, API security, Google Sheets append, and service-account configuration; Task 3 covers the gate, form, responsive UI, environment example, and setup documentation.
- Step scan: each task follows a failing-check, minimum implementation, then verification sequence.
- Type consistency: all handler code uses `validateSubmission`, `submissionRow`, `appendSubmission`, and `createSubmissionResponse` exactly as declared.
- Review-focus coverage: the five risks are assigned to Tasks 1–3.
- Proportion: the plan defines interfaces and checks without prescribing implementation bodies.
