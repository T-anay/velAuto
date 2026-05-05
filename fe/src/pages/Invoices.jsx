import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

const STORAGE_KEY = 'velauto_invoice_payments_v1';

const loadPayments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('tr-TR')} TL`;

export default function Invoices() {
  const { jobs } = useService();
  const [paymentMap, setPaymentMap] = useState(loadPayments);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'NAKIT' });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentMap));
  }, [paymentMap]);

  const completedJobs = useMemo(() => jobs.filter((job) => String(job.statusKey || job.status).toUpperCase() === 'COMPLETED').sort((a, b) => Number(b.id) - Number(a.id)), [jobs]);

  useEffect(() => {
    if (!selectedInvoiceId && completedJobs.length > 0) {
      setSelectedInvoiceId(String(completedJobs[0].id));
    }
  }, [completedJobs, selectedInvoiceId]);

  const selectedJob = completedJobs.find((job) => String(job.id) === String(selectedInvoiceId));
  const selectedPayments = selectedJob ? (paymentMap[selectedJob.id] || []) : [];

  const invoiceSummary = useMemo(() => {
    if (!selectedJob) return { total: 0, paid: 0, remaining: 0 };
    const total = Number(selectedJob.total || 0);
    const paid = selectedPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const remaining = Math.max(total - paid, 0);
    return { total, paid, remaining };
  }, [selectedJob, selectedPayments]);

  const stats = useMemo(() => {
    const invoiceCount = completedJobs.length;
    const totalTurnover = completedJobs.reduce((sum, job) => sum + Number(job.total || 0), 0);
    const totalCollected = Object.values(paymentMap)
      .flat()
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { invoiceCount, totalTurnover, totalCollected };
  }, [completedJobs, paymentMap]);

  const addPartialPayment = (event) => {
    event.preventDefault();
    setError('');
    if (!selectedJob) return;

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Geçerli ödeme tutarı girin.');
      return;
    }

    if (amount > invoiceSummary.remaining) {
      setError('Ödeme tutarı kalan bakiyeden büyük olamaz.');
      return;
    }

    const nextPayment = {
      id: `pay-${Date.now()}`,
      amount,
      method: paymentForm.method,
      at: new Date().toISOString(),
    };

    setPaymentMap((prev) => ({
      ...prev,
      [selectedJob.id]: [nextPayment, ...(prev[selectedJob.id] || [])],
    }));
    setPaymentForm((prev) => ({ ...prev, amount: '' }));
    pushToast({
      type: amount === invoiceSummary.remaining ? 'success' : 'info',
      title: amount === invoiceSummary.remaining ? 'Fatura kapatıldı' : 'Parçalı ödeme eklendi',
      message: `${selectedJob.plate} için ${formatMoney(amount)} tahsil edildi.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Invoice + Payment</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Fatura ve Finansal Raporlama</h1>
        <p className="text-[var(--text-secondary)] mt-2">Tamamlanan işler için fatura görünümü, parçalı ödeme geçmişi ve kalan bakiye takibi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Fatura Adedi</p><p className="text-2xl font-black mt-2">{stats.invoiceCount}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Toplam Ciro</p><p className="text-2xl font-black mt-2 text-[var(--accent)]">{formatMoney(stats.totalTurnover)}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs font-black text-[var(--text-muted)] uppercase">Tahsil Edilen</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{formatMoney(stats.totalCollected)}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Fatura Listesi</h2>
          <div className="mt-4 space-y-3 max-h-[580px] overflow-auto pr-1">
            {completedJobs.length === 0 && <div className="p-6 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">Tamamlanmış iş bulunamadı.</div>}
            {completedJobs.map((job) => (
              <button
                type="button"
                key={job.id}
                onClick={() => setSelectedInvoiceId(String(job.id))}
                className={`w-full text-left p-4 rounded-xl border transition-all ${String(selectedInvoiceId) === String(job.id) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-soft)] bg-[var(--bg-main)]'}`}
              >
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-black">{job.plate}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{job.customer}</p>
                <p className="text-base font-black text-[var(--text-primary)] mt-2">{formatMoney(job.total)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          {!selectedJob && <div className="p-12 text-center text-[var(--text-secondary)]">Fatura görmek için sol listeden bir iş seç.</div>}

          {selectedJob && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Resmi Fatura Görünümü</p>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] mt-2">{selectedJob.plate} - {selectedJob.customer}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Şikayet: {selectedJob.complaint || 'Belirtilmemiş'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"><p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Toplam</p><p className="text-sm font-black mt-1">{formatMoney(invoiceSummary.total)}</p></div>
                  <div className="p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"><p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Ödendi</p><p className="text-sm font-black mt-1 text-[var(--success)]">{formatMoney(invoiceSummary.paid)}</p></div>
                  <div className="p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"><p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Kalan</p><p className="text-sm font-black mt-1 text-[var(--danger)]">{formatMoney(invoiceSummary.remaining)}</p></div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Fatura Kalemleri</h3>
                <div className="mt-3 space-y-2">
                  {(selectedJob.items || []).length === 0 && <p className="text-sm text-[var(--text-secondary)]">Kalem bulunamadı.</p>}
                  {(selectedJob.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm border-b border-[var(--border-soft)] pb-2">
                      <span className="text-[var(--text-primary)] font-semibold">{item.name}</span>
                      <span className="font-black">{formatMoney(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form onSubmit={addPartialPayment} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Parçalı Ödeme Ekle</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="Tutar"
                      className="p-3 rounded-lg border border-[var(--border-soft)] bg-white"
                    />
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                      className="p-3 rounded-lg border border-[var(--border-soft)] bg-white"
                    >
                      <option value="NAKIT">NAKİT</option>
                      <option value="KART">KART</option>
                      <option value="HAVALE">HAVALE</option>
                    </select>
                  </div>
                  {error && <p className="text-sm font-bold text-[var(--danger)]">{error}</p>}
                  <button type="submit" disabled={invoiceSummary.remaining <= 0} className="w-full p-3 rounded-lg bg-[var(--accent)] text-white font-black disabled:opacity-50 disabled:cursor-not-allowed">Ödeme Ekle</button>
                </form>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Ödeme Geçmişi</h3>
                  <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                    {selectedPayments.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Kayıtlı ödeme yok.</p>}
                    {selectedPayments.map((entry) => (
                      <div key={entry.id} className="p-3 rounded-lg border border-[var(--border-soft)] bg-white text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[var(--text-primary)]">{formatMoney(entry.amount)}</span>
                          <span className="text-xs font-black text-[var(--accent)]">{entry.method}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(entry.at).toLocaleString('tr-TR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
