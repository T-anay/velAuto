import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

const STORAGE_KEY = 'velauto_staff_v1';
const ROLES = ['ADMIN', 'STAFF', 'SUPER_ADMIN'];
const SCOPES = [
  { value: 'OWN_JOBS', label: 'Sadece Kendi İşleri' },
  { value: 'SHOP_CASH', label: 'Kasa + Operasyon' },
  { value: 'FULL_ADMIN', label: 'Tam Yönetim' },
];

const loadStaff = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function Staff() {
  const { user } = useService();
  const [staff, setStaff] = useState(() => {
    const existing = loadStaff();
    if (existing.length > 0) return existing;
    return [
      {
        id: `staff-${Date.now()}`,
        fullName: user?.fullName || 'Sistem Yöneticisi',
        email: user?.email || 'admin@velauto.local',
        phone: user?.phone || '',
        role: user?.role || 'ADMIN',
        permissionScope: 'FULL_ADMIN',
        active: true,
      },
    ];
  });
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'STAFF', permissionScope: 'OWN_JOBS' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchSearch =
        member.fullName.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !member.active) return false;
      if (statusFilter === 'PASSIVE' && member.active) return false;
      return true;
    });
  }, [roleFilter, search, staff, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = staff.filter((member) => member.active).length;
    const adminCount = staff.filter((member) => member.role === 'ADMIN' || member.role === 'SUPER_ADMIN').length;
    return { total: staff.length, active: activeCount, passive: staff.length - activeCount, admin: adminCount };
  }, [staff]);

  const handleAddStaff = (event) => {
    event.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Ad soyad ve e-posta zorunludur.');
      return;
    }

    const hasDuplicate = staff.some((member) => member.email.toLowerCase() === form.email.trim().toLowerCase());
    if (hasDuplicate) {
      setError('Bu e-posta ile kayıtlı personel zaten mevcut.');
      return;
    }

    setStaff((prev) => [
      {
        id: `staff-${Date.now()}`,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        permissionScope: form.permissionScope,
        active: true,
      },
      ...prev,
    ]);

    setForm({ fullName: '', email: '', phone: '', role: 'STAFF', permissionScope: 'OWN_JOBS' });
    pushToast({ type: 'success', title: 'Personel eklendi', message: `${form.fullName.trim()} kaydı oluşturuldu.` });
  };

  const updateMember = (id, patch) => {
    setStaff((prev) => prev.map((member) => (member.id === id ? { ...member, ...patch } : member)));

    if (Object.prototype.hasOwnProperty.call(patch, 'active')) {
      pushToast({
        type: patch.active ? 'success' : 'info',
        title: patch.active ? 'Personel aktif edildi' : 'Personel pasifleştirildi',
        message: 'Yetki durumu güncellendi.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Yetki Yönetimi</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Personel ve Yetki</h1>
        <p className="text-[var(--text-secondary)] mt-2">Yeni personel ekle, rol ata, hesapları aktif/pasif yönet.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Toplam</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Aktif</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{stats.active}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Pasif</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.passive}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Yönetici</p><p className="text-2xl font-black mt-2 text-[var(--accent)]">{stats.admin}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Yeni Personel</h2>
          <form onSubmit={handleAddStaff} className="mt-4 space-y-3">
            <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="Ad Soyad" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
            <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-posta" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
            <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Telefon" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select value={form.permissionScope} onChange={(e) => setForm((prev) => ({ ...prev, permissionScope: e.target.value }))} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
                {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
              </select>
            </div>
            {error && <p className="text-sm font-bold text-[var(--danger)]">{error}</p>}
            <button type="submit" className="w-full p-3 rounded-xl bg-[var(--accent)] text-white font-black">PERSONEL EKLE</button>
          </form>
        </section>

        <section className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim veya e-posta ara" className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] md:col-span-1" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
              <option value="ALL">Tüm Roller</option>
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PASSIVE">Pasif</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {filteredStaff.length === 0 && <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">Filtreye uygun personel bulunamadı.</div>}
            {filteredStaff.map((member) => (
              <article key={member.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)]">{member.fullName}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{member.email} {member.phone ? `• ${member.phone}` : ''}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                    <select value={member.role} onChange={(e) => updateMember(member.id, { role: e.target.value })} className="p-2 rounded-lg border border-[var(--border-soft)] bg-white">
                      {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <select value={member.permissionScope} onChange={(e) => updateMember(member.id, { permissionScope: e.target.value })} className="p-2 rounded-lg border border-[var(--border-soft)] bg-white">
                      {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateMember(member.id, { active: !member.active })}
                      className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${member.active ? 'border-[var(--success)]/40 text-[var(--success)]' : 'border-[var(--danger)]/40 text-[var(--danger)]'}`}
                    >
                      {member.active ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
