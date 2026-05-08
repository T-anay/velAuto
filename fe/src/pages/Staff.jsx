import { useEffect, useMemo, useState } from 'react';
import { pushToast } from '../lib/toastBus';
// Eğer velautoApi dosyan services klasöründeyse '../services/velautoApi' olarak değiştir
import { api } from '../api/velautoApi'; 

const ROLES = ['ADMIN', 'STAFF', 'SUPER_ADMIN'];
const CREATABLE_ROLES = ['ADMIN', 'STAFF'];

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Silme Modal'ı (Pop-up) için State
  const [memberToDelete, setMemberToDelete] = useState(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'STAFF' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  // TELEFON FORMATLAYICI (Otomatik (5XX) XXX XX XX formatına çevirir)
  const handlePhoneChange = (e) => {
    // Sadece rakamları al
    let val = e.target.value.replace(/\D/g, '');
    
    // Eğer kullanıcı 05... diye başlarsa baştaki 0'ı at
    if (val.startsWith('0')) val = val.substring(1);
    // Maksimum 10 haneye izin ver
    if (val.length > 10) val = val.substring(0, 10);

    let formatted = val;
    if (val.length > 0) {
      if (val.length <= 3) {
        formatted = `${val}`;
      } else if (val.length <= 6) {
        formatted = `(${val.slice(0, 3)}) ${val.slice(3)}`;
      } else if (val.length <= 8) {
        formatted = `(${val.slice(0, 3)}) ${val.slice(3, 6)} ${val.slice(6)}`;
      } else {
        formatted = `(${val.slice(0, 3)}) ${val.slice(3, 6)} ${val.slice(6, 8)} ${val.slice(8, 10)}`;
      }
    }
    setForm((prev) => ({ ...prev, phone: formatted }));
  };

  // 1. BACKEND'DEN VERİLERİ ÇEKME (GET) - api.request kullanıldı
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.request('/api/v1/staff');
      setStaff(data?.data || data || []);
    } catch (err) {
      pushToast({ type: 'error', title: 'Hata', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const matchSearch =
        fullName.includes(search.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(search.toLowerCase()));
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

// 2. BACKEND'E YENİ PERSONEL EKLEME (POST) - api.request kullanıldı
  const handleAddStaff = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Ad, Soyad ve E-posta zorunludur.');
      return;
    }

    try {
      // Transform form data to match backend DTO
      const requestData = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, '') || undefined,
        role: form.role
      };

      // 1. İsteği at ve kaydet
      await api.request('/api/v1/auth/staff/create', {
        method: 'POST',
        body: requestData
      });

      // 2. KRİTİK NOKTA: Manuel ekleme yapmak yerine listeyi backend'den yeniden çekiyoruz!
      // Bu sayede sanki F5 atmışsın gibi en güncel veri tabloya düşer.
      await fetchStaff();

      // 3. Formu temizle ve bildirim göster
      setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'STAFF' });
      pushToast({ type: 'success', title: 'Personel eklendi', message: `${form.firstName} başarıyla veritabanına kaydedildi.` });
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. BACKEND'DE PERSONEL GÜNCELLEME (PUT) - api.request kullanıldı
  const updateMember = async (id, patch) => {
    const targetMember = staff.find(m => m.id === id);
    if (targetMember && targetMember.role === 'SUPER_ADMIN') {
        pushToast({ type: 'error', title: 'İşlem Reddedildi', message: 'Sistem Yöneticisi üzerinde değişiklik yapılamaz!' });
        return;
    }

    const previousStaff = [...staff];
    setStaff((prev) => prev.map((member) => (member.id === id ? { ...member, ...patch } : member)));

    try {
      await api.request(`/api/v1/staff/${id}`, {
        method: 'PUT',
        body: { ...targetMember, ...patch }
      });

      if (Object.prototype.hasOwnProperty.call(patch, 'active')) {
        pushToast({
          type: patch.active ? 'success' : 'info',
          title: patch.active ? 'Personel aktif edildi' : 'Personel pasifleştirildi',
          message: 'Yetki durumu veritabanında güncellendi.',
        });
      }
    } catch (err) {
      setStaff(previousStaff);
      pushToast({ type: 'error', title: 'Hata', message: err.message });
    }
  };

  // 4. BACKEND'DEN PERSONEL SİLME ONAYI VE İŞLEMİ (DELETE) - api.request kullanıldı
  const handleDeleteClick = (member) => {
    if (member.role === 'SUPER_ADMIN') {
        pushToast({ type: 'error', title: 'İşlem Reddedildi', message: 'Sistem Yöneticisi silinemez!' });
        return;
    }
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    const id = memberToDelete.id;

    try {
      await api.request(`/api/v1/staff/${id}`, {
        method: 'DELETE'
      });

      setStaff((prev) => prev.filter((member) => member.id !== id));
      pushToast({ type: 'success', title: 'Personel Silindi', message: 'Kayıt veritabanından kalıcı olarak kaldırıldı.' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Hata', message: err.message });
    } finally {
      setMemberToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Yetki Yönetimi</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Personel ve Yetki</h1>
        <p className="text-[var(--text-secondary)] mt-2">Yeni personel ekle, rol ata, hesapları aktif/pasif yönet veya sil.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Toplam</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Aktif</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{stats.active}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Pasif</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.passive}</p></div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)] font-black uppercase">Yönetici</p><p className="text-2xl font-black mt-2 text-[var(--accent)]">{stats.admin}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Yeni Personel</h2>
          <form onSubmit={handleAddStaff} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="Ad" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
              <input value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Soyad" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
            </div>
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-posta" className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
            <input 
              type="tel"
              value={form.phone} 
              onChange={handlePhoneChange} 
              placeholder="(5XX) XXX XX XX" 
              maxLength={15}
              className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
            />
            
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
              {CREATABLE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            
            {error && <p className="text-sm font-bold text-[var(--danger)]">{error}</p>}
            <button type="submit" className="w-full p-3 rounded-xl bg-[var(--accent)] text-white font-black hover:opacity-90 transition-opacity">PERSONEL EKLE</button>
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
            {loading ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">
                Personeller yükleniyor...
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">
                Filtreye uygun personel bulunamadı.
              </div>
            ) : (
              filteredStaff.map((member) => {
                const isSuperAdmin = member.role === 'SUPER_ADMIN';

                return (
                  <article key={member.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[var(--text-primary)]">{member.firstName} {member.lastName}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{member.email} {member.phone ? `• ${member.phone}` : ''}</p>
                        {isSuperAdmin && <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/10 text-purple-600 text-[10px] font-bold rounded">SİSTEM YÖNETİCİSİ</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                        <select 
                          value={member.role} 
                          onChange={(e) => updateMember(member.id, { role: e.target.value })} 
                          disabled={isSuperAdmin}
                          className={`p-2 rounded-lg border border-[var(--border-soft)] bg-white ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {CREATABLE_ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                          {isSuperAdmin && <option value="SUPER_ADMIN" disabled>SUPER_ADMIN</option>}
                        </select>
                        
                        <button
                          type="button"
                          onClick={() => updateMember(member.id, { active: !member.active })}
                          disabled={isSuperAdmin}
                          className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${
                            member.active ? 'border-[var(--success)]/40 text-[var(--success)]' : 'border-gray-400 text-gray-500'
                          } ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {member.active ? 'Aktif' : 'Pasif'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(member)}
                          disabled={isSuperAdmin}
                          className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors ${
                            isSuperAdmin ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''
                          }`}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* SİLME ONAY MODALI (POP-UP) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4 text-[var(--danger)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              <h3 className="text-xl font-black">Personeli Sil</h3>
            </div>
            <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
              <strong className="text-[var(--text-primary)]">{memberToDelete.firstName} {memberToDelete.lastName}</strong> adlı personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-main)] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl font-bold bg-[var(--danger)] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}