const fields = ['fullName', 'domicile', 'contactName', 'relationship', 'phone'];

export function isValidPin(pin, expectedPin) {
  return Boolean(expectedPin) && pin === expectedPin;
}

export function validateSubmission(body, expectedPin) {
  if (!body || !isValidPin(body.pin, expectedPin)) {
    return { error: 'PIN tidak valid.', status: 401 };
  }

  const data = Object.fromEntries(fields.map((field) => {
    const value = String(body[field] ?? '').trim();
    return [field, field === 'phone' ? value : value.toUpperCase()];
  }));
  const missingField = fields.find((field) => !data[field]);

  if (missingField) {
    return { error: 'Semua kolom wajib diisi.', field: missingField, status: 400 };
  }

  return { data };
}

export function submissionRow(data, submittedAt) {
  return [
    submittedAt,
    data.fullName,
    data.domicile,
    data.contactName,
    data.relationship,
    data.phone
  ];
}
