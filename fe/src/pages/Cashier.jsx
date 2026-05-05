import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

export default function Kasa() {
    const navigate = useNavigate();
    const { payments, processPayment } = useService();

    const [selectedId, setSelectedId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const selectedVehicle = payments.find(v => v.id === selectedId);

    useEffect(() => {
        if (!selectedId && payments.length > 0) setSelectedId(payments[0].id);
        if (selectedId && !payments.find(p => p.id === selectedId)) setSelectedId(payments[0]?.id ?? null);
    }, [payments, selectedId]);

    useEffect(() => {
        if (selectedVehicle) {
            setPaymentAmount(String(selectedVehicle.amount));
        } else {
            setPaymentAmount('');
        }
    }, [selectedVehicle]);

    const handlePayment = async (method) => {
        if (!selectedVehicle) return;
        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            pushToast({ type: 'error', title: 'Tahsilat başarısız', message: 'Lütfen geçerli bir tahsilat tutarı girin.' });
            return;
        }

        if (amount > Number(selectedVehicle.amount)) {
            pushToast({ type: 'error', title: 'Tahsilat başarısız', message: 'Tahsilat tutarı kalan bakiyeden büyük olamaz.' });
            return;
        }

        try {
            setIsProcessing(true);
            const result = await processPayment(selectedId, method, amount);
            if (!result?.success) {
                pushToast({ type: 'error', title: 'Tahsilat başarısız', message: result?.message || 'Tahsilat işlemi başarısız.' });
                return;
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black mb-8 tracking-tight">Kasa & Tahsilat Paneli</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Sol Sütun: Ödeme Bekleyen Araçlar */}
                <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border-soft)]">
                    <h3 className="text-base font-bold mb-4 text-gray-400 border-b border-[var(--border-soft)] pb-3">Ödeme Bekleyenler (Hazır Araçlar)</h3>

                    <div className="space-y-3">
                        {payments.length > 0 ? (
                            payments.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:brightness-125 ${selectedId === item.id ? 'bg-[var(--bg-hover)] border-[var(--accent)]' : 'bg-[var(--bg-main)] border-gray-600'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)]">{item.plate}</h3>
                                            <p className="text-gray-500 font-medium text-sm">{item.owner}</p>
                                        </div>
                                        <div className="text-xl font-black text-[var(--accent)]">
                                            {item.amount.toLocaleString()} TL
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-10">Ödeme bekleyen araç bulunmuyor. </p>
                        )}
                    </div>
                </div>

                {/* Sağ Sütun: Tahsilat Ekranı */}
                {selectedVehicle && (
                    <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-soft)] text-center flex flex-col justify-center">
                        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">
                            {selectedVehicle.plate} İÇİN TAHSİLAT TUTARI
                        </h3>
                        <h1 className="text-6xl font-black text-[var(--accent)] my-8 animate-pulse">
                            {selectedVehicle.amount.toLocaleString()} <span className="text-2xl text-[var(--text-primary)]">TL</span>
                        </h1>

                        <div className="bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl p-4 text-left mb-4">
                            <label className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-secondary)] font-black block mb-2">Alınacak Tutar</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="flex-1 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    placeholder="Tahsilat tutarı"
                                />
                                <span className="text-sm font-black text-[var(--text-secondary)]">TL</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">Kalan bakiye: {Number(selectedVehicle.amount).toLocaleString()} TL</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <button
                                onClick={() => handlePayment('NAKİT')}
                                disabled={isProcessing}
                                className="bg-[var(--success)] p-6 rounded-xl text-[var(--text-primary)] font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex flex-col items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span></span>NAKİT
                            </button>
                            <button
                                onClick={() => handlePayment('KREDİ KARTI')}
                                disabled={isProcessing}
                                className="bg-[var(--border-strong)] p-6 rounded-xl text-[var(--text-primary)] font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex flex-col items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span></span> KART
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}