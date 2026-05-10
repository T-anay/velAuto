import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

// Modern Revise Modal Component
function ReviseModal({ appointment, onClose, onConfirm }) {
  const [newDate, setNewDate] = useState(appointment.time?.slice(0, 16) || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(appointment.id, newDate, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b1d21] border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <h2 className="text-2xl font-black text-white mb-2">Randevuyu Revize Et</h2>
        <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-8">{appointment.plate} - {appointment.customer}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Yeni Tarih & Saat</label>
            <input 
              required 
              type="datetime-local" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)} 
              className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-[var(--accent)] transition-all font-bold" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Müşteriye Not (E-posta ile gidecek)</label>
            <textarea 
              placeholder="Örn: Belirttiğiniz saatte yoğunluk olduğu için 1 saat sonrasına revize edilmiştir." 
              rows="4" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-[var(--accent)] transition-all text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Vazgeç</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 p-4 bg-[var(--accent)] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {isSubmitting ? 'Güncelleniyor...' : 'Revize Et & Mail Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export default function AppointmentsAdmin() {
  const navigate = useNavigate();
  const { appointments, approveAppointment, reviseAppointment, addJob, getAppointmentStatus, setAppointmentOverride } = useService();
  const [viewMode, setViewMode] = useState('DAILY');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [convertingId, setConvertingId] = useState(null);
  const [revisingApp, setRevisingApp] = useState(null);

  const range = useMemo(() => {
    const base = startOfDay(`${selectedDate}T00:00:00`);
    if (viewMode === 'DAILY') {
      return { from: base, to: endOfDay(base) };
    }
    if (viewMode === 'WEEKLY') {
      const from = startOfDay(base);
      const to = new Date(from);
      to.setDate(to.getDate() + 6);
      return { from, to: endOfDay(to) };
    }
    if (viewMode === 'MONTHLY') {
      const from = new Date(base.getFullYear(), base.getMonth(), 1);
      const to = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      return { from, to: endOfDay(to) };
    }
    if (viewMode === 'YEARLY') {
      const from = new Date(base.getFullYear(), 0, 1);
      const to = new Date(base.getFullYear(), 11, 31);
      return { from, to: endOfDay(to) };
    }
    return { from: base, to: endOfDay(base) };
  }, [selectedDate, viewMode]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .map((appointment) => {
        const statusObj = getAppointmentStatus(appointment);
        return { ...appointment, _status: statusObj.status, _convertedAt: statusObj.at };
      })
      .filter((appointment) => {
        const date = new Date(appointment.time);
        if (Number.isNaN(date.getTime())) return false;
        return date >= range.from && date <= range.to;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [appointments, range.from, range.to, getAppointmentStatus]);

  const stats = useMemo(() => {
    const pending = filteredAppointments.filter((appointment) => appointment._status === 'PENDING').length;
    const approved = filteredAppointments.filter((appointment) => appointment._status === 'APPROVED').length;
    const revised = filteredAppointments.filter((appointment) => appointment._status === 'REVISED').length;
    return { total: filteredAppointments.length, pending, approved, revised };
  }, [filteredAppointments]);

  const handleApprove = async (id) => {
    await approveAppointment(id);
    setAppointmentOverride(id, 'APPROVED');
  };

  const handleCancel = (id) => {
    setAppointmentOverride(id, 'CANCELLED');
    pushToast({ type: 'info', title: 'Randevu iptal edildi', message: 'Takvim durumu iptal olarak işaretlendi.' });
  };

  const handleConvertToJob = async (appointment) => {
    try {
      setConvertingId(appointment.id);
      await addJob({
        plate: appointment.plate,
        customer: appointment.customer,
        phone: appointment.phone,
        complaint: appointment.service,
        status: 'IN_PROGRESS',
        appointmentId: appointment.id,
        brand: appointment.brand,
        model: appointment.model,
      });
      setAppointmentOverride(appointment.id, 'CONVERTED');
      pushToast({ type: 'success', title: 'İş emrine aktarıldı', message: `${appointment.plate} için servis kaydı oluşturuldu.` });
      navigate('/active-jobs');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {revisingApp && (
        <ReviseModal 
          appointment={revisingApp} 
          onClose={() => setRevisingApp(null)} 
          onConfirm={reviseAppointment} 
        />
      )}

      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Takvim Paneli</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Randevu Takvimi</h1>
        <p className="text-[var(--text-secondary)] mt-2">Günlük/haftalık/aylık/yıllık yoğunluğu izle, hızlı onay/red ver veya randevuyu revize et.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Toplam</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Bekleyen</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.pending}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Onaylı</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{stats.approved}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Revize</p><p className="text-2xl font-black mt-2 text-orange-500">{stats.revised}</p></div>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
            <option value="DAILY">Günlük Görünüm</option>
            <option value="WEEKLY">Haftalık Görünüm</option>
            <option value="MONTHLY">Aylık Görünüm</option>
            <option value="YEARLY">Yıllık Görünüm</option>
          </select>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
          <div className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-sm text-[var(--text-secondary)]">
            Aralık: {range.from.toLocaleDateString('tr-TR')} - {range.to.toLocaleDateString('tr-TR')}
          </div>
        </div>

        <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
          {filteredAppointments.length === 0 && <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-soft)] text-[var(--text-secondary)]">Bu aralıkta randevu yok.</div>}

          {filteredAppointments.map((appointment) => {
            const status = appointment._status;
            const statusLabel = appointment.statusLabel || (status === 'PENDING' ? 'Bekliyor' : status === 'APPROVED' ? 'Onaylı' : status === 'CANCELLED' ? 'İptal' : 'Revize Edildi');
            
            return (
              <article key={appointment.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 hover:border-[var(--accent)] transition-all">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(appointment.time).toLocaleString('tr-TR')}</p>
                      {appointment.status === 'REVISED' && <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-widest">Revize</span>}
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] mt-1">{appointment.plate}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{appointment.customer} • {appointment.phone || 'Telefon yok'}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{appointment.service}</p>
                  </div>

                  <div className="space-y-2 min-w-[220px]">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
                          status === 'APPROVED' ? 'border-[var(--success)]/40 text-[var(--success)] bg-[var(--success)]/10'
                        : status === 'CANCELLED' ? 'border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10'
                        : status === 'REVISED' ? 'border-orange-500/40 text-orange-500 bg-orange-500/10'
                        : status === 'CONVERTED' ? 'border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border-soft)] text-[var(--text-secondary)] bg-white'
                        }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {status === 'PENDING' || status === 'REVISED' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(appointment.id)}
                            className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--success)] text-white hover:brightness-110"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevisingApp(appointment)}
                            className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-500/40 text-orange-500 hover:bg-orange-500/5"
                          >
                            Revize
                          </button>
                        </>
                      ) : status === 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => handleConvertToJob(appointment)}
                          disabled={convertingId === appointment.id}
                          className="col-span-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--accent)] text-white"
                        >
                          {convertingId === appointment.id ? 'Aktarılıyor' : 'İş Emri Aç'}
                        </button>
                      ) : null}
                      
                      {status !== 'CANCELLED' && status !== 'CONVERTED' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(appointment.id)}
                          className="col-span-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-red-500/5"
                        >
                          Randevuyu İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
