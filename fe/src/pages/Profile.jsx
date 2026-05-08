import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { adminModuleList, adminModules } from '../constants/adminModules';

export default function Profile() {
  const { user, jobs, updateUserProfile, changeUserPassword } = useService();
  const shortcutModules = adminModuleList.filter((item) => item.path !== adminModules.profile.path);

  const [profileForm, setProfileForm] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.raw?.address || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const fullName = user?.fullName || user?.raw?.name || 'Personel';
  const role = user?.role || user?.raw?.role || 'STAFF';
  const tenantName = user?.raw?.tenantName || user?.raw?.tenant?.name || user?.raw?.branchName || 'Merkez Şube';

  const performance = useMemo(() => {
    const completed = jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() === 'COMPLETED').length;
    const active = jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() !== 'COMPLETED').length;
    const waitingPart = jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() === 'WAITING_PART').length;
    const inProgress = jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() === 'IN_PROGRESS').length;
    return { completed, active, waitingPart, inProgress };
  }, [jobs]);

  const moduleSummary = useMemo(() => {
    const adminOnlyCount = shortcutModules.filter((module) => module.eyebrow.toLowerCase().includes('admin')).length;
    return {
      total: shortcutModules.length,
      adminOnly: adminOnlyCount,
      operational: Math.max(shortcutModules.length - adminOnlyCount, 0),
    };
  }, [shortcutModules]);

  const onSubmitProfile = async (event) => {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (!profileForm.phone.trim() && !profileForm.email.trim()) {
      setProfileError('En az bir iletişim alanı doldurulmalı.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserProfile({
        phone: profileForm.phone,
        email: profileForm.email,
        address: profileForm.address,
      });
      setProfileMessage('Profil bilgileri güncellendi.');
    } catch (error) {
      setProfileError(error.message || 'Profil güncellenemedi.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Tüm parola alanlarını doldurun.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Yeni parola en az 8 karakter olmalı.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Yeni parola ve tekrar alanı eşleşmiyor.');
      return;
    }

    try {
      setSavingPassword(true);
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage('Parola başarıyla güncellendi.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message || 'Parola güncellenemedi.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Kullanıcı Profili</p>
          <h1 className="text-2xl font-black text-[var(--text-primary)] mt-2">{fullName}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Rol: <span className="font-bold">{role}</span></p>
          <p className="text-sm text-[var(--text-secondary)]">Şube: <span className="font-bold">{tenantName}</span></p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">E-Posta</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 break-all">{user?.email || '-'}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Telefon</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{user?.phone || '-'}</p>
            </div>
          </div>
        </section>

        <section className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Performans Özeti</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tamamlanan ve aktif servis form durumları.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Toplam Tamamlanan</p>
              <p className="text-3xl font-black text-[var(--success)] mt-2">{performance.completed}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Aktif Form</p>
              <p className="text-3xl font-black text-[var(--accent)] mt-2">{performance.active}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">İşlemde</p>
              <p className="text-3xl font-black text-[var(--text-primary)] mt-2">{performance.inProgress}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Parça Bekliyor</p>
              <p className="text-3xl font-black text-[var(--danger)] mt-2">{performance.waitingPart}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          {profileMessage && <p className="text-sm font-bold text-[var(--success)] mt-3">{profileMessage}</p>}
          <button
            type="button"
            onClick={() => {
              setProfileError('');
              setIsProfileModalOpen(true);
            }}
            className="mt-5 w-full p-3 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all"
          >
            BİLGİ GÜNCELLEMEK İÇİN TIKLAYIN
          </button>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          {passwordMessage && <p className="text-sm font-bold text-[var(--success)] mt-3">{passwordMessage}</p>}
          <button
            type="button"
            onClick={() => {
              setPasswordError('');
              setIsPasswordModalOpen(true);
            }}
            className="mt-5 w-full p-3 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all"
          >
            ŞİFRE DEĞİŞTİRMEK İÇİN TIKLAYIN
          </button>
        </section>
      </div>

      <section className="max-w-7xl mx-auto">
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mb-6">
            <div className="max-w-3xl">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Yönetim Merkezi</p>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mt-2">Profil Merkezi</h2>
              <p className="text-[var(--text-secondary)] mt-2 leading-7">
                Giderler, personel, randevular, AI analiz ve sistem yönetimi ekranlarına tek noktadan erişebilirsin. Her modül kartı, ilgili akışın kısa özetini ve doğrudan geçişini sunar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0 lg:min-w-[420px]">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Toplam Modül</p>
                <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{moduleSummary.total}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Operasyonel</p>
                <p className="text-2xl font-black text-[var(--accent)] mt-1">{moduleSummary.operational}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Admin</p>
                <p className="text-2xl font-black text-[var(--danger)] mt-1">{moduleSummary.adminOnly}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shortcutModules.map((module) => (
              <Link
                key={module.path}
                to={module.path}
                className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-5 hover:border-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">{module.eyebrow}</p>
                  <span className="text-[10px] font-black text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-1 rounded-lg">
                    {module.path}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{module.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-6 min-h-[88px]">{module.description}</p>

                <div className="mt-4 pt-4 border-t border-[var(--border-soft)] flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Modüle Git</span>
                  <span className="text-lg font-black text-[var(--accent)] group-hover:translate-x-1 transition-transform">{'>'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)]">Bilgi Güncelleme</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">PUT /api/v1/users/profile</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="h-10 w-10 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] font-black"
                aria-label="Kapat"
              >
                X
              </button>
            </div>

            <form onSubmit={onSubmitProfile} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Telefon</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">E-Posta</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="ornek@velauto.com"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Adres</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] min-h-24"
                  placeholder="Şube adresi"
                />
              </div>

              {profileError && <p className="text-sm font-bold text-[var(--danger)]">{profileError}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 p-3 bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-soft)] font-black rounded-xl"
                >
                  KAPAT
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 p-3 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingProfile ? 'GÜNCELLENİYOR...' : 'KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)]">Şifre Değiştirme</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">POST /api/v1/auth/change-password</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-10 w-10 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] font-black"
                aria-label="Kapat"
              >
                X
              </button>
            </div>

            <form onSubmit={onSubmitPassword} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Mevcut Şifre</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Yeni Şifre</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              {passwordError && <p className="text-sm font-bold text-[var(--danger)]">{passwordError}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 p-3 bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-soft)] font-black rounded-xl"
                >
                  KAPAT
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 p-3 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'GÜNCELLENİYOR...' : 'KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
