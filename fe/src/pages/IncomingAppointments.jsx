import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { pushToast } from '../lib/toastBus';
import { api } from '../api/velautoApi';

// Modal for Revising an Appointment
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
    } catch (err) {
      pushToast({ type: 'danger', title: 'Hata', message: err.message || 'Revize işlemi başarısız.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">Randevu Revize</h2>
          <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] mb-10">{appointment.plate} • {appointment.customer}</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Önerilen Yeni Tarih & Saat</label>
              <input 
                required 
                type="datetime-local" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)} 
                className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all font-bold" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Bilgilendirme Notu</label>
              <textarea 
                placeholder="Müşteriye gönderilecek açıklama..." 
                rows="4" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full p-5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-3xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all text-sm font-medium resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 p-5 rounded-3xl text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                İptal
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 p-5 bg-[var(--accent)] text-black rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Revize Et & Mail Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function IncomingAppointments() {
  const navigate = useNavigate();
  const { appointments, approveAppointment, reviseAppointment, deleteAppointment, addJob } = useService();
  const [revisingApp, setRevisingApp] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filter for Pending (Incoming) appointments
  const pendingAppointments = useMemo(() => {
    return appointments
      .filter(app => app.status === 'ONAY BEKLİYOR')
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [appointments]);

  const handleApprove = async (app) => {
    setProcessingId(app.id);
    try {
      await approveAppointment(app.id);
      pushToast({ type: 'success', title: 'Randevu Onaylandı', message: `${app.plate} için randevu onaylandı.` });
    } catch (err) {
      pushToast({ type: 'danger', title: 'Hata', message: 'Onaylama işlemi sırasında bir hata oluştu.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app) => {
    if (!window.confirm('Bu randevu talebini reddetmek istediğinize emin misiniz?')) return;
    
    setProcessingId(app.id);
    try {
      await deleteAppointment(app.id);
      pushToast({ type: 'info', title: 'Talep Reddedildi', message: 'Randevu talebi silindi.' });
    } catch (err) {
      pushToast({ type: 'danger', title: 'Hata', message: 'İşlem başarısız.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateJobOrder = async (app) => {
    setProcessingId(app.id);
    try {
      // First approve if not already
      await approveAppointment(app.id);
      
      // Then create job order
      await addJob({
        plate: app.plate,
        customer: app.customer,
        phone: app.phone,
        complaint: app.service,
        status: 'IN_PROGRESS',
        appointmentId: app.id,
        brand: app.brand,
        model: app.model,
      });

      pushToast({ 
        type: 'success', 
        title: 'İş Emri Oluşturuldu', 
        message: `${app.plate} için servis kaydı açıldı ve atölyeye yönlendirildi.` 
      });
      navigate('/active-jobs');
    } catch (err) {
      pushToast({ type: 'danger', title: 'Hata', message: 'İş emri oluşturulamadı.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {revisingApp && (
        <ReviseModal 
          appointment={revisingApp} 
          onClose={() => setRevisingApp(null)} 
          onConfirm={reviseAppointment} 
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Canlı İstek Paneli</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Randevu İstekleri</h1>
          <p className="text-[var(--text-secondary)] font-medium max-w-lg">
            Dışarıdan gelen yeni randevu taleplerini inceleyin, onaylayın veya revize ederek müşteriye geri bildirim gönderin.
          </p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-3xl px-8 py-5 flex items-baseline gap-4 shadow-xl">
          <span className="text-4xl font-black text-[var(--accent)]">{pendingAppointments.length}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Bekleyen Talep</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {pendingAppointments.length === 0 ? (
          <div className="py-32 text-center rounded-[48px] border-2 border-dashed border-[var(--border-soft)] bg-[var(--bg-card)]/30 group">
            <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">📥</div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Henüz Yeni Talep Yok</h3>
            <p className="text-[var(--text-muted)] mt-2 text-sm">Tüm gelen randevu istekleri işleme alınmış durumda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingAppointments.map((app) => (
              <article 
                key={app.id} 
                className="group relative bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[40px] p-8 md:p-10 hover:border-[var(--accent)]/40 transition-all duration-500 shadow-xl overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent)]/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    {/* Top Row: Plate & Date */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="px-5 py-2 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-2xl text-xl font-black text-[var(--text-primary)] tracking-widest shadow-inner">
                        {app.plate}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Talep Edilen Tarih</span>
                        <span className="text-sm font-black text-[var(--text-primary)]">
                          {new Date(app.time).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Customer & Vehicle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Müşteri</p>
                        <p className="font-bold text-[var(--text-primary)]">{app.customer}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{app.phone || 'Telefon belirtilmedi'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Araç Bilgisi</p>
                        <p className="font-bold text-[var(--text-primary)]">{app.brand} {app.model}</p>
                        <p className="text-xs text-[var(--accent)] font-bold">{app.email || 'Email belirtilmedi'}</p>
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Hizmet / Şikayet</p>
                        <p className="text-sm font-medium text-[var(--text-secondary)] line-clamp-2 italic">"{app.service}"</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-wrap items-center gap-3 xl:border-l xl:border-[var(--border-soft)] xl:pl-10">
                    <button
                      onClick={() => handleReject(app)}
                      disabled={processingId === app.id}
                      className="px-6 py-4 rounded-2xl border border-[var(--danger)]/20 text-[var(--danger)] font-black uppercase tracking-widest text-[10px] hover:bg-[var(--danger)]/10 transition-all active:scale-95 disabled:opacity-30"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => setRevisingApp(app)}
                      disabled={processingId === app.id}
                      className="px-6 py-4 rounded-2xl border border-orange-500/20 text-orange-500 font-black uppercase tracking-widest text-[10px] hover:bg-orange-500/10 transition-all active:scale-95 disabled:opacity-30"
                    >
                      Revize Et
                    </button>
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="px-6 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-soft)] text-[var(--text-primary)] font-black uppercase tracking-widest text-[10px] hover:border-[var(--accent)] transition-all active:scale-95 disabled:opacity-30"
                    >
                      Sadece Onayla
                    </button>
                    <button
                      onClick={() => handleCreateJobOrder(app)}
                      disabled={processingId === app.id}
                      className="px-8 py-4 rounded-2xl bg-[var(--accent)] text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-30"
                    >
                      Onayla & İş Emri Aç
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
