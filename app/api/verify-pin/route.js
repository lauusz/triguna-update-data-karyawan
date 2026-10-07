import { isValidPin } from '../../../lib/submission.js';

export async function POST(request) {
  let pin;

  try {
    ({ pin } = await request.json());
  } catch {
    return Response.json({ error: 'PIN tidak valid.' }, { status: 400 });
  }

  if (!isValidPin(pin, process.env.FORM_PIN)) {
    return Response.json({ error: 'PIN tidak valid.' }, { status: 401 });
  }

  return Response.json({ message: 'PIN valid.' });
}
