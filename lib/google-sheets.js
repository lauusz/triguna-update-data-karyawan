import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';

export function sheetRange(tab) {
  return `'${tab.replace(/'/g, "''")}'!A:F`;
}

export function localCredentialFile(environment) {
  return environment.GOOGLE_SERVICE_ACCOUNT_FILE || 'kunci_google.json';
}

export function resolveGoogleCredentials(environment, localJson) {
  if (environment.GOOGLE_SERVICE_ACCOUNT_EMAIL && environment.GOOGLE_PRIVATE_KEY) {
    return {
      email: environment.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: environment.GOOGLE_PRIVATE_KEY
    };
  }

  const localCredentials = JSON.parse(localJson);
  if (!localCredentials.client_email || !localCredentials.private_key) {
    throw new Error('Local service account file is incomplete.');
  }

  return { email: localCredentials.client_email, key: localCredentials.private_key };
}

export async function appendSubmission(row) {
  const { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEET_TAB, GOOGLE_SPREADSHEET_ID } = process.env;

  if (!GOOGLE_SHEET_TAB || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets environment variables are incomplete.');
  }

  const localJson = GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY
    ? '{}'
    : readFileSync(join(process.cwd(), localCredentialFile(process.env)), 'utf8');
  const credentials = resolveGoogleCredentials(process.env, localJson);

  const auth = new google.auth.JWT({
    email: credentials.email,
    key: credentials.key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range: sheetRange(GOOGLE_SHEET_TAB),
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] }
  });
}
