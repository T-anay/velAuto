import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

const STORAGE_KEY = 'velauto_expenses_v1';
const CATEGORIES = ['KIRA', 'ELEKTRIK', 'SU', 'YEDEK_PARCA', 'PERSONEL_MAASI', 'BAKIM', 'DIGER'];

const formatMoney = (value) => `${Number(value || 0).toLocaleString('tr-TR')} TL`;

const loadExpenses = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function Expenses() {
  const { jobs } = useService();
  const [expenses, setExpenses] = useState(loadExpenses);
  const [form, setForm] = useState({
    category: 'KIRA',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    title: '',
    note: '',
  });
  const [filters, setFilters] = useState({ from: '', to: '', category: 'ALL' });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.category !== 'ALL' && expense.category !== filters.category) return false;
      if (filters.from && expense.date < filters.from) return false;
      if (filters.to && expense.date > filters.to) return false;
      return true;
    });
  }, [expenses, filters]);

  const totals = useMemo(() => {
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalRevenue = jobs
      .filter((job) => job.status === 'COMPLETED')
      .reduce((sum, job) => sum + Number(job.total || 0), 0);
    const netProfit = totalRevenue - totalExpense;
    return { totalExpense, totalRevenue, netProfit };
  }, [filteredExpenses, jobs]);

  const handleAddExpense = (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Gider başlığı zorunludur.');
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }

    setExpenses((prev) => [
      {
        id: `exp-${Date.now()}`,
        category: form.category,
        amount,
        date: form.date,
        title: form.title.trim(),
        note: form.note.trim(),
      },
      ...prev,
    ]);

    setForm((prev) => ({ ...prev, amount: '', title: '', note: '' }));
    pushToast({ type: 'success', title: 'Gider eklendi', message: `${form.title.trim()} kaydı oluşturuldu.` });
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    pushToast({ type: 'info', title: 'Gider silindi', message: 'Gider kaydı kaldırıldı.' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Muhasebe</p>
          <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Gider Yönetimi</h1>
          <p className="text-[var(--text-secondary)] mt-2">Kategori bazlı gider gir, filtrele ve net kar etkisini canlı izle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-black">Gelir (Tamamlanan İş)</p>
          <p className="text-2xl font-black text-[var(--success)] mt-2">{formatMoney(totals.totalRevenue)}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-black">Toplam Gider</p>
          <p className="text-2xl font-black text-[var(--danger)] mt-2">{formatMoney(totals.totalExpense)}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-black">Net Kar</p>
          <p className={`text-2xl font-black mt-2 ${totals.netProfit >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
            {formatMoney(totals.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Yeni Gider Girişi</h2>
          <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Başlık</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]"
                placeholder="Örn: Nisan elektrik faturası"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Tutar</label>
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Tarih</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black">Not</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full mt-1 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-20"
                placeholder="Opsiyonel"
              />
            </div>

            {error && <p className="text-sm font-bold text-[var(--danger)]">{error}</p>}
            <button type="submit" className="w-full p-3 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 transition-all">
              GİDERİ EKLE
            </button>
          </form>
        </section>

        <section className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Gider Listesi ve Filtre</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)]"
              >
                <option value="ALL">Tüm Kategoriler</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-3 max-h-[520px] overflow-auto pr-1">
            {filteredExpenses.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-8 text-center text-[var(--text-secondary)]">
                Filtreye uygun gider kaydı bulunamadı.
              </div>
            )}

            {filteredExpenses.map((expense) => (
              <article key={expense.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-black">{expense.category.replace('_', ' ')}</p>
                    <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">{expense.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{expense.note || 'Not yok'}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">{expense.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[var(--danger)]">{formatMoney(expense.amount)}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="mt-2 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-all"
                    >
                      Sil
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
