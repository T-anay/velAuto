import React, { useState } from 'react';
import { useService } from '../context/ServiceContext';

export default function Musteriler() {
    const { customers, addCustomer, deleteCustomer } = useService();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Ozel Silme Modali Icin State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [error, setError] = useState('');
    const [errorFields, setErrorFields] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const filteredMusteriler = customers.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
    );

    const formatPhoneDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
        return cleaned;
    };

    const handleAddCustomer = async () => {
        const errors = [];
        if (!formData.name.trim()) errors.push('name');
        if (!formData.phone.trim() || formData.phone.length < 10) errors.push('phone');

        if (errors.length > 0) {
            setErrorFields(errors);
            setError('Lutfen isaretli tum alanlari dogru doldurun.');
            return;
        }

        const duplicateExists = customers.some(c =>
            c.name?.toLowerCase() === formData.name.trim().toLowerCase() &&
            String(c.phone || '').replace(/\D/g, '') === String(formData.phone || '').replace(/\D/g, '')
        );

        if (duplicateExists) {
            setErrorFields(['name', 'phone']);
            setError('Bu isim ve telefon numarası ile kayıtlı bir müşteri zaten var.');
            return;
        }

        try {
            setIsSaving(true);
            await addCustomer({ name: formData.name, phone: formData.phone, plate: '' });
            closeModal();
        } catch (saveError) {
            setError(saveError.message || 'Müşteri kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setFormData({ name: '', phone: '' });
        setError('');
        setErrorFields([]);
        setShowAddModal(false);
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            deleteCustomer(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] uppercase">Müşteriler</h1>
                <button onClick={() => setShowAddModal(true)} className="bg-[var(--border-strong)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-bold hover:bg-opacity-80 transition-all text-sm uppercase tracking-widest shadow-lg">YENI MUSTERI EKLE</button>
            </div>

            <div className="relative mb-8">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black tracking-widest text-sm">ARA</div>
                <input type="text" placeholder="Isim ve Telefon ile arayinız" className="w-full p-4 pl-20 bg-[var(--bg-card)] border border-[var(--border-strong)]/50 rounded-xl text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all shadow-lg placeholder:text-gray-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMusteriler.length > 0 ? (
                    filteredMusteriler.map((m) => (
                        <div key={m.id} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-strong)]/30 hover:border-[var(--accent)]/50 transition-all group shadow-xl flex flex-col">
                            <h2 className="text-xl font-black mb-2 group-hover:text-[var(--accent)] transition-colors text-[var(--text-primary)]">{m.name}</h2>
                            <p className="text-[var(--accent)] text-lg font-bold mb-4 tracking-wider">{formatPhoneDisplay(m.phone)}</p>

                            <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-[var(--border-strong)]/30">

                                <button onClick={() => setDeleteModal({ isOpen: true, id: m.id, name: m.name })} className="w-full text-xs text-[var(--danger)] border border-[var(--danger)]/30 px-3 py-2 rounded-lg uppercase font-black hover:bg-[var(--danger)] hover:text-[var(--text-primary)] transition-colors tracking-widest">SIL</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-[var(--bg-card)]/30 rounded-3xl border border-dashed border-[var(--border-strong)]">
                        <p className="text-gray-500 font-medium">Aradiginiz kriterlere uygun musteri bulunamadi.</p>
                    </div>
                )}
            </div>

            {/* Yeni Musteri Ekleme Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl border border-[var(--border-strong)] w-full max-w-lg animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-black mb-6 text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border-strong)]/30 pb-4">Yeni Musteri Kaydi</h3>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider font-sans">Musteri Ad Soyad *</label>
                                <input type="text" placeholder="Orn: Ahmet Yilmaz" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder:text-gray-700 font-sans ${errorFields.includes('name') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 tracking-wider font-sans">Telefon Numarasi *</label>
                                <div className="flex gap-2">
                                    <div className="bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl p-4 text-gray-500 font-bold text-sm flex items-center justify-center min-w-15 font-sans">+90</div>
                                    <input type="tel" placeholder="5XX XXX XX XX" value={formatPhoneDisplay(formData.phone)} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={`flex-1 p-4 bg-[var(--bg-main)] border rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder:text-gray-700 font-sans ${errorFields.includes('phone') ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.1)]' : 'border-[var(--border-strong)] focus:border-[var(--accent)]'}`} />
                                </div>
                            </div>
                            {error && <p className="text-xs font-bold text-red-400 mt-2 animate-pulse">{error}</p>}
                        </div>
                        <div className="flex gap-4 mt-8 pt-6 border-t border-[var(--border-strong)]/30">
                            <button onClick={closeModal} className="flex-1 p-4 bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-strong)] transition-all uppercase tracking-widest text-sm">IPTAL</button>
                            <button onClick={handleAddCustomer} disabled={isSaving} className="flex-1 p-4 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? 'KAYDEDİLİYOR...' : 'KAYDET'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ozel Silme Onay Pop-up'i (Modal) */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl border border-[var(--border-strong)] w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-4 border border-[var(--danger)]/30">
                            <span className="text-[var(--danger)] font-black text-3xl">!</span>
                        </div>
                        <h3 className="text-xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-widest">KAYIT SILINIYOR</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            <span className="text-[var(--accent)] font-bold">{deleteModal.name}</span> isimli musteriyi silmek istediginize emin misiniz? Bu islem geri alinamaz.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} className="flex-1 p-4 bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-strong)] transition-all uppercase tracking-widest text-xs">IPTAL</button>
                            <button onClick={confirmDelete} className="flex-1 p-4 bg-[var(--danger)] text-[var(--text-primary)] font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-xs">EVET, SIL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}