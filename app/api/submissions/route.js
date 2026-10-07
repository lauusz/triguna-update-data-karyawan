import { appendSubmission } from '../../../lib/google-sheets.js';
import { createSubmissionResponse } from '../../../lib/submission-response.js';

function jakartaTimestamp() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+07:00`;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  return createSubmissionResponse(body, {
    expectedPin: process.env.FORM_PIN,
    append: appendSubmission,
    submittedAt: jakartaTimestamp()
  });
}
