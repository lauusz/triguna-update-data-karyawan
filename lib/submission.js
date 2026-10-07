const fields = ['fullName', 'domicile', 'rtRw', 'village', 'district', 'regency', 'contactOneName', 'contactOneRelationship', 'contactOnePhone', 'contactTwoName', 'contactTwoRelationship', 'contactTwoPhone'];

export function isValidPin(pin, expectedPin) {
  return Boolean(expectedPin) && pin === expectedPin;
}

export function validateSubmission(body, expectedPin) {
  if (!body || !isValidPin(body.pin, expectedPin)) {
    return { error: 'PIN tidak valid.', status: 401 };
  }

  const data = Object.fromEntries(fields.map((field) => {
    const value = String(body[field] ?? '').trim();
    return [field, field.endsWith('Phone') ? value : value.toUpperCase()];
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
    data.rtRw,
    data.village,
    data.district,
    data.regency,
    data.contactOneName,
    data.contactOneRelationship,
    data.contactOnePhone,
    data.contactTwoName,
    data.contactTwoRelationship,
    data.contactTwoPhone
  ];
}
