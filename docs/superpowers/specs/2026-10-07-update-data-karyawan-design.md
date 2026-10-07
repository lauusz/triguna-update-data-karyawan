# Update Data Karyawan — Design

## Purpose

Provide a small, responsive web form for employees to submit current contact details. Each successful submission creates a new row in the supplied Google Spreadsheet; it never edits or deduplicates earlier rows.

## Scope

- A PIN gate shown before the form. The valid PIN is read only on the server from `FORM_PIN`.
- A responsive form with these required fields:
  - Nama Lengkap
  - Domisili Saat ini
  - Nama keluarga yang dapat dihubungi
  - Hubungan
  - Nomor yang dapat dihubungi
- A distinct “Keluarga yang dapat dihubungi” section for the last three fields.
- A Vercel-compatible server endpoint that validates the PIN and appends to Google Sheets.

## Architecture

Use a minimal Next.js application.

```text
Browser form -> POST /api/submissions -> Google Sheets API -> first configured sheet tab
```

The browser keeps the entered PIN in component memory only. It must include it in the submit request; the server compares it with `FORM_PIN` before doing anything else. This prevents bypassing the visual gate by directly calling the endpoint. Refreshing the page requires entering the PIN again.

The Google Sheets client exists only in server-side code. Credentials are read from Vercel environment variables and are never sent to the browser.

## Spreadsheet contract

The target spreadsheet is `1K1WQMAhjCkvbUqUZitUZ9a9eGjLENnuCLiO7UCTywzQ`.

The configured tab receives one appended row per successful submission in this order:

1. Waktu kirim (Asia/Jakarta ISO timestamp)
2. Nama Lengkap
3. Domisili Saat ini
4. Nama keluarga yang dapat dihubungi
5. Hubungan
6. Nomor yang dapat dihubungi

`GOOGLE_SHEET_TAB` selects the tab explicitly, avoiding an assumption about the tab name behind `gid=0`.

## Environment variables

```dotenv
FORM_PIN=4491
GOOGLE_SPREADSHEET_ID=1K1WQMAhjCkvbUqUZitUZ9a9eGjLENnuCLiO7UCTywzQ
GOOGLE_SHEET_TAB=Sheet1
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

The spreadsheet owner must share the selected spreadsheet as **Editor** with `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## Interaction and responsive layout

- The PIN view is a focused, numeric-only entry screen with an accessible error message for an incorrect PIN.
- The unlocked form has a restrained, high-contrast surface and visible labels. It has no fabricated statistics, testimonials, or decorative dashboard chrome.
- At narrow widths, fields are a single column with touch-friendly controls. At desktop widths, only the three short family-contact fields share a two-column grid; name and domicile remain full width.
- The submit control exposes disabled/submitting/success/error states. Validation failures are shown next to their corresponding fields.
- The phone field uses `type="tel"`, allowing a phone keypad on mobile devices.

## Error handling

- Missing or blank values return a 400 response with field-level errors.
- Wrong or omitted PIN returns 401 and never appends a row.
- A Google authentication, permission, or network failure returns a generic 502 response to the form while retaining values for retry.

## Verification

- A small automated test covers server payload validation and verifies blank data and bad PIN are rejected before Google Sheets is called.
- Manual responsive checks cover 320, 375, 414, and 768 pixel widths, plus a desktop width.
- A live submission test is deferred until service-account credentials are added locally or in Vercel.

## Planned files

- `package.json`, Next.js configuration, and TypeScript configuration
- `app/page.tsx`, `app/globals.css`, and `app/api/submissions/route.ts`
- `lib/submission.ts` and its focused test
- `.env.example`
- `tokens.css` for the small visual token set

No existing production files will be deleted.
