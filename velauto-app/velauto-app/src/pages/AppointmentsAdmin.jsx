import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';

const STATUS_STORAGE_KEY = 'velauto_admin_appointment_status_v1';

const loadStatusOverrides = () => {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

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
  const { appointments, approveAppointment, addJob } = useService();
  const [viewMode, setViewMode] = useState('DAILY');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusOverrides, setStatusOverrides] = useState(loadStatusOverrides);
  const [convertingId, setConvertingId] = useState(null);

  const setOverride = (id, status) => {
    setStatusOverrides((prev) => {
      const next = { ...prev, [id]: status };
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getStatus = (appointment) => {
    return statusOverrides[appointment.id] || (appointment.status === 'ONAYLI' ? 'APPROVED' : 'PENDING');
  };

  const range = useMemo(() => {
    const base = startOfDay(`${selectedDate}T00:00:00`);
    if (viewMode === 'DAILY') {
      return { from: base, to: endOfDay(base) };
    }
    const from = startOfDay(base);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from, to: endOfDay(to) };
  }, [selectedDate, viewMode]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .map((appointment) => ({ ...appointment, _status: getStatus(appointment) }))
      .filter((appointment) => {
        const date = new Date(appointment.time);
        if (Number.isNaN(date.getTime())) return false;
        return date >= range.from && date <= range.to;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [appointments, range.from, range.to, statusOverrides]);

  const stats = useMemo(() => {
    const pending = filteredAppointments.filter((appointment) => appointment._status === 'PENDING').length;
    const approved = filteredAppointments.filter((appointment) => appointment._status === 'APPROVED').length;
    const cancelled = filteredAppointments.filter((appointment) => appointment._status === 'CANCELLED').length;
    return { total: filteredAppointments.length, pending, approved, cancelled };
  }, [filteredAppointments]);

  const handleApprove = async (id) => {
    await approveAppointment(id);
    setOverride(id, 'APPROVED');
  };

  const handleCancel = (id) => {
    setOverride(id, 'CANCELLED');
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
      });
      setOverride(appointment.id, 'CONVERTED');
      pushToast({ type: 'success', title: 'İş emrine aktarıldı', message: `${appointment.plate} için servis kaydı oluşturuldu.` });
      navigate('/active-jobs');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Takvim Paneli</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Randevu Takvimi</h1>
        <p className="text-[var(--text-secondary)] mt-2">Günlük/haftalık yoğunluğu izle, hızlı onay/red ver, randevuyu iş emrine dönüştür.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Toplam</p><p className="text-2xl font-black mt-2">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Bekleyen</p><p className="text-2xl font-black mt-2 text-[var(--danger)]">{stats.pending}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">Onaylı</p><p className="text-2xl font-black mt-2 text-[var(--success)]">{stats.approved}</p></div>
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]"><p className="text-xs uppercase font-black text-[var(--text-muted)]">İptal</p><p className="text-2xl font-black mt-2 text-[var(--text-secondary)]">{stats.cancelled}</p></div>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
            <option value="DAILY">Günlük Görünüm</option>
            <option value="WEEKLY">Haftalık Görünüm</option>
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
            return (
              <article key={appointment.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(appointment.time).toLocaleString('tr-TR')}</p>
                    <h3 className="text-xl font-black text-[var(--text-primary)] mt-1">{appointment.plate}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{appointment.customer} • {appointment.phone || 'Telefon yok'}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{appointment.service}</p>
                  </div>

                  <div className="space-y-2 min-w-[220px]">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
                      status === 'APPROVED'
                        ? 'border-[var(--success)]/40 text-[var(--success)] bg-[var(--success)]/10'
                        : status === 'CANCELLED'
                          ? 'border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10'
                          : status === 'CONVERTED'
                            ? 'border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10'
                            : 'border-[var(--border-soft)] text-[var(--text-secondary)] bg-white'
                    }`}>
                      {status === 'PENDING' ? 'Bekliyor' : status === 'APPROVED' ? 'Onaylı' : status === 'CANCELLED' ? 'İptal' : 'İş Emrine Aktarıldı'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(appointment.id)}
                        disabled={status !== 'PENDING'}
                        className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[var(--success)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(appointment.id)}
                        disabled={status === 'CONVERTED'}
                        className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-[var(--danger)]/40 text-[var(--danger)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConvertToJob(appointment)}
                        disabled={status !== 'APPROVED' || convertingId === appointment.id}
                        className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[var(--accent)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {convertingId === appointment.id ? 'Aktarılıyor' : 'İş Emri Aç'}
                      </button>
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
