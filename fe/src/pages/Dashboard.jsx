// src/pages/Dashboard.jsx için konsept tasarım
import React, { useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import StatCard from '../components/StatCard';

export default function Dashboard() {
<<<<<<< Updated upstream
  const { jobs = [], appointments = [], customers = [], vehicles = [], payments = [], syncRemoteData, isBootstrapping } = useService();
=======
  const { jobs = [], appointments = [], payments = [], refreshData, isBootstrapping } = useService();
>>>>>>> Stashed changes
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || isBootstrapping) return;
    setIsRefreshing(true);
    try {
      await refreshData(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const activeJobs = jobs.filter(j => String(j.statusKey || j.status).toUpperCase() !== 'COMPLETED').length;
    const completedJobs = jobs.filter(j => String(j.statusKey || j.status).toUpperCase() === 'COMPLETED').length;
    const pendingApprovals = appointments.filter(a => String(a.statusKey || a.status).toUpperCase() === 'PENDING').length;
    const upcomingAppointments = appointments.filter(a => new Date(a.time) >= new Date()).slice(0,5).length;
    const pendingPayments = payments.filter(p => String(p.status).toUpperCase() === 'PENDING').length;

    return { activeJobs, completedJobs, pendingApprovals, upcomingAppointments, pendingPayments };
  }, [jobs, appointments, payments]);

  const recentJobs = jobs.filter(j => String(j.statusKey || j.status).toUpperCase() !== 'COMPLETED').slice(0, 6);
  const nextAppointments = [...appointments].sort((a, b) => new Date(a.time) - new Date(b.time)).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Atölye Özeti</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Genel durum, aktif işler ve yaklaşan randevular</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isBootstrapping}
            aria-label="Verileri yenile"
            title={isRefreshing || isBootstrapping ? 'Güncelleniyor...' : 'Yenile'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-5 w-5 ${(isRefreshing || isBootstrapping) ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 12a8 8 0 1 1-2.343-5.657"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 4v4h-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Aktif İşler" value={stats.activeJobs} colorClass="border-t-[var(--accent)]" />
        <StatCard title="Tamamlanan" value={stats.completedJobs} colorClass="border-t-green-400" />
        <StatCard title="Bekleyen Onay" value={stats.pendingApprovals} colorClass="border-t-orange-400" />
        <StatCard title="Bekleyen Ödeme" value={stats.pendingPayments} colorClass="border-t-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="col-span-2 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-soft)] shadow-medium">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Aktif İşler</h3>
          {recentJobs.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)] text-center py-8">Henüz kayıtlı işlem yok.</div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">{job.plate}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{job.customer} • {job.brand} {job.complaint || ''}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${String(job.statusKey || job.status).toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{job.statusLabel || job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-soft)] shadow-medium">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Yaklaşan Randevular</h3>
          {nextAppointments.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)] text-center py-8">Yaklaşan randevu yok.</div>
          ) : (
            <div className="space-y-3">
              {nextAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">{apt.plate || apt.customer}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{new Date(apt.time).toLocaleString()} • {apt.service}</div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--accent)]">{apt.statusLabel || apt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}