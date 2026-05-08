import { useState } from 'react';
import { Link } from 'react-router-dom';
import PlateInput from '../components/PlateInput';
import { api } from '../api/velautoApi';
import { pushToast } from '../lib/toastBus';

const initialForm = {
  firstName: '',
  lastName: '',
  phone: '',
  plateCountry: 'TR',
  plate: '',
  brand: '',
  model: '',
  complaint: '',
  damageImage: null,
};

export default function PublicAppointment() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('firstName', form.firstName.trim());
      payload.append('lastName', form.lastName.trim());
      payload.append('phone', form.phone.trim());
      payload.append('plate', form.plate.trim());
      payload.append('brand', form.brand.trim());
      payload.append('model', form.model.trim());
      payload.append('complaint', form.complaint.trim());
      if (form.damageImage) payload.append('damageImage', form.damageImage);

      await api.appointments.createPublic(payload);
      setSent(true);
      setForm(initialForm);
      pushToast({ type: 'success', title: 'Randevu talebi alindi', message: 'Servis ekibi en kisa surede donus yapacak.' });
    } catch (submitError) {
      setError(submitError.message || 'Randevu talebi gonderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent)] hover:underline">
        ← Girise Don
      </Link>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)] font-black">Public Servis Kabul</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Yeni Arac Kabul Formu</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Ad" className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)]" />
          <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Soyad" className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)]" />
          <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Telefon" className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)]" />
          <div className="md:col-span-2">
            <PlateInput
              country={form.plateCountry}
              value={form.plate}
              onCountryChange={(country) => update('plateCountry', country)}
              onChange={(plate) => update('plate', plate)}
            />
          </div>
          <input required value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Marka" className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)]" />
          <input required value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="Model" className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)]" />
          <textarea required minLength={10} value={form.complaint} onChange={(e) => update('complaint', e.target.value)} placeholder="Sikayet / ariza aciklamasi" rows="4" className="md:col-span-2 p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] outline-none focus:border-[var(--accent)] resize-none" />
          <input type="file" accept="image/*" onChange={(e) => update('damageImage', e.target.files?.[0] || null)} className="md:col-span-2 p-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)]" />
        </div>

        {error && <p className="mt-4 text-sm font-bold text-red-400">{error}</p>}
        {sent && <p className="mt-4 text-sm font-bold text-green-500">Talebiniz alindi. Tesekkur ederiz.</p>}

        <button disabled={isSubmitting} className="mt-6 w-full rounded-xl bg-[var(--accent)] p-4 font-black uppercase tracking-[0.18em] text-white transition hover:brightness-110 disabled:opacity-70">
          {isSubmitting ? 'Gonderiliyor...' : 'Randevu Talebi Gonder'}
        </button>
      </form>
    </div>
  );
}
