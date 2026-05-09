import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useMemo } from 'react';

const menuItems = [
  { path: '/dashboard', label: ' Atölye Özeti' },
  { path: '/vehicle-entry', label: ' Yeni Araç Kabul' },
  { path: '/active-jobs', label: ' Aktif İşler' },
  { path: '/appointments', label: ' Takvim' },
  { path: '/customers', label: ' Müşteriler' },


  { path: '/bildirimler', label: ' Bildirimler' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, jobs = [], payments = [], appointments = [] } = useService();

  const { isDark, toggleTheme } = useTheme();

  const [readStateVersion, setReadStateVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setReadStateVersion(v => v + 1);
    window.addEventListener('velauto_notifications_updated', handleUpdate);
    return () => window.removeEventListener('velauto_notifications_updated', handleUpdate);
  }, []);

  const unreadCount = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    readStateVersion;

    try {
      const raw = localStorage.getItem('velauto_notifications_state_v1');
      const readState = raw ? JSON.parse(raw) : {};

      let count = 0;
      if (!readState['stock-1']) count++;
      if (!readState['stock-2']) count++;

      const completedJobs = jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() === 'COMPLETED').slice(0, 10);
      completedJobs.forEach(job => {
        if (!readState[`job-${job.id}`]) count++;
      });

      const recentPayments = payments.slice(0, 10);
      recentPayments.forEach(payment => {
        if (!readState[`payment-${payment.id}`]) count++;
      });

      const pendingApps = appointments.filter(app => app.status === 'PENDING');
      pendingApps.forEach(app => {
        if (!readState[`app-${app.id}`]) count++;
      });



      return count;
    } catch {
      return 0;
    }
  }, [jobs, payments, appointments, readStateVersion]);

  const appointmentBadge = useMemo(() => {
    try {
      const raw = localStorage.getItem('velauto_notifications_state_v1');
      const readState = raw ? JSON.parse(raw) : {};
      const pendingApps = appointments.filter(app => app.status === 'PENDING');
      const unreadPendingCount = pendingApps.filter(app => !readState[`app-${app.id}`]).length;
      return unreadPendingCount > 0 ? String(unreadPendingCount) : null;


    } catch {
      return null;
    }
  }, [appointments, readStateVersion]);



  const displayBadge = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="w-72 bg-[var(--bg-sidebar)] h-screen flex flex-col border-r border-[var(--border-soft)] shadow-2xl shadow-black/30">
      <div className="p-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <div className="text-[24px] font-black text-[var(--accent)] text-center tracking-[0.26em]">velAuto</div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-11 w-11 rounded-xl border transition-all ${isDark
              ? 'bg-white border-white/70 text-[#1A202C] hover:brightness-95'
              : 'bg-[#1F2937] border-[#111827] text-white hover:brightness-110'}`}
            title={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-[var(--border-soft)]">
        <div
          onClick={() => navigate('/profil')}
          className={`rounded-2xl bg-[var(--bg-main)] border p-3 cursor-pointer transition-all ${location.pathname === '/profil' ? 'border-[var(--accent)] shadow-[0_0_0_1px_rgba(0,139,147,0.25)]' : 'border-[var(--border-soft)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]'}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/profil');
            }
          }}
          aria-label="Profil sayfasını aç"
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-2">Aktif Kullanıcı</p>
          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.fullName || user?.name || user?.email || 'Oturum açıldı'}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{user?.email || 'API oturumu'}</p>
        </div>
      </div>

      <nav className="flex-1 py-5">
        {menuItems.map((item) => {
          let badgeText = item.badge;
          if (item.path === '/bildirimler') badgeText = displayBadge;
          if (item.path === '/appointments') badgeText = appointmentBadge;

          
          return (

            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-6 py-4 cursor-pointer transition-all flex items-center gap-4 font-semibold
              ${location.pathname === item.path
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-l-4 border-[var(--accent)]'
                  : 'text-gray-400 hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border-l-4 border-transparent'}`}
            >
              <span className="text-lg">•</span>
              <span>{item.label}</span>
              {badgeText && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">{badgeText}</span>}
            </div>
          );
        })}
      </nav>
      <div className="p-5 border-t border-[var(--border-soft)]">
        <div
          onClick={handleLogout}
          className="px-6 py-4 text-[var(--danger)] cursor-pointer font-semibold hover:bg-[var(--bg-card)] rounded-xl transition-all border border-transparent hover:border-[var(--danger)]/20"
        >
          Çıkış Yap
        </div>
      </div>
    </aside>
  );
}
