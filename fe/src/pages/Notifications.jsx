import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';

const STORAGE_KEY = 'velauto_notifications_state_v1';

const loadReadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export default function Notifications() {
  const { jobs, payments, appointments } = useService();

  const [readState, setReadState] = useState(loadReadState);
  const [filter, setFilter] = useState('ALL');
  const [baseTime] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readState));
    window.dispatchEvent(new Event('velauto_notifications_updated'));
  }, [readState]);

  const generatedNotifications = useMemo(() => {
    const lowStockSeeds = [
      { id: 'stock-1', type: 'STOCK', title: 'Düşük Stok Uyarısı', detail: 'Fren balatası stoğu kritik seviyeye düştü (3 adet).' },
      { id: 'stock-2', type: 'STOCK', title: 'Düşük Stok Uyarısı', detail: '5W-30 motor yağı kalan miktar: 2 kutu.' },
    ];

    const completedJobs = jobs
      .filter((job) => String(job.statusKey || job.status).toUpperCase() === 'COMPLETED')
      .slice(0, 10)
      .map((job) => ({
        id: `job-${job.id}`,
        type: 'JOB',
        title: 'İş Durumu Güncellemesi',
        detail: `${job.plate} plakalı iş tamamlandı.`,
      }));

    const paymentUpdates = payments
      .slice(0, 10)
      .map((payment) => ({
        id: `payment-${payment.id}`,
        type: 'PAYMENT',
        title: 'Tahsilat Bekliyor',
        detail: `${payment.plate} için ${Number(payment.amount || 0).toLocaleString('tr-TR')} TL tahsilat bekleniyor.`,
      }));

    const appointmentRequests = (appointments || [])
      .filter(app => app.status === 'PENDING')


      .map((app) => ({

        id: `app-${app.id}`,
        type: 'APPOINTMENT',
        title: 'Yeni Randevu Talebi',
        detail: `${app.plate} plakalı araç için ${app.customer} tarafından randevu talep edildi.`,
      }));

    return [...lowStockSeeds, ...completedJobs, ...paymentUpdates, ...appointmentRequests].map((item, index) => ({

      ...item,
      createdAt: new Date(baseTime - index * 1000 * 60 * 20).toISOString(),
      read: Boolean(readState[item.id]),
    }));
  }, [baseTime, jobs, payments, readState]);

  const filteredNotifications = useMemo(() => {
    return generatedNotifications.filter((item) => (filter === 'ALL' ? true : item.type === filter));
  }, [filter, generatedNotifications]);

  const stats = useMemo(() => {
    const unread = generatedNotifications.filter((item) => !item.read).length;
    return {
      total: generatedNotifications.length,
      unread,
      stock: generatedNotifications.filter((item) => item.type === 'STOCK').length,
      job: generatedNotifications.filter((item) => item.type === 'JOB').length,
    };
  }, [generatedNotifications]);

  const toggleRead = (id) => {
    setReadState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const markAllRead = () => {
    const next = {};
    generatedNotifications.forEach((item) => {
      next[item.id] = true;
    });
    setReadState(next);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Sistem Uyarıları</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Bildirim Merkezi</h1>
        <p className="text-[var(--text-secondary)] mt-2">Düşük stok, iş güncellemesi ve ödeme hareketlerini takip et.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Toplam</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Okunmamış</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.unread}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Stok</p><p className="text-2xl font-black mt-2 text-[var(--accent)]">{stats.stock}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">İş Bildirimi</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{stats.job}</p></div>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'STOCK', 'JOB', 'PAYMENT', 'APPOINTMENT'].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${filter === value ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-soft)] text-[var(--text-secondary)] bg-[var(--bg-main)]'}`}
              >
                {value === 'ALL' ? 'Tümü' : value === 'APPOINTMENT' ? 'Randevu' : value}
              </button>
            ))}
          </div>

          <button type="button" onClick={markAllRead} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-black uppercase tracking-widest">Tümünü Okundu İşaretle</button>
        </div>

        <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
          {filteredNotifications.length === 0 && <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">Bildirim bulunamadı.</div>}

          {filteredNotifications.map((item) => (
            <article key={item.id} className={`p-4 rounded-xl border transition-all ${item.read ? 'border-[var(--border-soft)] bg-[var(--bg-main)]' : 'border-[var(--accent)]/40 bg-[var(--accent)]/10'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">{item.type}</p>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{item.detail}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(item.createdAt).toLocaleString('tr-TR')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRead(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${item.read ? 'border-[var(--border-soft)] text-[var(--text-secondary)]' : 'border-[var(--accent)]/40 text-[var(--accent)]'}`}
                >
                  {item.read ? 'Okunmadı Yap' : 'Okundu İşaretle'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
