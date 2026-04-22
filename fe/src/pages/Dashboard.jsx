// src/pages/Dashboard.jsx için konsept tasarım
import React from 'react';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Üst Bilgi Başlığı ve Ana Buton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Atölye Özeti</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Bugünkü servis durumu ve aktif işler</p>
        </div>
         
      </div>

      {/* İstatistik Kartları (Kompakt Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Örnek StatCard Tasarımı */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-soft)] shadow-soft flex flex-col transition-transform hover:-translate-y-1">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Aktif İşler</span>
          <span className="text-4xl font-black text-[var(--text-primary)] mt-2">12</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-soft)] shadow-soft flex flex-col transition-transform hover:-translate-y-1">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Bekleyen Onaylar</span>
          <span className="text-4xl font-black text-[var(--danger)] mt-2">3</span>
        </div>
        
       </div>

      {/* Alt İçerik: Listeler ve Detaylar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Geniş Alan: Son İşlemler tablosu/listesi */}
        <div className="col-span-2 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-soft)] shadow-medium">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Devam Eden İşlemler</h3>
          
          {/* Kompakt Liste Elemanı Örneği */}
          <div className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] rounded-xl border border-transparent hover:border-[var(--border-soft)] transition-colors cursor-pointer">
            <div>
              <div className="font-bold text-[var(--text-primary)]">34 ABC 123</div>
              <div className="text-sm text-[var(--text-secondary)]">Ahmet Yılmaz • Periyodik Bakım</div>
            </div>
            <span className="text-xs font-bold bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full">İŞLEMDE</span>
          </div>
          
        </div>

        {/* Dar Alan: Randevular */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-soft)] shadow-medium">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Yaklaşan Randevular</h3>
          <div className="text-sm text-[var(--text-secondary)] text-center py-8">
            Bugün için başka randevu yok.
          </div>
        </div>
      </div>

    </div>
  );
}