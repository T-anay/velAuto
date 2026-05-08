import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import PlateInput from '../components/PlateInput';
import CustomerSearch from '../components/CustomerSearch';
import BackButton from '../components/BackButton';
import { carBrands } from '../constants/carData';
import { normalizePlateText, validatePlate } from '../constants/plateFormats';

export default function VehicleEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addJob, customers = [], isLoadingJob } = useService();

  const [formData, setFormData] = useState(() => ({
    plateCountry: 'TR',
    plate: normalizePlateText(location.state?.plate || location.state?.licensePlate || ''),
    customer: location.state?.customer || '',
    phone: location.state?.phone || '',
    brand: location.state?.brand || '',
    model: location.state?.model || '',
    customModel: '',
    status: 'IN_PROGRESS',
    color: 'yellow',
    complaint: location.state?.service || '',
    photos: [],
  }));
  const [error, setError] = useState('');
  const [errorFields, setErrorFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const formatPhoneDisplay = (phone) => {
    const cleaned = String(phone || '').replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    return match ? [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ') : cleaned;
  };

  const handleCustomerSelect = (selected) => {
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      customer: selected.fullName || selected.name || '',
      phone: String(selected.phone || '').replace(/\D/g, '').slice(-10),
      plate: selected.plate ? normalizePlateText(selected.plate) : prev.plate,
    }));
  };

  const handleSubmit = async () => {
    const plate = normalizePlateText(formData.plate).trim();
    const errors = [];
    if (!plate || !validatePlate(plate, formData.plateCountry)) errors.push('plate');
    if (!formData.customer) errors.push('customer');
    if (!formData.phone) errors.push('phone');
    if (!formData.brand) errors.push('brand');
    else if (formData.brand !== 'Diger' && formData.brand !== 'Diğer' && !formData.model) errors.push('model');
    else if ((formData.brand === 'Diger' || formData.brand === 'Diğer') && !formData.customModel.trim()) errors.push('customModel');
    if (!formData.complaint.trim()) errors.push('complaint');

    if (errors.length > 0) {
      setErrorFields(errors);
      setError('Lutfen zorunlu alanlari kontrol edin.');
      return;
    }

    if (!/^\d{10}$/.test(String(formData.phone).trim())) {
      setError('Telefon formati hatali. Ornek: 5300000000');
      return;
    }

    const finalBrand = (formData.brand === 'Diger' || formData.brand === 'Diğer')
      ? formData.customModel.trim()
      : `${formData.brand} ${formData.model}`.trim();

    try {
      setIsSaving(true);
      await addJob({
        ...formData,
        plate,
        brand: finalBrand,
        total: 0,
        complaint: formData.complaint || 'Belirtilmedi',
      });

      setError('');
      setErrorFields([]);
      navigate('/active-jobs');
    } catch (submitError) {
      setError(submitError.message || 'Is emri olusturulamadi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <BackButton />
      <h1 className="text-3xl font-black mb-8 tracking-tight text-[var(--text-primary)]">Yeni Arac Kabul Formu</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border-strong)]/30">
            <h3 className="text-[var(--accent)] font-bold text-base mb-5 flex items-center gap-2">
              <span className="bg-[var(--accent)]/10 p-1.5 rounded text-xs">1.</span> Arac & Musteri Bilgileri
            </h3>

            <div className="space-y-4">
              <PlateInput
                country={formData.plateCountry}
                value={formData.plate}
                onCountryChange={(plateCountry) => setFormData((prev) => ({ ...prev, plateCountry }))}
                onChange={(plate) => setFormData((prev) => ({ ...prev, plate }))}
                error={errorFields.includes('plate')}
              />

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Kayitli Musteri</label>
                <div className="mb-4">
                  <CustomerSearch customers={customers} onSelect={handleCustomerSelect} />
                </div>

                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Musteri Adi Soyadi *</label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(event) => setFormData((prev) => ({ ...prev, customer: event.target.value }))}
                  placeholder="Orn: Ahmet Yilmaz"
                  className={`w-full p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('customer') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Telefon Numarasi *</label>
                <div className="flex">
                  <span className="flex items-center px-4 bg-[var(--bg-main)] border border-[var(--border-strong)] border-r-0 rounded-l-xl text-[var(--text-primary)] text-sm font-medium">+90</span>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(formData.phone)}
                    onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="5XX XXX XXXX"
                    className={`flex-1 p-4 bg-[var(--bg-main)] border rounded-r-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('phone') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Marka / Model Secimi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.brand}
                    onChange={(event) => setFormData((prev) => ({ ...prev, brand: event.target.value, model: '' }))}
                    className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('brand') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                  >
                    <option value="">Marka Secin</option>
                    {Object.keys(carBrands).sort((a, b) => a.localeCompare(b, 'tr')).map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>

                  {formData.brand && formData.brand !== 'Diğer' && formData.brand !== 'Diger' ? (
                    <select
                      value={formData.model}
                      onChange={(event) => setFormData((prev) => ({ ...prev, model: event.target.value }))}
                      className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('model') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                    >
                      <option value="">Model Secin</option>
                      {[...(carBrands[formData.brand] || [])].sort((a, b) => a.localeCompare(b, 'tr')).map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  ) : formData.brand && (
                    <input
                      type="text"
                      value={formData.customModel}
                      onChange={(event) => setFormData((prev) => ({ ...prev, customModel: event.target.value }))}
                      placeholder="Marka Model Yaz"
                      className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('customModel') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                    />
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-[var(--accent)] font-bold text-base mt-8 mb-5 flex items-center gap-2 font-sans">
              <span className="bg-[var(--accent)]/10 p-1.5 rounded text-xs">2.</span> Sikayet Detaylari
            </h3>
            <textarea
              rows="4"
              value={formData.complaint}
              onChange={(event) => setFormData((prev) => ({ ...prev, complaint: event.target.value }))}
              placeholder="Musterinin sikayetini buraya yazin..."
              className={`w-full p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all resize-none ${errorFields.includes('complaint') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
            />
            {error && <p className="text-sm font-bold text-red-400 mt-2 animate-pulse">{error}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-strong)]/30 flex-1 flex flex-col">
            <h3 className="text-[var(--accent)] font-bold text-lg mb-6 flex items-center gap-2 font-sans">
              <span className="bg-[var(--accent)]/10 p-2 rounded text-sm">3.</span> Gorsel Kayit & AI
            </h3>

            <div className="flex-1 border-2 border-dashed border-[var(--border-strong)] rounded-2xl flex flex-col items-center justify-center text-center p-10 group hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => setFormData((prev) => ({ ...prev, photos: Array.from(event.target.files || []) }))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="text-5xl mb-4">+</div>
              <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)] font-sans">Fotograf Ekleyin</h2>
              <p className="text-gray-500 text-sm max-w-60 mx-auto font-sans">Hasar tespiti veya ruhsat okuma icin araci farkli acilardan cekin.</p>

              {formData.photos.length > 0 && (
                <div className="mt-6 p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]">
                  <p className="text-[var(--accent)] font-black text-sm uppercase tracking-widest">{formData.photos.length} dosya secildi</p>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSaving || isLoadingJob}
              className="w-full mt-8 p-6 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-lg shadow-[0_10px_20px_rgba(37,99,235,0.18)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving || isLoadingJob ? 'Kaydediliyor...' : 'Is Emrini Baslat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
