import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';

import PlateInput from '../components/PlateInput';
import CustomerSearch from '../components/CustomerSearch';
import { carBrands } from '../constants/carData'; // DİKKAT: Bu importun yolu projenizle eşleşmeli
import { validatePlate } from '../constants/plateFormats';

export default function Appointments() {
    const navigate = useNavigate();
    const { appointments, approveAppointment, addAppointment, deleteAppointment, customers, addJob, setAppointmentOverride, getAppointmentStatus, syncRemoteData, refreshData, reviseAppointment } = useService();

    
    useEffect(() => {
        const fetch = syncRemoteData || refreshData;
        if (fetch) fetch();
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

    const formatDateTimeLocal = (date = new Date()) => {
        const value = new Date(date);
        const pad = (number) => String(number).padStart(2, '0');
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
    };

    // State'e brand ve model eklendi
    const [formValues, setFormValues] = useState({
        plateCountry: 'TR', plate: '',
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
    const [reviseModal, setReviseModal] = useState({ isOpen: false, id: null, plate: '', time: formatDateTimeLocal(), notes: '' });
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'name'



    const formatPhoneDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
        return cleaned;
    };

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
        if (!formValues.plate) errors.push('plate');
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

        const plate = formValues.plate;
        if (!validatePlate(plate, formValues.plateCountry)) {
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
                plateCountry: 'TR', plate: '',
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

    const handleRevise = async () => {
        if (!reviseModal.id) return;
        try {
            await reviseAppointment(reviseModal.id, reviseModal.time, reviseModal.notes);
            setReviseModal({ isOpen: false, id: null, plate: '', time: formatDateTimeLocal(), notes: '' });
        } catch (err) {
            setError('Revize işlemi başarısız: ' + err.message);
        }
    };


    const handleOpenJobOrder = async (app) => {
        try {
            await addJob({
                appointmentId: app.id,
                plate: app.plate,
                customer: app.customer,
                phone: app.phone,
                brand: app.brand || '',
                model: app.model || '',
                complaint: app.service || 'Belirtilmedi',
                total: 0,
                status: 'IN_PROGRESS'
            });

            await setAppointmentOverride(app.id, 'CONVERTED');
            navigate('/active-jobs');
        } catch (err) {
            console.error("Job order creation failed:", err);
            setError("İş emri oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
        }
    };

    return (
        <div className="animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            {/* Sayfa Başlığı ve İstatistikler */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] uppercase bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent)] bg-clip-text text-transparent">
                        Takvim & Randevular
                    </h1>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest opacity-80">Atölye Kapasite ve Planlama Yönetimi</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--bg-card)]/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-[var(--border-soft)] shadow-sm">
                        <span className="text-[10px] font-black text-gray-500 block uppercase mb-1">Bekleyen</span>
                        <span className="text-2xl font-black text-[var(--text-primary)]">{appointments.filter(a => getAppointmentStatus(a).status === 'PENDING').length}</span>
                    </div>
                    <div className="bg-[var(--accent)]/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-[var(--accent)]/20 shadow-sm">
                        <span className="text-[10px] font-black text-[var(--accent)] block uppercase mb-1">Onaylı</span>
                        <span className="text-2xl font-black text-[var(--accent)]">{appointments.filter(a => getAppointmentStatus(a).status === 'APPROVED').length}</span>
                    </div>
                </div>
            </div>




            <div className="bg-[var(--bg-card)] backdrop-blur-xl p-8 rounded-[2.5rem] border border-[var(--border-soft)] shadow-2xl mb-12 animate-in slide-in-from-top-6 duration-1000 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-stretch relative z-10">
                    {/* SOL SUTUN: Müşteri */}
                    <div className="space-y-6 flex flex-col">
                        <div className="flex items-center gap-4 border-b border-[var(--border-soft)] pb-4">
                            <span className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-black shadow-lg shadow-[var(--accent)]/20">1</span>
                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Müşteri ve Araç Bilgileri</h3>

                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block opacity-70">Hızlı Müşteri Seçimi</label>
                                <CustomerSearch customers={customers} onSelect={handleCustomerSelect} />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="group space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Ad Soyad *</label>
                                    <input type="text" placeholder="Ahmet Yilmaz" value={formValues.customer} onChange={(e) => setFormValues(prev => ({ ...prev, customer: e.target.value }))} className={`w-full h-14 px-5 bg-[var(--bg-main)]/50 backdrop-blur-sm border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold focus:ring-4 focus:ring-[var(--accent)]/5 ${errorFields.includes('customer') ? 'border-red-500/50' : 'border-[var(--border-soft)] focus:border-[var(--accent)]'}`} />
                                </div>
                                <div className="group space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Telefon *</label>
                                    <div className="flex gap-2 items-stretch h-14">
                                        <div className="bg-[var(--bg-main)]/80 border border-[var(--border-soft)] rounded-2xl px-4 flex items-center justify-center text-gray-500 font-black text-xs tracking-widest">+90</div>
                                        <input type="tel" placeholder="5XX XXX XX XX" value={formatPhoneDisplay(formValues.phone)} onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className={`flex-1 px-5 bg-[var(--bg-main)]/50 backdrop-blur-sm border rounded-2xl text-[var(--text-primary)] outline-none transition-all font-bold focus:ring-4 focus:ring-[var(--accent)]/5 ${errorFields.includes('phone') ? 'border-red-500/50' : 'border-[var(--border-soft)] focus:border-[var(--accent)]'}`} />
                                    </div>
                                </div>
                            </div>
                            
                            <PlateInput country={formValues.plateCountry} value={formValues.plate} onCountryChange={(plateCountry) => setFormValues(prev => ({ ...prev, plateCountry }))} onChange={(plate) => setFormValues(prev => ({ ...prev, plate }))} error={errorFields.includes('plate')} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="group space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Marka</label>
                                    <select
                                        value={formValues.brand}
                                        onChange={(e) => setFormValues(prev => ({ ...prev, brand: e.target.value, model: '' }))}
                                        className={`w-full h-14 px-5 bg-[var(--bg-main)]/50 border rounded-2xl text-[var(--text-primary)] outline-none appearance-none font-bold ${errorFields.includes('brand') ? 'border-red-500/50' : 'border-[var(--border-soft)] focus:border-[var(--accent)]'}`}
                                    >
                                        <option value="">Marka Seçin</option>
                                        {Object.keys(carBrands || {}).sort().map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="group space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Model</label>
                                    <select
                                        value={formValues.model}
                                        onChange={(e) => setFormValues(prev => ({ ...prev, model: e.target.value }))}
                                        disabled={!formValues.brand}
                                        className="w-full h-14 px-5 bg-[var(--bg-main)]/50 border border-[var(--border-soft)] rounded-2xl text-[var(--text-primary)] outline-none appearance-none font-bold disabled:opacity-30 focus:border-[var(--accent)]"
                                    >
                                        <option value="">Model Seçin</option>
                                        {formValues.brand && carBrands[formValues.brand]?.sort().map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAG SUTUN: Planlama */}
                    <div className="space-y-6 flex flex-col">
                        <div className="flex items-center gap-4 border-b border-[var(--border-soft)] pb-4">
                            <span className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-black shadow-lg shadow-[var(--accent)]/20">2</span>
                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Randevu Planlaması</h3>

                        </div>
                        
                        <div className="space-y-6 flex-1">
                            <div className="group space-y-2">
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Tarih ve Saat *</label>
                                <input type="datetime-local" min={now} value={formValues.time} onChange={(e) => setFormValues(prev => ({ ...prev, time: e.target.value }))} className={`w-full h-14 px-5 bg-white border rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-[var(--accent)]/5 transition-all outline-none ${errorFields.includes('time') ? 'border-red-500/50' : 'border-slate-200 focus:border-[var(--accent)]'}`} />
                            </div>
                            <div className="group space-y-2">
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1 block opacity-70">Yapılacak İşlem / Şikayet *</label>
                                <textarea placeholder="Örn: Periyodik Bakım, Fren Kontrolü..." value={formValues.service} onChange={(e) => setFormValues(prev => ({ ...prev, service: e.target.value }))} className={`w-full p-5 bg-[var(--bg-main)]/50 backdrop-blur-sm border rounded-2xl text-[var(--text-primary)] font-bold outline-none h-32 resize-none focus:ring-4 focus:ring-[var(--accent)]/5 transition-all ${errorFields.includes('service') ? 'border-red-500/50' : 'border-[var(--border-soft)] focus:border-[var(--accent)]'}`} />
                            </div>
                        </div>

                        <div className="pt-6">
                            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4 flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">⚠️ {error}</div>}
                            <button onClick={handleSubmit} disabled={isSaving} className="w-full h-16 bg-gradient-to-r from-[var(--accent)] to-teal-500 text-white font-black rounded-2xl hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-[var(--accent)]/20 uppercase tracking-[0.2em] text-sm disabled:opacity-50">
                                {isSaving ? 'Kaydediliyor...' : 'Randevuyu Onayla ve Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            <div className="bg-[var(--bg-card)]/40 backdrop-blur-md p-6 rounded-3xl border border-[var(--border-soft)] mb-10 group transition-all duration-500 hover:shadow-2xl relative z-30">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="w-6 h-6 text-gray-500 group-focus-within:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Plaka, İsim veya Marka ile hızlı ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-14 pr-12 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-[1.25rem] text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all font-bold placeholder:text-gray-500 shadow-inner"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-500 hover:text-[var(--accent)] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Arama Sonuçları Dropdown */}
                        {search && (
                            <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                {(appointments || [])
                                    .filter(app => app && getAppointmentStatus(app).status !== 'CONVERTED')
                                    .filter(app => 
                                        (app.plate || '').toLowerCase().includes(search.toLowerCase()) || 
                                        (app.customer || '').toLowerCase().includes(search.toLowerCase()) ||
                                        (app.brand || '').toLowerCase().includes(search.toLowerCase())
                                    ).length > 0 ? (
                                        <ul className="py-2">
                                            {(appointments || [])
                                                .filter(app => app && getAppointmentStatus(app).status !== 'CONVERTED')
                                                .filter(app => 
                                                    (app.plate || '').toLowerCase().includes(search.toLowerCase()) || 
                                                    (app.customer || '').toLowerCase().includes(search.toLowerCase()) ||
                                                    (app.brand || '').toLowerCase().includes(search.toLowerCase())
                                                )
                                                .map(app => (
                                                    <li 
                                                        key={app.id} 
                                                        onClick={() => setSearch(app.plate)}
                                                        className="px-6 py-4 hover:bg-[var(--accent)]/10 cursor-pointer transition-all border-b border-[var(--border-soft)]/30 last:border-0 flex items-center justify-between group/item"
                                                    >
                                                        <div>
                                                            <p className="text-[var(--text-primary)] font-black text-sm group-hover/item:text-[var(--accent)]">{app.plate}</p>
                                                            <p className="text-xs text-gray-500 font-bold mt-0.5">{app.customer} • {app.brand}</p>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 bg-gray-500/10 px-2 py-1 rounded uppercase tracking-widest">{formatDateTime(app.time).split(' ')[0]}</span>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    ) : (
                                        <div className="px-6 py-8 text-center text-gray-500 text-sm font-bold">Eşleşen randevu bulunamadı.</div>
                                    )
                                }
                            </div>
                        )}
                    </div>


                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full h-16 px-6 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-[1.25rem] text-sm font-black text-[var(--text-primary)] outline-none appearance-none cursor-pointer hover:border-[var(--accent)] transition-all shadow-inner"
                            >
                                <option value="date">Tarihe Göre</option>
                                <option value="name">İsime Göre</option>

                            </select>
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</span>
                        </div>
                        <div className="h-16 px-8 bg-[var(--accent)] text-white rounded-[1.25rem] flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 font-black text-xs uppercase tracking-[0.1em]">
                            <span className="opacity-70">Toplam:</span>
                            <span className="text-lg">{appointments.length}</span>
                        </div>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(appointments || [])
                    .map(app => app ? ({ ...app, _status: getAppointmentStatus(app)?.status || 'PENDING' }) : null)
                    .filter(app => app && app._status !== 'CONVERTED')
                    .filter(app => 
                        (app.plate || '').toLowerCase().includes(search.toLowerCase()) || 
                        (app.customer || '').toLowerCase().includes(search.toLowerCase()) ||
                        (app.brand || '').toLowerCase().includes(search.toLowerCase())
                    )
                    .sort((a, b) => {
                        if (sortBy === 'date') return new Date(a.time) - new Date(b.time);
                        return (a.customer || '').localeCompare(b.customer || '');
                    })
                    .map((app) => {
                        const isApproved = app.statusKey === 'APPROVED';
                        const isOverdue = new Date(app.time) < new Date() && app._status === 'PENDING';
                        return (

                            <div key={app.id} className={`group relative p-6 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-xl overflow-hidden ${isOverdue ? 'bg-red-500/10 border-red-500/30 ring-4 ring-red-500/5' : isApproved ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--bg-card)]/60 backdrop-blur-md border-[var(--border-soft)] hover:bg-[var(--bg-card)]'}`}>

                                {isOverdue && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />}
                                
                                <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-500/10 px-2 py-1 rounded-md">{formatDateTime(app.time).split(' ')[0]}</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-md">{formatDateTime(app.time).split(' ')[1]}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mt-2 group-hover:text-[var(--accent)] transition-colors">{app.plate}</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm ${app.color === 'green' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : app.color === 'amber' ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>{app.statusLabel || app.status}</span>
                                        {(app.createdBy === null || app.createdBy === 0) && (
                                            <span className="bg-blue-600/10 text-blue-500 border border-blue-600/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-bounce-subtle">Web Talebi</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 p-4 bg-[var(--bg-main)]/40 rounded-2xl relative z-10 border border-[var(--border-soft)]/50">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[var(--text-primary)] font-black text-sm">{app.customer}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-500 font-bold text-[11px] leading-relaxed uppercase tracking-tight line-clamp-2">{app.service}</p>
                                    </div>
                                </div>


                                <div className="flex gap-2 relative z-10">
                                    {app.statusKey === 'PENDING' ? (
                                        <button onClick={() => approveAppointment(app.id)} className="flex-1 h-12 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--accent)]/10">ONAYLA</button>
                                    ) : (
                                        <button onClick={() => handleOpenJobOrder(app)} className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">İŞ EMRİ AÇ</button>
                                    )}

                                    <button onClick={() => setReviseModal({ isOpen: true, id: app.id, plate: app.plate, time: app.time, notes: '' })} className="px-4 h-12 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-600 font-black rounded-xl hover:bg-amber-500 hover:text-white transition-all text-[10px] uppercase tracking-widest" title="Revize Et">REVİZE ET</button>
                                    <button onClick={() => setDeleteModal({ isOpen: true, id: app.id, plate: app.plate })} className="px-4 h-12 flex items-center justify-center bg-red-500 border border-red-600 text-white font-black rounded-xl hover:bg-red-600 transition-all text-[10px] uppercase tracking-widest" title="Sil">SİL</button>
                                </div>

                                
                                <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-2 ${app.color === 'green' ? 'bg-[var(--success)] w-full' : app.color === 'amber' ? 'bg-[var(--accent)] w-full' : 'bg-[var(--danger)] w-full'}`} />
                            </div>
                        );
                    })}
                {(appointments || []).filter(app => app && getAppointmentStatus(app).status !== 'CONVERTED').length === 0 && (
                    <div className="col-span-full text-center py-20 bg-[var(--bg-card)]/30 rounded-3xl border border-dashed border-[var(--border-soft)]">
                        <p className="text-gray-500 font-medium">Henüz kayıtlı bir randevu bulunmuyor.</p>
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

            {/* Revize Modali */}
            {reviseModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl border border-[var(--border-strong)] w-full max-w-md text-left animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">Randevu Revize</h3>
                                <p className="text-gray-400 text-xs mt-1">{reviseModal.plate} plakalı araç için tarih güncelleme</p>
                            </div>
                            <button onClick={() => setReviseModal({ ...reviseModal, isOpen: false })} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Yeni Tarih & Saat</label>
                                <input
                                    type="datetime-local"
                                    value={reviseModal.time}
                                    onChange={(e) => setReviseModal({ ...reviseModal, time: e.target.value })}
                                    className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Revize Notu</label>
                                <textarea
                                    value={reviseModal.notes}
                                    onChange={(e) => setReviseModal({ ...reviseModal, notes: e.target.value })}
                                    placeholder="Revize sebebi veya müşteri talebi..."
                                    className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setReviseModal({ ...reviseModal, isOpen: false })} className="flex-1 p-4 bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-strong)] transition-all uppercase tracking-widest text-xs">VAZGEÇ</button>
                            <button onClick={handleRevise} className="flex-1 p-4 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-xs">REVİZE ET</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}