'use client';

import { useEffect, useRef, useState } from 'react';

const emptyForm = {
  fullName: '',
  domicile: '',
  contactName: '',
  relationship: '',
  phone: ''
};

export default function Home() {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [checkingPin, setCheckingPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const successDialog = useRef(null);

  useEffect(() => {
    if (!successOpen) return;
    successDialog.current?.showModal();
    return () => successDialog.current?.open && successDialog.current.close();
  }, [successOpen]);

  async function verifyPin(event) {
    event.preventDefault();
    setCheckingPin(true);
    setPinError('');

    try {
      const response = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) {
        setPinError('PIN tidak sesuai. Periksa kembali lalu coba lagi.');
        return;
      }

      setUnlocked(true);
    } catch {
      setPinError('PIN belum dapat diperiksa. Coba beberapa saat lagi.');
    } finally {
      setCheckingPin(false);
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => !value.trim())
        .map(([key]) => [key, 'Kolom ini wajib diisi.'])
    );

    setErrors(nextErrors);
    setStatus(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, ...form })
      });
      const result = await response.json();

      if (!response.ok) {
        setErrors(result.field ? { [result.field]: result.error } : {});
        setStatus({ type: 'error', message: result.error || 'Data belum dapat dikirim.' });
        return;
      }

      setForm(emptyForm);
      setErrors({});
      setSuccessOpen(true);
    } catch {
      setStatus({ type: 'error', message: 'Koneksi bermasalah. Data belum dikirim.' });
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'phone' ? value : value.toUpperCase() }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function returnToPin() {
    setSuccessOpen(false);
    setUnlocked(false);
    setPin('');
    setErrors({});
    setStatus(null);
  }

  if (!unlocked) {
    return (
      <main className="gate-shell">
        <section className="pin-card" aria-labelledby="pin-title">
          <p className="eyebrow">UPDATE DATA</p>
          <h1 id="pin-title">Masukkan PIN</h1>
          <p className="intro">Gunakan PIN yang diberikan untuk membuka formulir pembaruan data.</p>

          <form onSubmit={verifyPin} noValidate>
            <label htmlFor="pin">PIN akses</label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
              aria-describedby={pinError ? 'pin-error' : undefined}
              aria-invalid={Boolean(pinError)}
              autoFocus
              required
            />
            <p className="field-error" id="pin-error" role={pinError ? 'alert' : undefined}>{pinError || '\u00A0'}</p>
            <button className="button-primary" type="submit" disabled={checkingPin}>
              {checkingPin ? 'Memeriksa…' : 'Buka formulir'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="form-frame" aria-labelledby="form-title">
        <header className="form-header">
          <p className="eyebrow">UPDATE DATA</p>
          <h1 id="form-title">Pastikan data kontak Anda terbaru.</h1>
          <p className="intro">Lengkapi seluruh informasi di bawah. Setiap pengiriman akan dicatat sebagai pembaruan baru.</p>
        </header>

        <form onSubmit={submitForm} noValidate>
          <div className="form-grid">
            <div className="field field-wide">
              <label htmlFor="fullName">Nama Lengkap</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={updateField} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} autoComplete="name" required />
              <p className="field-error" id="fullName-error">{errors.fullName || '\u00A0'}</p>
            </div>
            <div className="field field-wide">
              <label htmlFor="domicile">Domisili Saat ini</label>
              <input id="domicile" name="domicile" value={form.domicile} onChange={updateField} aria-invalid={Boolean(errors.domicile)} aria-describedby={errors.domicile ? 'domicile-error' : undefined} autoComplete="address-level2" required />
              <p className="field-error" id="domicile-error">{errors.domicile || '\u00A0'}</p>
            </div>
          </div>

          <fieldset className="family-section">
            <legend>Keluarga yang dapat dihubungi</legend>
            <p className="section-note">Diisi untuk kebutuhan komunikasi jika diperlukan.</p>
            <div className="family-grid">
              <div className="field field-wide">
                <label htmlFor="contactName">Nama keluarga yang dapat dihubungi</label>
                <input id="contactName" name="contactName" value={form.contactName} onChange={updateField} aria-invalid={Boolean(errors.contactName)} aria-describedby={errors.contactName ? 'contactName-error' : undefined} required />
                <p className="field-error" id="contactName-error">{errors.contactName || '\u00A0'}</p>
              </div>
              <div className="field">
                <label htmlFor="relationship">Hubungan</label>
                <input id="relationship" name="relationship" value={form.relationship} onChange={updateField} aria-invalid={Boolean(errors.relationship)} aria-describedby={errors.relationship ? 'relationship-error' : undefined} required />
                <p className="field-error" id="relationship-error">{errors.relationship || '\u00A0'}</p>
              </div>
              <div className="field">
                <label htmlFor="phone">Nomor yang dapat dihubungi</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={updateField} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} autoComplete="tel" required />
                <p className="field-error" id="phone-error">{errors.phone || '\u00A0'}</p>
              </div>
            </div>
          </fieldset>

          {status && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
          <button className="button-primary submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Mengirim…' : 'Kirim pembaruan'}
          </button>
        </form>

        <dialog className="success-dialog" ref={successDialog} onCancel={(event) => event.preventDefault()} aria-labelledby="success-title">
          <p className="eyebrow">DATA TERKIRIM</p>
          <h2 id="success-title">Terima kasih.</h2>
          <p>Data pembaruan Anda sudah berhasil dicatat.</p>
          <button className="button-primary" type="button" onClick={returnToPin}>Kembali ke halaman PIN</button>
        </dialog>
      </section>
    </main>
  );
}
