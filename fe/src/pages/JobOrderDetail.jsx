import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import BackButton from '../components/BackButton';

const itemStatuses = [
  { value: 'BEKLIYOR', label: 'Bekliyor' },
  { value: 'ISLEMDE', label: 'Islemde' },
  { value: 'TAMAMLANDI', label: 'Tamamlandi' },
];

export default function JobOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    jobs,
    setJobStatus,
    completeServiceForm,
    serviceCatalog,
    addServiceItem,
    removeServiceItem,
    refreshJob,
    updateServiceItemStatus,
  } = useService();

  const job = useMemo(() => jobs.find((entry) => String(entry.id) === String(id)), [id, jobs]);
  const [selectedOperation, setSelectedOperation] = useState('');
  const [customOperationName, setCustomOperationName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);

  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (!job?.serviceFormId || hasSynced) return;
    
    refreshJob(job.id).then(() => setHasSynced(true));
  }, [id, job?.serviceFormId, refreshJob, hasSynced]);

  if (!job) {
    return (
      <div className="animate-in fade-in duration-500 text-center p-10">
        <h2 className="text-3xl font-black mb-4">Is emri bulunamadi</h2>
        <p className="text-gray-400 mb-6">Lutfen aktif islerden birini seciniz.</p>
        <button onClick={() => navigate('/active-jobs')} className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-bold">Aktif Islere Don</button>
      </div>
    );
  }

  const catalogItems = (serviceCatalog || []).length > 0
    ? serviceCatalog.map((item) => ({ name: item.name, price: item.price || item.basePrice || 0 }))
    : [
      { name: 'Yag Degisimi', price: 1200 },
      { name: 'Fren Balatasi Degisimi', price: 2500 },
      { name: 'Kaporta Onarim', price: 3500 },
      { name: 'Boya Islemi', price: 4000 },
    ];
  const operationOptions = [...new Set([...catalogItems.map((item) => item.name), 'Ozel Islem'])];
  const allItemsCompleted = (job.items || []).length > 0 && (job.items || []).every((item) => item.status === 'TAMAMLANDI');
  const displayStatus = job.statusLabel || job.status;

  const addItem = async () => {
    const name = selectedOperation === 'Ozel Islem' ? customOperationName.trim() : selectedOperation;
    const catalogMatch = catalogItems.find((item) => item.name === selectedOperation);
    const price = Number(manualPrice || catalogMatch?.price || 0);

    if (!name) {
      setActionError('Lutfen islem secin.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setActionError('Lutfen gecerli bir tutar girin.');
      return;
    }

    try {
      await addServiceItem(job.id, { name, price, unitPrice: price, quantity: 1, taxRate: 0, status: 'BEKLIYOR' });
      setSelectedOperation('');
      setCustomOperationName('');
      setManualPrice('');
      setActionError('');
    } catch (err) {
      setActionError(err.message || 'Islem eklenirken bir hata olustu.');
    }
  };

  const onItemStatusChange = async (itemId, status) => {
    const result = await updateServiceItemStatus(job.id, itemId, status);
    if (result?.allCompleted) setConfirmComplete(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <BackButton to="/active-jobs" label="Aktif Islere Don" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{job.plate} <span className="text-gray-600 ml-2 text-lg font-medium">/ Servis Detayi</span></h1>
          <p className="text-gray-400 text-sm mt-1">{job.brand} | {job.customer} | Sikayet: {job.complaint || 'Belirtilmemis'}</p>
        </div>
        <span className="bg-[var(--bg-main)] text-sm border px-6 py-2 rounded-full font-black border-[var(--accent)] text-[var(--accent)]">
          DURUM: {displayStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border-soft)]">
          <h3 className="text-base font-bold mb-4 text-gray-300">Is Kalemleri</h3>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 mb-6">
            <select value={selectedOperation} onChange={(event) => setSelectedOperation(event.target.value)} className="p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
              <option value="">Islem Sec...</option>
              {operationOptions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
            </select>
            <input type="number" min="0" step="0.01" value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder="Tutar" className="p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            <button onClick={addItem} className="bg-[var(--accent)] text-white px-8 rounded-lg font-bold hover:brightness-110 transition-all">EKLE</button>
          </div>

          {selectedOperation === 'Ozel Islem' && (
            <input value={customOperationName} onChange={(event) => setCustomOperationName(event.target.value)} placeholder="Ozel islem adi" className="mb-6 w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
          )}
          {actionError && <p className="text-sm font-bold text-red-400 mb-4">{actionError}</p>}

          <div className="space-y-4">
            {isLoadingDetail ? (
              <p className="text-gray-500">Is emri detaylari yukleniyor...</p>
            ) : (job.items || []).length > 0 ? (job.items || []).map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_150px_auto] gap-3 items-center p-4 bg-[var(--bg-main)] rounded-lg border-l-4 border-[var(--accent)]">
                <div>
                  <p className="font-bold text-base">{item.name}</p>
                  <p className="text-[var(--accent)] font-black">{Number(item.price || 0).toLocaleString()} TL</p>
                </div>
                <select value={item.status || 'BEKLIYOR'} onChange={(event) => onItemStatusChange(item.id, event.target.value)} className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-soft)] text-xs font-black text-[var(--text-primary)]">
                  {itemStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                <button onClick={() => removeServiceItem(job.id, item.id)} className="text-[var(--danger)] font-bold hover:underline">Sil</button>
              </div>
            )) : (
              <p className="text-gray-500">Henuz is kalemi eklenmedi.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-soft)] flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-3">Toplam Servis Tutari</h3>
            <div className="text-5xl font-black text-[var(--accent)] mb-6">{Number(job.total || 0).toLocaleString()} <span className="text-3xl">TL</span></div>

            <div className="grid grid-cols-1 gap-3 w-full">

              <select value={job.status} onChange={(event) => setJobStatus(job.id, event.target.value)} className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-strong)] text-[var(--text-primary)]">
                <option value="IN_PROGRESS">Islemde</option>
                <option value="WAITING_PART">Parca Bekliyor</option>
                <option value="COMPLETED">Tamamlandi</option>
              </select>

              <button onClick={() => allItemsCompleted && setConfirmComplete(true)} disabled={!allItemsCompleted} className={`px-6 py-4 font-black rounded-xl transition-all uppercase tracking-widest text-lg shadow-lg ${allItemsCompleted ? 'bg-[var(--success)] text-[var(--text-primary)] hover:brightness-110 active:scale-[0.98]' : 'bg-[var(--bg-main)] text-gray-500 border border-[var(--border-soft)] cursor-not-allowed opacity-70'}`}>
                {allItemsCompleted ? 'Isi Tamamla' : 'Once Tum Kalemleri Tamamla'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Is emri kapatilsin mi?</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Tum alt kalemler tamamlandi. Ana is emrini kapatmak icin onay verin.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmComplete(false)} className="rounded-xl border border-[var(--border-soft)] px-4 py-3 font-bold">Vazgec</button>
              <button onClick={async () => { await completeServiceForm(job.id); setConfirmComplete(false); navigate('/active-jobs'); }} className="rounded-xl bg-[var(--success)] px-4 py-3 font-black text-[var(--text-primary)]">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
