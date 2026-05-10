import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';

export default function IsEmriDetay() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { jobs, setJobStatus, completeJob, serviceCatalog, addServiceItem, removeServiceItem, refreshJob } = useService();

    const job = useMemo(() => jobs.find((j) => String(j.id) === String(id)), [id, jobs]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [customOperationName, setCustomOperationName] = useState('');
    const [manualPrice, setManualPrice] = useState('');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadDetail = async () => {
            if (!job?.serviceFormId || (job.items || []).length > 0) return;

            setIsLoadingDetail(true);
            try {
                await refreshJob(job.id);
            } finally {
                if (!cancelled) setIsLoadingDetail(false);
            }
        };

        void loadDetail();

        return () => {
            cancelled = true;
        };
    }, [job, refreshJob]);

    const catalogItems = (serviceCatalog || []).length > 0
        ? serviceCatalog.map((item) => ({ name: item.name }))
        : [
            { name: 'Yağ Değişimi (Motul 5W-30)' },
            { name: 'Fren Balatası Değişimi' },
            { name: 'Hava Filtresi Değişimi' },
            { name: 'Yakıt Filtresi Değişimi' },
            { name: 'Motor Bakımı' },
            { name: 'Fren Hidrolik Bakımı' }
        ];

    const operationOptions = [...new Set([...catalogItems.map((item) => item.name), 'Özel İşlem'])];

    if (!job) {
        return (
            <div className="animate-in fade-in duration-500 text-center p-10">
                <h2 className="text-3xl font-black mb-4">İş emri bulunamadı</h2>
                <p className="text-gray-400 mb-6">Lütfen aktif işlerden birini seçiniz.</p>
                <button onClick={() => navigate('/active-jobs')} className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-bold">Aktif İşlere Dön</button>
            </div>
        );
    }



    // Prefer localized label from context if available
    const displayStatus = job.statusLabel || job.status;

    const statusClasses = (job.statusKey || job.status) === 'COMPLETED'
        ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]'
        : String(job.statusKey || job.status).toUpperCase() === 'WAITING_PART'
            ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]'
            : 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]';

    const canFinalizeJob = (job.statusKey || job.status) === 'COMPLETED';

    const addItem = async () => {
        if (!selectedOperation) {
            setActionError('Lütfen işlem seçin.');
            return;
        }

        const name = selectedOperation === 'Özel İşlem' ? customOperationName.trim() : selectedOperation;
        const price = Number(manualPrice);

        if (!name) {
            setActionError('Özel işlem için ad zorunludur.');
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setActionError('Lütfen geçerli bir tutar girin.');
            return;
        }

        try {
            await addServiceItem(job.id, { name, price, unitPrice: price, quantity: 1, taxRate: 0 });
            setSelectedOperation('');
            setCustomOperationName('');
            setManualPrice('');
            setActionError('');
        } catch (itemError) {
            setActionError(itemError.message || 'Kalem eklenemedi.');
        }
    };

    const onRemoveItem = (itemId) => {
        removeServiceItem(job.id, itemId);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button
                        onClick={() => navigate('/active-jobs')}
                        className="text-gray-500 hover:text-[var(--accent)] transition-colors mb-2 block text-sm font-bold"
                    >
                        ← Aktif İşlere Dön
                    </button>
                    <h1 className="text-3xl font-black tracking-tight">{job.plate} <span className="text-gray-600 ml-2 text-lg font-medium">/ Servis Detayı</span></h1>
                    <p className="text-gray-400 text-sm mt-1">{job.brand} | {job.customer} | Şikayet: {job.complaint || 'Belirtilmemiş'}</p>
                </div>
<<<<<<< Updated upstream
                <span className={`bg-[var(--bg-main)] text-sm border px-6 py-2 rounded-full font-black ${statusClasses}`}>
                    DURUM: {displayStatus}
                </span>
=======
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
>>>>>>> Stashed changes
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border-soft)]">
                    <h3 className="text-base font-bold mb-4 text-gray-300">Fatura Kalemleri</h3>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 mb-6">
                        <select
                            value={selectedOperation}
                            onChange={(e) => setSelectedOperation(e.target.value)}
                            className="p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        >
                            <option value="">İşlem Seç...</option>
                            {operationOptions.map((itemName) => (
                                <option key={itemName} value={itemName}>
                                    {itemName}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(e.target.value)}
                            placeholder="Tutar (TL)"
                            className="p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />

                        <button
                            onClick={addItem}
                            className="bg-[var(--accent)] text-white px-8 rounded-lg font-bold hover:brightness-110 transition-all"
                        >
                            EKLE
                        </button>
                    </div>

                    {selectedOperation === 'Özel İşlem' && (
                        <div className="mb-6">
                            <input
                                type="text"
                                value={customOperationName}
                                onChange={(e) => setCustomOperationName(e.target.value)}
                                placeholder="Özel işlem adı (örn: Acil yol yardımı)"
                                className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                    )}
                    {actionError && <p className="text-sm font-bold text-red-400 mb-4">{actionError}</p>}

                    <div className="space-y-4">
                        {isLoadingDetail ? (
                            <p className="text-gray-500">İş emri detayları yükleniyor...</p>
                        ) : job.items.length > 0 ? job.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-[var(--bg-main)] rounded-lg border-l-4 border-[var(--accent)] group">
                                <div>
                                    <p className="font-bold text-base">{item.name}</p>
                                    <p className="text-[var(--accent)] font-black">{item.price.toLocaleString()} TL</p>
                                </div>
                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-all font-bold hover:underline"
                                >
                                    SİL
                                </button>
                            </div>
                        )) : (
                            <p className="text-gray-500">Henüz fatura kalemi eklenmedi.</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-soft)] flex-1 flex flex-col justify-center items-center text-center">
                        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-3">Toplam Servis Tutarı</h3>
                        <div className="text-5xl font-black text-[var(--accent)] mb-6">
                            {job.total.toLocaleString()} <span className="text-3xl">TL</span>
                        </div>

                        <div className="flex gap-3 w-full">
                            <select
                                value={job.status}
                                onChange={(e) => setJobStatus(job.id, e.target.value)}
                                className="flex-1 p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-strong)] text-[var(--text-primary)]"
                            >
                                <option value="IN_PROGRESS">İşlemde</option>
                                <option value="WAITING_PART">Parça Bekliyor</option>
                                <option value="COMPLETED">Tamamlandı</option>
                            </select>
                            <button
                                onClick={() => {
                                    if (!canFinalizeJob) return;
                                    completeJob(job.id);
                                    navigate('/active-jobs');
                                }}
                                disabled={!canFinalizeJob}
                                className={`px-6 py-4 font-black rounded-xl transition-all uppercase tracking-widest text-lg shadow-lg ${canFinalizeJob ? 'bg-[var(--success)] text-[var(--text-primary)] hover:brightness-110 active:scale-[0.98]' : 'bg-[var(--bg-main)] text-gray-500 border border-[var(--border-soft)] cursor-not-allowed opacity-70'}`}
                            >
                                {canFinalizeJob ? 'İŞİ TAMAMLA' : 'ÖNCE DURUMU TAMAMLA'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}