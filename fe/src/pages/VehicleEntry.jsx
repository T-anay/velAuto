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

      <div className="max-w-[1400px] mx-auto px-4 pb-12">
        <div className="flex flex-col gap-6">
          {/* Header Area */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Yeni Arac Kabul</h1>
              <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest mt-1">Servis Kayit Paneli</p>
            </div>
            <BackButton />
          </div>

          <div className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl border border-[var(--border-strong)]/20 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full -mr-64 -mt-64 blur-[100px] pointer-events-none" />
            
            <div className="relative flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-strong)]/20">
              
              {/* Left Column: Form Fields */}
              <div className="lg:w-1/2 p-8 md:p-12 space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-6 bg-[var(--accent)] rounded-full" />
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Araç & Müşteri</h3>
                </div>

                <div className="space-y-6">
                  {/* Plate Input Section */}
                  <div className="bg-[var(--bg-main)]/40 p-6 rounded-3xl border border-[var(--border-strong)]/20">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black mb-4 block">1. Plaka Bilgisi</label>
                    <PlateInput
                      country={formData.plateCountry}
                      value={formData.plate}
                      onCountryChange={(plateCountry) => setFormData((prev) => ({ ...prev, plateCountry }))}
                      onChange={(plate) => setFormData((prev) => ({ ...prev, plate }))}
                      error={errorFields.includes('plate')}
                    />
                  </div>

                  {/* Customer and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black ml-1">Müşteri Seçimi</label>
                      <CustomerSearch customers={customers} onSelect={handleCustomerSelect} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black ml-1">Müşteri Adı Soyadı *</label>
                      <input
                        type="text"
                        value={formData.customer}
                        onChange={(event) => setFormData((prev) => ({ ...prev, customer: event.target.value }))}
                        placeholder="Örn: Ahmet Yılmaz"
                        className={`w-full p-4 bg-[var(--bg-main)] border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold placeholder:text-[var(--text-muted)]/40 ${errorFields.includes('customer') ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-strong)]/50 focus:border-[var(--accent)]'}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black ml-1">İletişim Numarası *</label>
                      <div className="flex">
                        <span className="flex items-center px-4 bg-[var(--bg-main)] border border-[var(--border-strong)]/50 border-r-0 rounded-l-2xl text-[var(--accent)] text-sm font-black">+90</span>
                        <input
                          type="tel"
                          value={formatPhoneDisplay(formData.phone)}
                          onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          placeholder="5XX XXX XX XX"
                          className={`flex-1 p-4 bg-[var(--bg-main)] border rounded-r-2xl text-[var(--text-primary)] outline-none transition-all font-bold ${errorFields.includes('phone') ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-strong)]/50 focus:border-[var(--accent)]'}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black ml-1">Araç Marka / Model *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={formData.brand}
                          onChange={(event) => setFormData((prev) => ({ ...prev, brand: event.target.value, model: '' }))}
                          className={`w-full p-4 bg-[var(--bg-main)] border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold appearance-none cursor-pointer ${errorFields.includes('brand') ? 'border-red-500' : 'border-[var(--border-strong)]/50 focus:border-[var(--accent)]'}`}
                        >
                          <option value="">Marka Seçin</option>
                          {Object.keys(carBrands).sort((a, b) => a.localeCompare(b, 'tr')).map((brand) => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>

                        {formData.brand && formData.brand !== 'Diğer' && formData.brand !== 'Diger' ? (
                          <select
                            value={formData.model}
                            onChange={(event) => setFormData((prev) => ({ ...prev, model: event.target.value }))}
                            className={`w-full p-4 bg-[var(--bg-main)] border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold appearance-none cursor-pointer ${errorFields.includes('model') ? 'border-red-500' : 'border-[var(--border-strong)]/50 focus:border-[var(--accent)]'}`}
                          >
                            <option value="">Model Seçin</option>
                            {[...(carBrands[formData.brand] || [])].sort((a, b) => a.localeCompare(b, 'tr')).map((model) => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                        ) : formData.brand && (
                          <input
                            type="text"
                            value={formData.customModel}
                            onChange={(event) => setFormData((prev) => ({ ...prev, customModel: event.target.value }))}
                            placeholder="Model Yazın"
                            className={`w-full p-4 bg-[var(--bg-main)] border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold ${errorFields.includes('customModel') ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-strong)]/50 focus:border-[var(--accent)]'}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Complaint & Actions */}
              <div className="lg:w-1/2 p-8 md:p-12 bg-[var(--bg-main)]/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-[var(--accent)] rounded-full" />
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Şikayet & Notlar</h3>
                  </div>

                  <div className="relative">
                    <textarea
                      rows="12"
                      value={formData.complaint}
                      onChange={(event) => setFormData((prev) => ({ ...prev, complaint: event.target.value }))}
                      placeholder="Müşterinin araçla ilgili şikayetlerini ve yapılacak işlemleri buraya detaylıca not alabilirsiniz..."
                      className={`w-full p-8 bg-[var(--bg-card)] border rounded-[2rem] text-[var(--text-primary)] outline-none transition-all resize-none font-medium text-lg leading-relaxed shadow-xl ${errorFields.includes('complaint') ? 'border-red-500' : 'border-[var(--border-strong)]/30 focus:border-[var(--accent)]'}`}
                    />
                    
                    {/* Visual Indicators */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-xs font-black text-red-500 text-center uppercase tracking-widest">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-strong)]/20 flex items-center gap-4">
                      <div>
                        <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Hizli Ozet</p>
                        <p className="text-sm font-black text-[var(--text-primary)] truncate max-w-[200px]">
                          {formData.plate || '---'} | {formData.customer || '---'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isSaving || isLoadingJob}
                      className="flex-[2] p-6 bg-[var(--accent)] text-white font-black rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-[0.3em] text-base shadow-[0_10px_30px_rgba(37,99,235,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10"
                    >
                      {isSaving || isLoadingJob ? (
                        <span className="flex items-center gap-2 italic">KAYDEDİLİYOR...</span>
                      ) : (
                        <>
                          KAYDI TAMAMLA
                          <span className="text-2xl">→</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                    * Tüm alanlarin doldurulmasi zorunludur.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
