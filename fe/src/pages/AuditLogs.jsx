import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

const STORAGE_KEY = 'velauto_audit_logs_v1';

const seedLogs = (userName) => ([
  {
    id: `log-${Date.now()}-1`,
    user: userName,
    action: 'SERVICE_FORM_PRICE_UPDATED',
    resource: 'ServiceForm#A-1024',
    severity: 'CRITICAL',
    detail: 'Toplam tutar 12.400 TL -> 13.200 TL güncellendi.',
    at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: `log-${Date.now()}-2`,
    user: userName,
    action: 'STAFF_ROLE_CHANGED',
    resource: 'User#u-18',
    severity: 'HIGH',
    detail: 'STAFF -> ADMIN yetki değişimi uygulandı.',
    at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
]);

const loadLogs = (userName) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return seedLogs(userName);
};

export default function AuditLogs() {
  const { user, jobs, customers, payments } = useService();
  const currentUser = user?.fullName || user?.email || 'Admin Kullanıcı';
  const [logs, setLogs] = useState(() => loadLogs(currentUser));
  const [filters, setFilters] = useState({ severity: 'ALL', action: 'ALL', q: '' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const stats = useMemo(() => {
    const critical = logs.filter((item) => item.severity === 'CRITICAL').length;
    const high = logs.filter((item) => item.severity === 'HIGH').length;
    return { total: logs.length, critical, high };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (filters.severity !== 'ALL' && item.severity !== filters.severity) return false;
      if (filters.action !== 'ALL' && item.action !== filters.action) return false;
      if (filters.q && !`${item.user} ${item.resource} ${item.detail}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [filters, logs]);

  const actions = useMemo(() => Array.from(new Set(logs.map((item) => item.action))), [logs]);

  const pushLog = (action, resource, severity, detail) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        user: currentUser,
        action,
        resource,
        severity,
        detail,
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const runHealthSnapshot = () => {
    pushLog('SNAPSHOT_TAKEN', 'SystemOverview', 'LOW', `Araçlar: ${jobs.length}, Müşteriler: ${customers.length}, Bekleyen ödeme: ${payments.length}`);
    pushToast({ type: 'success', title: 'Snapshot kaydedildi', message: 'Sistem özeti denetim kayıtlarına eklendi.' });
  };

  const markPricingAudit = () => {
    const sample = jobs.find((job) => Number(job.total || 0) > 0);
    if (!sample) {
      pushLog('SERVICE_FORM_PRICE_UPDATED', 'ServiceForm#N/A', 'MEDIUM', 'İzlenecek fiyatlı servis formu bulunamadı.');
      pushToast({ type: 'warning', title: 'Fiyat logu yok', message: 'İzlenecek servis formu bulunamadı.' });
      return;
    }
    pushLog('SERVICE_FORM_PRICE_UPDATED', `ServiceForm#${sample.serviceFormId || sample.id}`, 'CRITICAL', `${sample.plate} için fiyat değişikliği denetimi kaydedildi.`);
    pushToast({ type: 'warning', title: 'Fiyat logu işlendi', message: `${sample.plate} için fiyat denetimi kaydedildi.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Admin Only</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Denetim İzleri</h1>
        <p className="text-[var(--text-secondary)] mt-2">Kritik fiyat, stok ve yetki değişimlerini detaylı olarak takip et.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Toplam Kayıt</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Kritik</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.critical}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Yüksek</p><p className="text-2xl font-black mt-2 text-[var(--accent)]">{stats.high}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex items-center justify-center gap-2">
          <button type="button" onClick={runHealthSnapshot} className="px-3 py-2 rounded-lg border border-[var(--border-soft)] text-xs font-black">Snapshot</button>
          <button type="button" onClick={markPricingAudit} className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-black">Fiyat Logu</button>
        </div>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Kullanıcı / kaynak / detay ara" className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
          <select value={filters.severity} onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
            <option value="ALL">Tüm Seviyeler</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <select value={filters.action} onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
            <option value="ALL">Tüm Aksiyonlar</option>
            {actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </div>

        <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
          {filteredLogs.length === 0 && <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">Filtreye uygun denetim kaydı yok.</div>}
          {filteredLogs.map((log) => (
            <article key={log.id} className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">{log.action}</span>
                    <span className={`px-2 py-1 rounded-md border text-[10px] font-black ${
                      log.severity === 'CRITICAL' ? 'text-[var(--danger)] border-[var(--danger)]/40 bg-[var(--danger)]/10' :
                        log.severity === 'HIGH' ? 'text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/10' :
                          'text-[var(--text-secondary)] border-[var(--border-soft)] bg-white'
                    }`}>
                      {log.severity}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">{log.resource}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{log.detail}</p>
                </div>
                <div className="text-xs text-[var(--text-muted)] text-right">
                  <p className="font-black">{log.user}</p>
                  <p>{new Date(log.at).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
