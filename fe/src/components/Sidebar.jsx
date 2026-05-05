import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { useTheme } from '../context/ThemeContext';

const menuItems = [
  { path: '/dashboard', label: ' Atölye Özeti' },
  { path: '/vehicle-entry', label: ' Yeni Araç Kabul' },
  { path: '/active-jobs', label: ' Aktif İşler' },
  { path: '/appointments', label: ' Takvim' },
  { path: '/customers', label: ' Müşteriler' },
  { path: '/cashier', label: ' Kasa & Tahsilat' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useService();
  const { isDark, toggleTheme } = useTheme();

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
        {menuItems.map((item) => (
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
          </div>
        ))}
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