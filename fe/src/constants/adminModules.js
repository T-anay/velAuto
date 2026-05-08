export const adminModules = {
  profile: {
    path: '/profil',
    title: 'Kullanıcı Profili',
    eyebrow: 'White Mode / Güvenlik',
    description: 'Giriş yapan personelin iletişim, rol ve şube bilgileri ile performans özetini tek ekranda gösterir.',
    backend: 'UserController, UserProfileDto, ChangePasswordDto',
    accent: 'Profil güncelleme ve güvenli şifre yenileme için merkez ekran.',
    stats: [
      { label: 'Tamamlanan İş', value: '128' },
      { label: 'Aktif Form', value: '9' },
      { label: 'Rol', value: 'STAFF' },
      { label: 'Şube', value: 'Merkez' },
    ],
    sections: [
      {
        title: 'Profil Bilgileri',
        items: ['Ad, soyad ve rol görüntüleme', 'Bağlı şube / tenant bilgisi', 'İletişim bilgilerini güncelleme'],
      },
      {
        title: 'Şifre Güvenliği',
        items: ['PUT /api/users/change-password', 'Güçlü parola kontrolü', 'Oturum güvenliği odağı'],
      },
      {
        title: 'Performans Özeti',
        items: ['Bitirilen iş toplamı', 'Dahil olunan aktif servis formları', 'Hızlı durum takibi'],
      },
    ],
    primaryAction: 'Profili Güncelle',
    secondaryAction: 'Şifreyi Yenile',
  },
  expenses: {
    path: '/giderler',
    title: 'Gider Yönetimi',
    eyebrow: 'Muhasebe / Kasa Uyumu',
    description: 'Dükkân giderlerini kategori bazlı kaydedip net kâr etkisini servis gelirleriyle birlikte izler.',
    backend: 'ExpenseController, ExpenseCategory',
    accent: 'Gider girişleri ve filtrelenmiş muhasebe görünümü.',
    stats: [
      { label: 'Aylık Gider', value: '₺84.200' },
      { label: 'Kategori', value: '7' },
      { label: 'Net Kâr', value: '₺126.450' },
      { label: 'Ödeme Kaydı', value: '312' },
    ],
    sections: [
      {
        title: 'Kategori Girişi',
        items: ['Kira', 'Elektrik', 'Su', 'Yedek parça alımı', 'Personel maaşı'],
      },
      {
        title: 'Filtreleme',
        items: ['Tarih aralığı', 'Kategori bazlı arama', 'Hızlı muhasebe özetleri'],
      },
      {
        title: 'Kasa Uyumu',
        items: ['Ödeme etkisi', 'Net kâr analizi', 'Gelir / gider dengesi'],
      },
    ],
    primaryAction: 'Gider Ekle',
    secondaryAction: 'Raporu İndir',
  },
  staff: {
    path: '/personel',
    title: 'Personel ve Yetki',
    eyebrow: 'ADMIN / SUPER_ADMIN',
    description: 'Yeni usta ve çırak ekleme, rol atama ve pasif hesap yönetimi için personel paneli.',
    backend: 'Role, UserService',
    accent: 'Yetki seviyeleri ve aktiflik durumu tek merkezde.',
    stats: [
      { label: 'Aktif Personel', value: '14' },
      { label: 'ADMIN', value: '3' },
      { label: 'STAFF', value: '11' },
      { label: 'Pasif Hesap', value: '2' },
    ],
    sections: [
      {
        title: 'Yeni Personel',
        items: ['Usta / çırak ekleme', 'Rol seçimi', 'Dükkan erişim seviyesi'],
      },
      {
        title: 'Yetkilendirme',
        items: ['Kendi işi', 'Tüm kasa erişimi', 'Admin yetkisi yönetimi'],
      },
      {
        title: 'Aktiflik',
        items: ['Hesabı pasife çekme', 'İşten ayrılan personel arşivi', 'Güvenli erişim kontrolü'],
      },
    ],
    primaryAction: 'Personel Ekle',
    secondaryAction: 'Yetki Düzenle',
  },
  appointments: {
    path: '/randevular',
    title: 'Randevu Takvimi',
    eyebrow: 'Günlük / Haftalık Takip',
    description: 'Bekleyen randevuları onaylayıp, zamanı gelen araçları tek tuşla aktif iş emrine dönüştürür.',
    backend: 'AppointmentController, AppointmentStatus',
    accent: 'Takvim yoğunluğu ve hızlı randevu yönetimi.',
    stats: [
      { label: 'Bugün', value: '18' },
      { label: 'Onay Bekliyor', value: '4' },
      { label: 'Bu Hafta', value: '63' },
      { label: 'Aktif Servis', value: '27' },
    ],
    sections: [
      {
        title: 'Takvim Görünümü',
        items: ['Günlük yoğunluk', 'Haftalık yoğunluk', 'Bekleyen randevular'],
      },
      {
        title: 'Hızlı Karar',
        items: ['APPROVED', 'CANCELLED', 'Servis formuna dönüştürme'],
      },
      {
        title: 'Aktif İşe Aktarma',
        items: ['Randevu verilerini taşıma', 'Tek tuşla iş emri oluşturma', 'Dükkân girişi otomasyonu'],
      },
    ],
    primaryAction: 'Takvimi Aç',
    secondaryAction: 'Bekleyenleri Gör',
  },
  ai: {
    path: '/ai-analiz',
    title: 'Akıllı Teşhis ve AI Analizi',
    eyebrow: 'Gemini / Vertex AI',
    description: 'Müşteri şikayeti ve görsel verilerden olası arıza kalemlerini öneren teşhis ekranı.',
    backend: 'Gemini AI Entegrasyonu, application.yaml (Vertex AI)',
    accent: 'Metin ve görsel analiz destekli öneri paneli.',
    stats: [
      { label: 'Analiz', value: '2.941' },
      { label: 'Görsel', value: '1.208' },
      { label: 'Öneri Doğruluğu', value: '%87' },
      { label: 'Kritik Uyarı', value: '19' },
    ],
    sections: [
      {
        title: 'Metin Analizi',
        items: ['Titreme yapması', 'Geç çalışma', 'Fren sesi', 'Olası arıza kalemleri'],
      },
      {
        title: 'Görsel İşleme',
        items: ['Hasar fotoğrafı', 'Muayene raporu', 'Otomatik kalem eşleştirme'],
      },
      {
        title: 'Teşhis Akışı',
        items: ['Ön analiz', 'Servis önerisi', 'Ustaya hazır özet'],
      },
    ],
    primaryAction: 'Analizi Başlat',
    secondaryAction: 'Fotoğraf Yükle',
  },
  audits: {
    path: '/sistem-kayitlari',
    title: 'Denetim İzleri',
    eyebrow: 'Admin Only / Audit Logs',
    description: 'Fiyat, stok ve yetki değişimlerinin kim tarafından ve ne zaman yapıldığını şeffaf biçimde gösterir.',
    backend: 'AuditLogRepository, AuditLogService',
    accent: 'Kritik veri değişiklikleri için denetim paneli.',
    stats: [
      { label: 'Bugün', value: '84' },
      { label: 'Fiyat Değişimi', value: '11' },
      { label: 'Yetki Değişimi', value: '6' },
      { label: 'Stok Kayıtları', value: '27' },
    ],
    sections: [
      {
        title: 'İşlem Takibi',
        items: ['Kullanıcı', 'Saat', 'Servis formu fiyat değişimi'],
      },
      {
        title: 'Güvenlik Denetimi',
        items: ['Fiyat değişiklikleri', 'Stok hareketleri', 'Yetki atamaları'],
      },
      {
        title: 'Şeffaf Kayıt',
        items: ['Arşivlenmiş hareketler', 'Filtrelenebilir log listesi', 'Admin görünümü'],
      },
    ],
    primaryAction: 'Logları Aç',
    secondaryAction: 'Kritik Filtre',
  },
  notifications: {
    path: '/bildirimler',
    title: 'Bildirim Merkezi',
    eyebrow: 'Sistem Uyarıları',
    description: 'Düşük stok, iş tamamlanması ve ödeme alındığında ortaya çıkan sistem içi uyarıları toplar.',
    backend: 'NotificationService, Notification Entity',
    accent: 'Operasyonel olayları tek akışta görünür kılar.',
    stats: [
      { label: 'Okunmamış', value: '7' },
      { label: 'Stok Uyarısı', value: '3' },
      { label: 'İş Bildirimi', value: '9' },
      { label: 'Bugün', value: '18' },
    ],
    sections: [
      {
        title: 'Düşük Stok Uyarısı',
        items: ['Parça stoğu azaldı', 'Admin bildirimi', 'Hızlı aksiyon'],
      },
      {
        title: 'İş Durumu',
        items: ['İş tamamlandı', 'Ödeme alındı', 'Sistem içi anlık uyarı'],
      },
      {
        title: 'Bildirim Akışı',
        items: ['Okundu / okunmadı', 'Öncelik seviyeleri', 'Arşiv görünümü'],
      },
    ],
    primaryAction: 'Bildirimleri Gör',
    secondaryAction: 'Sessize Al',
  },
  invoices: {
    path: '/faturalar',
    title: 'Fatura ve Finansal Raporlama',
    eyebrow: 'Invoice / Payment',
    description: 'Tamamlanan işlerin resmi fatura görünümü ve parçalı ödeme geçmişi için raporlama ekranı.',
    backend: 'InvoiceController, PaymentController',
    accent: 'Fatura, ödeme ve tahsilat geçmişi.',
    stats: [
      { label: 'Fatura', value: '226' },
      { label: 'Kısmi Ödeme', value: '41' },
      { label: 'Bugünkü Ciro', value: '₺57.900' },
      { label: 'Tahsilat', value: '%94' },
    ],
    sections: [
      {
        title: 'Resmi Fatura',
        items: ['Tamamlanan işler', 'Profesyonel döküm', 'Kurumsal çıktı'],
      },
      {
        title: 'Ödeme Geçmişi',
        items: ['Nakit + kart', 'Parçalı ödeme', 'Tahsilat takibi'],
      },
      {
        title: 'Finansal Rapor',
        items: ['Gelir listesi', 'Ödeme özeti', 'Kasa analizi'],
      },
    ],
    primaryAction: 'Faturaları Aç',
    secondaryAction: 'Ödeme Geçmişi',
  },
};

export const adminModuleList = [
  adminModules.profile,
  adminModules.expenses,
  adminModules.staff,
  adminModules.appointments,
  adminModules.ai,
  adminModules.audits,
  adminModules.invoices,
];
