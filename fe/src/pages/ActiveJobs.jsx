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

            <div className="flex gap-4 mb-8 flex-col lg:flex-row">
                <input
                    type="text"
                    value={search}
                    placeholder="Plaka, müşteri veya marka ile ara..."
                    className="flex-1 p-4 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all shadow-lg"
                    onChange={(e) => setSearch(e.target.value)}
                />

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