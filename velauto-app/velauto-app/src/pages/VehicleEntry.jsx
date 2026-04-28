import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import PlateInput from '../components/PlateInput';
import { carBrands } from '../constants/carData';
import { api } from '../api/velautoApi';
import { pushToast } from '../lib/toastBus';

const AI_CONFIDENCE_THRESHOLD = 0.7;

const normalizeForMatch = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getDamageSolutionSuggestion = (label) => {
    const normalized = normalizeForMatch(label);

    if (normalized.includes('cam')) {
        return 'Cam degisimi onerilir.';
    }
    if (normalized.includes('kirik') || normalized.includes('catlak')) {
        return 'Parca degisimi onerilir.';
    }
    if (normalized.includes('gocuk') || normalized.includes('dent')) {
        return 'Kaporta duzeltme ve lokal boya onerilir.';
    }
    if (normalized.includes('cizik') || normalized.includes('scratch')) {
        return 'Yuzey polisaji ve boya onarimi onerilir.';
    }
    if (normalized.includes('far') || normalized.includes('stop') || normalized.includes('lamba')) {
        return 'Aydinlatma parcasi degisimi onerilir.';
    }
    if (normalized.includes('lastik')) {
        return 'Lastik degisimi ve balans kontrolu onerilir.';
    }

    return 'Hasara uygun parca ve onarim islemi icin teknik kontrol onerilir.';
};

const getMultiDamageSolutionSuggestion = (damages) => {
    if (!Array.isArray(damages) || damages.length <= 1) {
        return getDamageSolutionSuggestion(damages?.[0]?.label);
    }

    const sortedLabels = [...new Set(
        damages
            .map((damage) => damage?.label)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'tr'));

    if (sortedLabels.length === 2) {
        return `${sortedLabels[0]} ve ${sortedLabels[1]} icin kapsamli kontrol ve gerekli onarim onerilir.`;
    }

    return 'Birden fazla hasar icin kapsamli kontrol ve gerekli onarim onerilir.';
};

const buildVehicleEntryAiSummary = (damages) => {
    if (!Array.isArray(damages) || damages.length === 0) {
        return [
            'Hasar tespit edilemedi, usta incelemesi onerilir.',
            'Aracin detayli fiziksel kontrolu ve test surusu onerilir.',
            'Usta gorusu ile detaylari girerek devam edin.',
        ].join(' ');
    }

    const allDamagesHighConfidence = damages.every(
        (damage) => Number(damage?.confidence || 0) >= AI_CONFIDENCE_THRESHOLD
    );

    const firstSentence = allDamagesHighConfidence
        ? 'Yukaridaki hasarlar tespit edildi.'
        : 'Yukaridaki hasarlar tespit edildi ancak usta incelemesi onerilir.';

    const secondSentence = getMultiDamageSolutionSuggestion(damages);
    const thirdSentence = 'Sonraki asamada usta gorusu ile detaylari girerek devam edin.';

    return `${firstSentence} ${secondSentence} ${thirdSentence}`;
};

export default function VehicleEntry() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addJob, isValidTurkishPlate } = useService();

    const [formData, setFormData] = useState(() => {
        let initial = {
            province: '34', letters: '', digits: '',
            customer: '', phone: '', brand: '', model: '', customModel: '',
            status: 'IN_PROGRESS', color: 'yellow', complaint: '', photos: []
        };

        if (location.state) {
            if (location.state.plate) {
                const parts = location.state.plate.split(' ');
                if (parts.length === 3) {
                    initial.province = parts[0];
                    initial.letters = parts[1];
                    initial.digits = parts[2];
                }
            }
            if (location.state.customer) initial.customer = location.state.customer;
            if (location.state.phone) initial.phone = location.state.phone;
            if (location.state.service) initial.complaint = location.state.service;
        }
        return initial;
    });

    const [error, setError] = useState('');
    const [errorFields, setErrorFields] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzingDamage, setIsAnalyzingDamage] = useState(false);
    const [detectedDamages, setDetectedDamages] = useState([]);
    const [aiAnalysisReport, setAiAnalysisReport] = useState('');

    const buildPlate = () => `${formData.province} ${formData.letters.toUpperCase()} ${formData.digits}`;

    const formatPhoneDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, ''); // Sadece rakamları tut
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/); // Gruplara ayır
        if (match) {
            return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' '); // Boşlukla birleştir
        }
        return cleaned;
    };

    const isValidTurkishPhone = (phone) => /^\d{10}$/.test(phone.trim());

    const handleDamageAnalysis = async () => {
        if (formData.photos.length === 0) {
            pushToast({ type: 'warning', title: 'Gorsel gerekli', message: 'AI analizi icin en az bir gorsel secin.' });
            return;
        }

        try {
            setIsAnalyzingDamage(true);
            const responses = await Promise.all(
                formData.photos.map((file) => api.ai.analyzeDamage({
                    file,
                    description: formData.complaint || 'Musteri sikayeti belirtilmedi.',
                }))
            );

            const mergedByLabel = new Map();

            responses.forEach((response) => {
                (response?.detected_damages || []).forEach((damage) => {
                    const previous = mergedByLabel.get(damage.label);
                    if (!previous || damage.confidence > previous.confidence) {
                        mergedByLabel.set(damage.label, damage);
                    }
                });
            });

            const mergedDamages = Array.from(mergedByLabel.values());
            setDetectedDamages(mergedDamages);
            setAiAnalysisReport(buildVehicleEntryAiSummary(mergedDamages));
            pushToast({ type: 'success', title: 'AI analiz tamamlandi', message: 'Gorsellerden hasar tespiti yapildi.' });
        } catch (analysisError) {
            pushToast({
                type: 'error',
                title: 'AI analiz hatasi',
                message: analysisError.message || 'AI servisine ulasilamadi.',
            });
        } finally {
            setIsAnalyzingDamage(false);
        }
    };

    const handleSubmit = async () => {
        const errors = [];
        if (!formData.letters || !formData.digits) errors.push('plate');
        if (!formData.customer) errors.push('customer');
        if (!formData.phone) errors.push('phone');
        if (!formData.brand) errors.push('brand');
        else if (formData.brand !== 'Diğer' && !formData.model) errors.push('model');
        else if (formData.brand === 'Diğer' && !formData.customModel.trim()) errors.push('customModel');
        if (!formData.complaint.trim()) errors.push('complaint');

        if (errors.length > 0) {
            setErrorFields(errors);
            setError('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        if (!isValidTurkishPhone(formData.phone)) {
            setError('Telefon formatı hatalı. Örn: 5300000000');
            return;
        }

        const plate = buildPlate();
        if (!isValidTurkishPlate(plate)) {
            setError('Plaka formatı hatalı.');
            return;
        }

        let finalBrand = formData.brand === 'Diğer'
            ? formData.customModel.trim()
            : `${formData.brand} ${formData.model}`;

        try {
            setIsSaving(true);
            await addJob({
                ...formData,
                plate,
                brand: finalBrand,
                total: 0,
                complaint: formData.complaint || 'Belirtilmedi',
                aiDetectedDamages: detectedDamages,
                aiAnalysisReport,
            });

            setError('');
            setErrorFields([]);
            navigate('/active-jobs');
        } catch (submitError) {
            setError(submitError.message || 'İş emri oluşturulamadı.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-3xl font-black mb-8 tracking-tight text-[var(--text-primary)]">Yeni Araç Kabul Formu</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border-strong)]/30">
                        <h3 className="text-[var(--accent)] font-bold text-base mb-5 flex items-center gap-2">
                            <span className="bg-[var(--accent)]/10 p-1.5 rounded text-xs">1.</span> Araç & Müşteri Bilgileri
                        </h3>

                        <div className="space-y-4">
                            <PlateInput
                                province={formData.province}
                                letters={formData.letters}
                                digits={formData.digits}
                                onChange={(field, val) => setFormData(prev => ({ ...prev, [field]: val }))}
                                error={errorFields.includes('plate')}
                            />

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Müşteri Adı Soyadı *</label>
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className={`w-full p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('customer') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Telefon Numarası *</label>
                                <div className="flex">
                                    <span className="flex items-center px-4 bg-[var(--bg-main)] border border-[var(--border-strong)] border-r-0 rounded-l-xl text-[var(--text-primary)] text-sm font-medium">+90</span>
                                    <input
                                        type="tel"
                                        value={formatPhoneDisplay(formData.phone)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        placeholder="5XX XXX XXXX"
                                        className={`flex-1 p-4 bg-[var(--bg-main)] border rounded-r-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('phone') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block font-sans">Marka / Model Seçimi *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={formData.brand}
                                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value, model: '' }))}
                                        className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('brand') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                    >
                                        <option value="">Marka Seçin</option>
                                        {Object.keys(carBrands).sort((a, b) => a === 'Diğer' ? 1 : b === 'Diğer' ? -1 : a.localeCompare(b)).map((brand) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>

                                    {formData.brand && formData.brand !== 'Diğer' ? (
                                        <select
                                            value={formData.model}
                                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                            className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('model') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                        >
                                            <option value="">Model Seçin</option>
                                            {/* Modelleri alıp alfabetik sıralıyoruz */}
                                            {[...(carBrands[formData.brand] || [])].sort((a, b) => a.localeCompare(b, 'tr')).map((model) => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    ) : formData.brand === 'Diğer' && (
                                        <input
                                            type="text"
                                            value={formData.customModel}
                                            onChange={(e) => setFormData(prev => ({ ...prev, customModel: e.target.value }))}
                                            placeholder="Marka Model Yazın"
                                            className={`p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all ${errorFields.includes('customModel') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-[var(--accent)] font-bold text-base mt-8 mb-5 flex items-center gap-2 font-sans">
                            <span className="bg-[var(--accent)]/10 p-1.5 rounded text-xs">2.</span> Şikayet Detayları
                        </h3>
                        <textarea
                            rows="4"
                            value={formData.complaint}
                            onChange={(e) => setFormData(prev => ({ ...prev, complaint: e.target.value }))}
                            placeholder="Müşterinin şikayetini buraya yazın..."
                            className={`w-full p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all resize-none ${errorFields.includes('complaint') ? 'border-red-500' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`}
                        />
                        {error && <p className="text-sm font-bold text-red-400 mt-2 animate-pulse">{error}</p>}
                    </div>
                </div>

                {/* Sağ Taraf: AI Muayene & Fotoğraflar */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-strong)]/30 flex-1 flex flex-col">
                        <h3 className="text-[var(--accent)] font-bold text-lg mb-6 flex items-center gap-2 font-sans">
                            <span className="bg-[var(--accent)]/10 p-2 rounded text-sm">3.</span> Görsel Kayıt & AI
                        </h3>

                        <div className="flex-1 border-2 border-dashed border-[var(--border-strong)] rounded-2xl flex flex-col items-center justify-center text-center p-10 group hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setFormData(prev => ({ ...prev, photos: Array.from(e.target.files) }))}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                            <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)] font-sans">Fotoğraf Ekleyin</h2>
                            <p className="text-gray-500 text-sm max-w-60 mx-auto font-sans">Hasar tespiti veya ruhsat okuma için aracı farklı açılardan çekin.</p>

                            {formData.photos.length > 0 && (
                                <div className="mt-6 p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]">
                                    <p className="text-[var(--accent)] font-black text-sm uppercase tracking-widest">{formData.photos.length} DOSYA SEÇİLDİ</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleDamageAnalysis}
                            disabled={isAnalyzingDamage || formData.photos.length === 0}
                            className="w-full mt-6 p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:border-[var(--accent)] transition-all uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isAnalyzingDamage ? 'AI ANALIZ CALISIYOR...' : 'AI HASAR ANALIZI CALISTIR'}
                        </button>

                        {detectedDamages.length > 0 && (
                            <div className="mt-4 p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] text-left">
                                <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] mb-2">Tespit Edilen Hasarlar</p>
                                <div className="space-y-2">
                                    {detectedDamages.map((item) => (
                                        <div key={item.label} className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                                            <span>{item.label}</span>
                                            <span className="font-bold text-[var(--accent)]">%{Math.round(item.confidence * 100)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {aiAnalysisReport && (
                            <div className="mt-4 p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-main)] text-left">
                                <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] mb-2">AI Teknik Ozet</p>
                                <p className="text-sm whitespace-pre-line text-[var(--text-primary)]">{aiAnalysisReport}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="w-full mt-8 p-6 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-lg shadow-[0_10px_20px_rgba(37,99,235,0.18)] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'KAYDEDİLİYOR...' : 'İş Emrini Başlat'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}