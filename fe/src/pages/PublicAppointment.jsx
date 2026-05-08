import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlateInput from '../components/PlateInput';
import { api } from '../api/velautoApi';
import { pushToast } from '../lib/toastBus';
import { carBrands } from '../constants/carData';
import { damagePrices } from '../constants/damageCatalogMap';
import { applyBrandMultiplier } from '../constants/brandTiers';

// Icons removed as per user request
const CATEGORY_ICONS = {};

const initialForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  plateCountry: 'TR',
  plate: '',
  brand: '',
  model: '',
  appointmentDate: '',
  complaint: '',
  selectedServices: [],
};

export default function PublicAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;
  const update = (field, value) => setForm((prev) => {
    if (field === 'brand') {
      return { ...prev, brand: value, model: '' };
    }
    return { ...prev, [field]: value };
  });

  const toggleService = (category) => {
    setForm(prev => {
      const selected = prev.selectedServices.includes(category)
        ? prev.selectedServices.filter(c => c !== category)
        : [...prev.selectedServices, category];
      return { ...prev, selectedServices: selected };
    });
  };

  const estimatedPrice = useMemo(() => {
    return form.selectedServices.reduce((total, category) => {
      const basePrice = damagePrices[category] || 0;
      return total + applyBrandMultiplier(basePrice, form.brand);
    }, 0);
  }, [form.selectedServices, form.brand]);

  const brands = useMemo(() => Object.keys(carBrands).sort(), []);
  const models = useMemo(() => (form.brand ? carBrands[form.brand] || [] : []), [form.brand]);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        plate: form.plate,
        brand: form.brand,
        model: form.model,
        appointmentDate: form.appointmentDate,
        complaint: form.selectedServices.join(', ') + (form.complaint ? ` | Not: ${form.complaint}` : ''),
      };

      await api.appointments.createPublic(payload);
      pushToast({
        type: 'success',
        title: 'Randevu Talebi Alındı',
        message: 'Servis ekibimiz sizinle en kısa sürede iletişime geçecektir.'
      });
      navigate('/');
    } catch (submitError) {
      setError(submitError.message || 'Randevu talebi gönderilemedi.');
      pushToast({ type: 'danger', title: 'Hata', message: 'İşlem sırasında bir sorun oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-12">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center flex-1 relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500 z-10 ${step >= i ? 'bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-soft)]'
            }`}>
            {i}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest mt-3 transition-colors ${step >= i ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            {['Müşteri', 'Araç', 'Servis', 'Onay'][i - 1]}
          </span>
          {i < 4 && (
            <div className={`absolute top-5 left-1/2 w-full h-[1px] -z-0 transition-colors duration-500 ${step > i ? 'bg-[var(--accent)]/50' : 'bg-[var(--border-soft)]'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 selection:bg-[var(--accent)] selection:text-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="group flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-soft)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-black transition-all">
              ←
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Geri Dön</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">VeloAuto <span className="text-[var(--accent)]">Service</span></h2>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Otomotiv Çözüm Merkezi</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[48px] p-8 md:p-14 shadow-2xl relative overflow-hidden">
          {/* Decorative Glows - Added pointer-events-none to prevent blocking clicks */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

          {renderStepIndicator()}

          {/* Steps Content */}
          <div className="min-h-[340px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Kayıt Başlat</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-3 font-medium uppercase tracking-widest">İletişim Bilgileriniz</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Adınız</label>
                    <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:text-[var(--text-muted)]" placeholder="Örn: Mehmet" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Soyadınız</label>
                    <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:text-[var(--text-muted)]" placeholder="Örn: Kaya" />
                  </div>
                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Telefon</label>
                    <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:text-[var(--text-muted)]" placeholder="05XX XXX XX XX" />
                  </div>
                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">E-posta</label>
                    <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:text-[var(--text-muted)]" placeholder="ornek@mail.com" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Araç Detayları</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-3 font-medium uppercase tracking-widest">Marka, Model ve Plaka</p>
                </div>
                <div className="space-y-8">
                  <PlateInput
                    country={form.plateCountry}
                    value={form.plate}
                    onCountryChange={(c) => update('plateCountry', c)}
                    onChange={(p) => update('plate', p)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Marka Seçiniz</label>
                      <select
                        required
                        value={form.brand}
                        onChange={(e) => update('brand', e.target.value)}
                        className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-[var(--bg-card)] text-[var(--text-primary)]">Marka Seçin</option>
                        {brands.map(b => <option key={b} value={b} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Model Seçiniz</label>
                      <select
                        required
                        disabled={!form.brand}
                        value={form.model}
                        onChange={(e) => update('model', e.target.value)}
                        className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold appearance-none cursor-pointer disabled:opacity-20"
                      >
                        <option value="" disabled className="bg-[var(--bg-card)] text-[var(--text-primary)]">Model Seçin</option>
                        {models.map(m => <option key={m} value={m} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Tercih Edilen Randevu Tarihi</label>
                    <input
                      required
                      type="datetime-local"
                      value={form.appointmentDate}
                      onChange={(e) => update('appointmentDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Hizmet Seçimi</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-3 font-medium uppercase tracking-widest">İhtiyacınız Olan Servisler</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(damagePrices).map(([category, price]) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleService(category)}
                      className={`p-5 rounded-[32px] border transition-all duration-300 text-left group flex flex-col justify-end h-32 relative overflow-hidden ${form.selectedServices.includes(category)
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-[0_0_30px_rgba(255,184,0,0.2)]'
                        : 'bg-[var(--bg-main)] border-[var(--border-soft)] hover:border-[var(--accent)]/40'
                        }`}
                    >
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${form.selectedServices.includes(category) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{category}</p>
                        <p className="text-lg font-black text-[var(--text-primary)] mt-1">
                          {applyBrandMultiplier(price, form.brand).toLocaleString('tr-TR')} TL
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-3 mt-8">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Ek Şikayet / Notlar</label>
                  <textarea value={form.complaint} onChange={(e) => update('complaint', e.target.value)} placeholder="Şikayetinizi buraya detaylandırabilirsiniz..." rows="3" className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all text-sm font-medium resize-none" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-10 py-6">
                <div className="inline-flex p-10 rounded-[48px] bg-[var(--bg-main)] border border-[var(--border-soft)] shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.4em] mb-3">Tahmini İşlem Bedeli</p>
                    <div className="flex items-baseline justify-center gap-3">
                      <span className="text-7xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-2xl">{estimatedPrice.toLocaleString('tr-TR')}</span>
                      <span className="text-2xl font-black text-[var(--accent)]">TL</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5 text-left max-w-md mx-auto">
                  <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-soft)]">
                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Müşteri</p>
                    <p className="text-base font-black text-[var(--text-primary)] truncate">{form.firstName} {form.lastName}</p>
                  </div>
                  <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-soft)]">
                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Araç / Plaka</p>
                    <p className="text-base font-black text-[var(--text-primary)]">{form.brand} {form.model} <span className="text-xs text-[var(--accent)] ml-2">{form.plate}</span></p>
                  </div>
                  <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-soft)]">
                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">E-posta</p>
                    <p className="text-base font-black text-[var(--text-primary)] truncate">{form.email}</p>
                  </div>
                  <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-soft)]">
                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Randevu Tarihi</p>
                    <p className="text-base font-black text-[var(--text-primary)]">
                      {form.appointmentDate ? new Date(form.appointmentDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest italic">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                  Nihai fiyat tespit sonrası belirlenecektir.
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-16 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-8 py-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl text-[10px] font-black text-[var(--text-primary)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] transition-all uppercase tracking-[0.3em] shadow-xl active:scale-95"
              >
                Geri
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={
                  (step === 1 && (!form.firstName || !form.lastName || !form.phone || !form.email)) ||
                  (step === 2 && (!form.plate || !form.brand || !form.model || !form.appointmentDate)) ||
                  (step === 3 && form.selectedServices.length === 0)
                }
                className="px-12 py-4 bg-[var(--accent)] text-black font-black rounded-2xl shadow-[0_20px_40px_-10px_rgba(255,184,0,0.3)] hover:scale-[1.04] active:scale-[0.96] transition-all uppercase tracking-[0.25em] disabled:opacity-10 text-xs"
              >
                İlerle
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-12 py-4 bg-[var(--text-primary)] text-[var(--bg-main)] font-black rounded-2xl shadow-2xl hover:scale-[1.04] active:scale-[0.96] transition-all uppercase tracking-[0.25em] disabled:opacity-50 text-xs"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Talebi Tamamla'}
              </button>
            )}
          </div>

          {error && <p className="mt-10 text-center text-[10px] font-black text-[var(--danger)] animate-pulse uppercase tracking-[0.3em]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
