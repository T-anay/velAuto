import React, { useState } from 'react';
import { useService } from '../context/ServiceContext';
import { useNavigate } from 'react-router-dom';

export default function ActiveJobs() {
    const { jobs, updateJob } = useService();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

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


                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}