import React, { useState } from 'react';
import { useService } from '../context/ServiceContext';
import { useNavigate } from 'react-router-dom';

export default function ActiveJobs() {
    const { jobs, deleteJob } = useService();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, plate: '' });

    const confirmDelete = async () => {
        if (deleteModal.id) {
            try {
                await deleteJob(deleteModal.id);
            } catch (err) {
                console.error('Silme hatası:', err);
            }
            setDeleteModal({ isOpen: false, id: null, plate: '' });
        }
    };

    const filteredJobs = (jobs || [])
        .filter(job => job.status !== 'COMPLETED')
        .filter(job =>
            (job.plate || '').toLowerCase().includes(search.toLowerCase()) ||
            (job.customer || '').toLowerCase().includes(search.toLowerCase()) ||
            (job.brand || '').toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black mb-8 tracking-tight">Aktif İşler & Araçlar</h1>

            <div className="relative mb-10 group z-30">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-gray-500 group-focus-within:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={search}
                    placeholder="Plaka, müşteri veya marka ile hızlı ara..."
                    className="w-full h-16 pl-14 pr-12 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all font-bold shadow-xl"
                    onChange={(e) => setSearch(e.target.value)}
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

                {/* Dropdown Sonuçları */}
                {search && (
                    <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        {filteredJobs.length > 0 ? (
                            <ul className="py-2">
                                {filteredJobs.map(job => (
                                    <li 
                                        key={job.id} 
                                        onClick={() => setSearch(job.plate)}
                                        className="px-6 py-4 hover:bg-[var(--accent)]/10 cursor-pointer transition-all border-b border-[var(--border-strong)]/30 last:border-0 flex items-center justify-between group/item"
                                    >
                                        <div>
                                            <p className="text-[var(--text-primary)] font-black text-sm group-hover/item:text-[var(--accent)]">{job.plate}</p>
                                            <p className="text-xs text-gray-500 font-bold mt-0.5">{job.customer} • {job.brand}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[9px] font-black border ${job.color === 'green' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]' : 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]'}`}>
                                            {job.statusLabel || job.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-6 py-8 text-center text-gray-500 text-sm font-bold">Eşleşen iş bulunamadı.</div>
                        )}
                    </div>
                )}
            </div>


            {filteredJobs.length === 0 ? (
                <div className="text-center p-16 text-gray-400">Aradığınız kriterlere uygun aktif iş bulunamadı.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredJobs.map((job) => {
                        const getBorderColor = (color) => {
                            if (color === 'green') return 'border-[var(--success)]';
                            if (color === 'orange') return 'border-orange-500';
                            if (color === 'amber') return 'border-amber-500';
                            if (color === 'blue') return 'border-blue-500';
                            return 'border-[var(--accent)]';
                        };
                        const getBadgeColors = (color) => {
                            if (color === 'green') return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]';
                            if (color === 'orange') return 'bg-orange-100 text-orange-700 border-orange-500';
                            if (color === 'amber') return 'bg-amber-100 text-amber-700 border-amber-500';
                            if (color === 'blue') return 'bg-blue-100 text-blue-700 border-blue-500';
                            return 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]';
                        };
                        return (
                            <div
                                key={job.id}
                                className={`bg-[var(--bg-card)] p-6 rounded-2xl border-t-4 hover:scale-[1.02] transition-all shadow-xl cursor-pointer ${getBorderColor(job.color)}`}
                                onClick={() => navigate(`/job-detail/${job.id}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-2xl font-black">{job.plate}</h2>
                                    <span className={`px-3 py-1 rounded text-[10px] font-black border ${getBadgeColors(job.color)}`}>
                                        {job.statusLabel || job.status}
                                    </span>
                                </div>
                                <p className="text-gray-400 font-semibold text-sm mb-2">{job.customer} • <span className="text-gray-600 text-xs">{job.brand}</span></p>

                                <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border-strong)]/30">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setDeleteModal({ isOpen: true, id: job.id, plate: job.plate }); 
                                        }} 
                                        className="flex-1 text-xs text-[var(--danger)] border border-[var(--danger)]/30 px-3 py-2 rounded-lg uppercase font-black hover:bg-[var(--danger)] hover:text-[var(--text-primary)] transition-colors tracking-widest"
                                    >
                                        SİL
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Silme Onay Pop-up Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl border border-[var(--border-strong)] w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-4 border border-[var(--danger)]/30">
                            <span className="text-[var(--danger)] font-black text-3xl">!</span>
                        </div>
                        <h3 className="text-xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-widest">İŞ SİLİNİYOR</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            <span className="text-[var(--accent)] font-bold">{deleteModal.plate}</span> plakalı işi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDeleteModal({ isOpen: false, id: null, plate: '' })} 
                                className="flex-1 p-4 bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-strong)] transition-all uppercase tracking-widest text-xs"
                            >
                                İPTAL
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="flex-1 p-4 bg-[var(--danger)] text-[var(--text-primary)] font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-xs"
                            >
                                EVET, SİL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}