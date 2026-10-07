import { submissionRow, validateSubmission } from './submission.js';

export async function createSubmissionResponse(body, { expectedPin, append, submittedAt }) {
  if (!expectedPin) {
    return Response.json({ error: 'Layanan belum dikonfigurasi.' }, { status: 500 });
  }

  const result = validateSubmission(body, expectedPin);

  if (result.error) {
    return Response.json({ error: result.error, field: result.field }, { status: result.status });
  }

  try {
    await append(submissionRow(result.data, submittedAt));
    return Response.json({ message: 'Data berhasil dikirim.' });
  } catch {
    return Response.json({ error: 'Data belum dapat dikirim. Silakan coba lagi.' }, { status: 502 });
  }
}
