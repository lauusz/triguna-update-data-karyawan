import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidPin, submissionRow, validateSubmission } from '../lib/submission.js';
import { createSubmissionResponse } from '../lib/submission-response.js';
import { localCredentialFile, resolveGoogleCredentials, sheetRange } from '../lib/google-sheets.js';

const validBody = {
  pin: '4491',
  fullName: '  Dini Kusuma  ',
  domicile: '  Jakarta Selatan ',
  rtRw: '001/002',
  village: 'Senayan',
  district: 'Kebayoran Baru',
  regency: 'Jakarta Selatan',
  contactOneName: 'Tono Kusuma',
  contactOneRelationship: 'Ayah',
  contactOnePhone: '+62 812-3456-7890',
  contactTwoName: 'Sari Kusuma',
  contactTwoRelationship: 'Ibu',
  contactTwoPhone: '+62 811-1111-2222'
};

test('accepts complete data and preserves a formatted phone number', () => {
  const result = validateSubmission(validBody, '4491');

  assert.deepEqual(result.data, {
    fullName: 'DINI KUSUMA',
    domicile: 'JAKARTA SELATAN',
    rtRw: '001/002',
    village: 'SENAYAN',
    district: 'KEBAYORAN BARU',
    regency: 'JAKARTA SELATAN',
    contactOneName: 'TONO KUSUMA',
    contactOneRelationship: 'AYAH',
    contactOnePhone: '+62 812-3456-7890',
    contactTwoName: 'SARI KUSUMA',
    contactTwoRelationship: 'IBU',
    contactTwoPhone: '+62 811-1111-2222'
  });
});

test('rejects blank required fields and an incorrect PIN', () => {
  assert.equal(validateSubmission({ ...validBody, domicile: ' ' }, '4491').status, 400);
  assert.equal(validateSubmission({ ...validBody, pin: '0000' }, '4491').status, 401);
});

test('only accepts a configured matching PIN', () => {
  assert.equal(isValidPin('4491', '4491'), true);
  assert.equal(isValidPin('4491', ''), false);
  assert.equal(isValidPin('0000', '4491'), false);
});

test('maps normalized data to the agreed spreadsheet column order', () => {
  const { data } = validateSubmission(validBody, '4491');

  assert.deepEqual(submissionRow(data, '2026-10-07T09:00:00+07:00'), [
    '2026-10-07T09:00:00+07:00',
    'DINI KUSUMA',
    'JAKARTA SELATAN',
    '001/002',
    'SENAYAN',
    'KEBAYORAN BARU',
    'JAKARTA SELATAN',
    'TONO KUSUMA',
    'AYAH',
    '+62 812-3456-7890',
    'SARI KUSUMA',
    'IBU',
    '+62 811-1111-2222'
  ]);
});

test('maps an append failure to a generic 502 response', async () => {
  const response = await createSubmissionResponse(validBody, {
    expectedPin: '4491',
    append: async () => { throw new Error('permission denied'); },
    submittedAt: '2026-10-07T09:00:00+07:00'
  });

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Data belum dapat dikirim. Silakan coba lagi.' });
});

test('does not append data when the PIN is incorrect', async () => {
  let appendCalled = false;
  const response = await createSubmissionResponse({ ...validBody, pin: '0000' }, {
    expectedPin: '4491',
    append: async () => { appendCalled = true; },
    submittedAt: '2026-10-07T09:00:00+07:00'
  });

  assert.equal(response.status, 401);
  assert.equal(appendCalled, false);
});

test('refuses requests when the server PIN is not configured', async () => {
  let appendCalled = false;
  const response = await createSubmissionResponse(validBody, {
    expectedPin: '',
    append: async () => { appendCalled = true; },
    submittedAt: '2026-10-07T09:00:00+07:00'
  });

  assert.equal(response.status, 500);
  assert.equal(appendCalled, false);
});

test('appends the agreed spreadsheet row after server validation', async () => {
  let row;
  const response = await createSubmissionResponse(validBody, {
    expectedPin: '4491',
    append: async (value) => { row = value; },
    submittedAt: '2026-10-07T09:00:00+07:00'
  });

  assert.equal(response.status, 200);
  assert.deepEqual(row, [
    '2026-10-07T09:00:00+07:00', 'DINI KUSUMA', 'JAKARTA SELATAN', '001/002', 'SENAYAN', 'KEBAYORAN BARU', 'JAKARTA SELATAN',
    'TONO KUSUMA', 'AYAH', '+62 812-3456-7890', 'SARI KUSUMA', 'IBU', '+62 811-1111-2222'
  ]);
});

test('quotes spreadsheet tab names for the expanded A1 range', () => {
  assert.equal(sheetRange('Data Karyawan'), "'Data Karyawan'!A:M");
  assert.equal(sheetRange("Data Karyawan '2026'"), "'Data Karyawan ''2026'''!A:M");
});

test('uses the local service-account JSON only when environment credentials are absent', () => {
  const localKey = JSON.stringify({ client_email: 'local@example.test', private_key: 'local-key' });

  assert.deepEqual(resolveGoogleCredentials({}, localKey), {
    email: 'local@example.test',
    key: 'local-key'
  });
  assert.deepEqual(resolveGoogleCredentials({ GOOGLE_SERVICE_ACCOUNT_EMAIL: 'env@example.test', GOOGLE_PRIVATE_KEY: 'env-key' }, localKey), {
    email: 'env@example.test',
    key: 'env-key'
  });
});

test('uses the configured local service-account filename', () => {
  assert.equal(localCredentialFile({}), 'kunci_google.json');
  assert.equal(localCredentialFile({ GOOGLE_SERVICE_ACCOUNT_FILE: 'credential.json' }), 'credential.json');
});
