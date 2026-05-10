import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import PlateInput from '../components/PlateInput';
import { carBrands } from '../constants/carData'; // DİKKAT: Bu importun yolu projenizle eşleşmeli

export default function Appointments() {
    const navigate = useNavigate();
<<<<<<< Updated upstream
    const { appointments, approveAppointment, addAppointment, deleteAppointment, isValidTurkishPlate } = useService();
=======
    const { appointments, approveAppointment, addAppointment, deleteAppointment, customers, addJob, setAppointmentOverride, getAppointmentStatus, refreshData, reviseAppointment } = useService();

    
    useEffect(() => {
        if (refreshData) refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 




    const handleCustomerSelect = (selected) => {
        if (!selected) return;
        setFormValues(prev => ({
            ...prev,
            customer: selected.fullName || selected.name || '',
            phone: String(selected.phone || '').replace(/\D/g, '').slice(-10),
            plate: selected.plate || prev.plate,
        }));
    };
>>>>>>> Stashed changes

    const formatDateTimeLocal = (date = new Date()) => {
        const value = new Date(date);
        const pad = (number) => String(number).padStart(2, '0');
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
    };

    // State'e brand ve model eklendi
    const [formValues, setFormValues] = useState({
        province: '34', letters: '', digits: '', 
        customer: '', phone: '', service: '', 
        brand: '', model: '', // YENİ
        time: formatDateTimeLocal()
    });

    const now = formatDateTimeLocal();
    const [error, setError] = useState('');
    const [errorFields, setErrorFields] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Ozel Silme Modali Icin State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, plate: '' });

    const formatPhoneDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
        return cleaned;
    };

    const buildPlate = () => `${formValues.province} ${formValues.letters.toUpperCase()} ${formValues.digits}`;

    const formatDateTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return isNaN(date.getTime()) ? dateTimeString : date.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch { return dateTimeString; }
    };

    const handleSubmit = async () => {
        const errors = [];
        const currentTime = new Date();
        const selectedDate = new Date(formValues.time);

        if (!formValues.customer.trim()) errors.push('customer');
        if (!formValues.phone.trim() || formValues.phone.length < 10) errors.push('phone');
        if (!formValues.letters || !formValues.digits) errors.push('plate');
        if (!formValues.service.trim()) errors.push('service');
        if (!formValues.time) errors.push('time');

        const brandMissing = !formValues.brand.trim();
        const modelMissing = !brandMissing && formValues.brand !== 'Diğer' && !formValues.model.trim();

        if (brandMissing) {
            errors.push('brand', 'model');
        } else if (modelMissing) {
            errors.push('model');
        }

        if (errors.length > 0) {
            setErrorFields(errors);
            if (errors.some((field) => ['customer', 'phone', 'plate', 'service', 'time'].includes(field))) {
                setError('Lutfen isaretli tum alanlari dogru doldurun.');
            } else {
                setError('');
            }
            return;
        }

        if (selectedDate < currentTime) {
            setErrorFields(['time']);
            setError('Gecmis bir tarihe randevu olusturamazsiniz.');
            return;
        }

        const plate = buildPlate();
        if (!isValidTurkishPlate(plate)) {
            setErrorFields(['plate']);
            setError('Plaka formati hatali.');
            return;
        }

        try {
            setIsSaving(true);
            await addAppointment({
                plate,
                service: formValues.service,
                time: formValues.time,
                customer: formValues.customer,
                phone: formValues.phone,
                brand: formValues.brand, // YENİ: Backend'e gönderiliyor
                model: formValues.model  // YENİ: Backend'e gönderiliyor
            });

            // Formu sıfırla
            setFormValues({ 
                province: '34', letters: '', digits: '', 
                customer: '', phone: '', service: '', 
                brand: '', model: '',
                time: formatDateTimeLocal() 
            });
            setError('');
            setErrorFields([]);
        } catch (saveError) {
            setError(saveError.message || 'Randevu kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            deleteAppointment(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null, plate: '' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] uppercase">Takvim ve Randevular</h1>
                <div className="flex gap-4">
                    <div className="bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-bold text-gray-400">
                        Toplam: {appointments.length} Kayit
                    </div>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl border border-[var(--border-strong)]/30 shadow-2xl mb-8 animate-in slide-in-from-top-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch">
                    {/* SOL SUTUN */}
                    <div className="space-y-5 h-full rounded-2xl border border-[var(--border-strong)]/20 bg-[var(--bg-main)]/35 p-5 md:p-6 flex flex-col">
                        <h3 className="text-[var(--accent)] font-bold text-lg flex items-center gap-2 border-b border-[var(--border-strong)]/30 pb-3">
                            <span className="bg-[var(--accent)]/10 px-3 py-1 rounded-lg text-sm font-black">1</span> Musteri ve Arac Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider font-sans">Musteri Ad Soyad *</label>
                                <input type="text" placeholder="Ahmet Yilmaz" value={formValues.customer} onChange={(e) => setFormValues(prev => ({ ...prev, customer: e.target.value }))} className={`w-full min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder:text-gray-700 font-sans ${errorFields.includes('customer') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider font-sans">Telefon Numarasi *</label>
                                <div className="flex gap-2 items-stretch">
                                    <div className="bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl px-4 min-w-[72px] min-h-[56px] text-gray-500 font-bold text-sm flex items-center justify-center font-sans">+90</div>
                                    <input type="tel" placeholder="5XX XXX XX XX" value={formatPhoneDisplay(formValues.phone)} onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className={`flex-1 min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder:text-gray-700 font-sans ${errorFields.includes('phone') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`} />
                                </div>
                            </div>
                        </div>
                        <PlateInput province={formValues.province} letters={formValues.letters} digits={formValues.digits} onChange={(field, val) => setFormValues(prev => ({ ...prev, [field]: val }))} error={errorFields.includes('plate')} />

                        {/* YENİ: Marka Model Seçimi */}
                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider font-sans mb-1 block">Marka / Model Seçimi</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <select
                                        value={formValues.brand}
                                        onChange={(e) => {
                                            const nextBrand = e.target.value;
                                            setFormValues((prev) => ({ ...prev, brand: nextBrand, model: '' }));
                                            setErrorFields((prev) => prev.filter((field) => field !== 'brand' && field !== 'model'));
                                            if (error) setError('');
                                        }}
                                        className={`w-full min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all font-sans text-sm ${errorFields.includes('brand') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                    >
                                        <option value="">Marka Seçin</option>
                                        {Object.keys(carBrands || {}).sort((a, b) => a === 'Diğer' ? 1 : b === 'Diğer' ? -1 : a.localeCompare(b)).map((brand) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                    {errorFields.includes('brand') && <p className="text-[11px] font-bold text-red-400 ml-1">Seçim yapmadınız.</p>}
                                     
                                </div>

                                <div className="space-y-1">
                                    <select
                                        value={formValues.model}
                                        onChange={(e) => {
                                            setFormValues((prev) => ({ ...prev, model: e.target.value }));
                                            setErrorFields((prev) => prev.filter((field) => field !== 'model'));
                                            if (error) setError('');
                                        }}
                                        disabled={!formValues.brand || formValues.brand === 'Diğer'}
                                        className={`w-full min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all disabled:opacity-50 font-sans text-sm ${errorFields.includes('model') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                    >
                                        <option value="">Model Seçin</option>
                                        {formValues.brand && carBrands[formValues.brand] && [...carBrands[formValues.brand]].sort((a, b) => a.localeCompare(b, 'tr')).map((model) => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    {errorFields.includes('model') && <p className="text-[11px] font-bold text-red-400 ml-1">Seçim yapmadınız.</p>}
                                     
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAG SUTUN */}
                    <div className="space-y-5 h-full rounded-2xl border border-[var(--border-strong)]/20 bg-[var(--bg-main)]/35 p-5 md:p-6 flex flex-col">
                        <h3 className="text-[var(--accent)] font-bold text-lg flex items-center gap-2 border-b border-[var(--border-strong)]/30 pb-3">
                            <span className="bg-[var(--accent)]/10 px-3 py-1 rounded-lg text-sm font-black">2</span> Randevu Planlamasi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider">Tarih ve Saat *</label>
                                <input type="datetime-local" min={now} value={formValues.time} onChange={(e) => setFormValues(prev => ({ ...prev, time: e.target.value }))} className={`w-full min-h-[56px] p-4 bg-white border rounded-xl text-slate-800 focus:border-[var(--accent)] outline-none transition-all ${errorFields.includes('time') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-slate-200'}`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider">Yapilacak Islem *</label>
                                <input type="text" placeholder="Orn: Yag Degisimi" value={formValues.service} onChange={(e) => setFormValues(prev => ({ ...prev, service: e.target.value }))} className={`w-full min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-gray-700 ${errorFields.includes('service') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)]'}`} />
                            </div>
                        </div>
                        <div className="mt-auto pt-4">
                            {error && <p className="text-xs font-bold text-red-400 mb-4 animate-pulse">{error}</p>}
                            <button onClick={handleSubmit} disabled={isSaving} className="w-full p-5 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(37,99,235,0.18)] uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? 'KAYDEDİLİYOR...' : 'Randevuyu Takvime Ekle'}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {appointments.length > 0 ? appointments.map((app) => (
                    <div key={app.id} className={`group p-5 rounded-2xl bg-[var(--bg-card)] border-l-8 transition-all hover:scale-[1.02] shadow-xl ${app.type === 'green' ? 'border-[var(--success)]' : 'border-[var(--danger)]'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1 opacity-70">{formatDateTime(app.time)}</span>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{app.plate}</h3>
                            </div>
                            <span className={`px-2 py-1 rounded text-[9px] font-black border uppercase tracking-tighter ${app.type === 'green' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]'}`}>{app.status}</span>
                        </div>
                        <div className="space-y-1 mb-4">
                            <p className="text-gray-300 font-semibold text-sm">{app.customer}</p>
                            <p className="text-gray-500 text-xs">{app.service}</p>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-strong)]/30">
                            {app.status === 'ONAY BEKLİYOR' ? (
                                <button onClick={() => approveAppointment(app.id)} className="flex-1 py-2 bg-[var(--accent)] text-white font-black rounded-lg hover:brightness-110 transition-all text-xs uppercase tracking-widest shadow-md">ONAYLA</button>
                            ) : (
                                <button onClick={() => { deleteAppointment(app.id); navigate('/vehicle-entry', { state: { plate: app.plate, licensePlate: app.plate, service: app.service, customer: app.customer, phone: app.phone, brand: app.brand || '', model: app.model || '' } }); }} className="flex-1 py-2 bg-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-lg hover:bg-[var(--accent)] hover:text-white transition-all text-xs uppercase tracking-widest shadow-md">IS EMRI AC</button>
                            )}
                            <button onClick={() => setDeleteModal({ isOpen: true, id: app.id, plate: app.plate })} className="px-4 py-2 bg-transparent border border-[var(--danger)]/50 text-[var(--danger)] font-black rounded-lg hover:bg-[var(--danger)] hover:text-[var(--text-primary)] transition-all text-xs uppercase tracking-widest">SIL</button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-20 bg-[var(--bg-card)]/30 rounded-3xl border border-dashed border-[var(--border-strong)]">
                        <p className="text-gray-500 font-medium">Henuz kayitli bir randevu bulunmuyor.</p>
                    </div>
                )}
            </div>

            {/* Ozel Silme Onay Pop-up'i (Modal) */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl border border-[var(--border-strong)] w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-4 border border-[var(--danger)]/30">
                            <span className="text-[var(--danger)] font-black text-3xl">!</span>
                        </div>
                        <h3 className="text-xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-widest">KAYIT SILINIYOR</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            <span className="text-[var(--accent)] font-bold">{deleteModal.plate}</span> plakali randevuyu silmek istediginize emin misiniz? Bu islem geri alinamaz.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteModal({ isOpen: false, id: null, plate: '' })} className="flex-1 p-4 bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-strong)] transition-all uppercase tracking-widest text-xs">IPTAL</button>
                            <button onClick={confirmDelete} className="flex-1 p-4 bg-[var(--danger)] text-[var(--text-primary)] font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-xs">EVET, SIL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}