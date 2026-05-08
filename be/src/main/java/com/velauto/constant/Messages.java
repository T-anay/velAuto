package com.velauto.constant;

public class Messages {
  // Auth
  public static final String USER_NOT_FOUND = "Kullanıcı sistemde bulunamadı.";
  public static final String USER_DELETED = "Kullanıcı hesabı silinmiş.";
  public static final String USER_INACTIVE = "Kullanıcı hesabı aktif değil.";
  public static final String EMAIL_ALREADY_EXISTS = "Bu e-posta adresi zaten kullanımda.";
  public static final String INVALID_PASSWORD = "Şifre hatalı, lütfen tekrar deneyiniz.";
  public static final String PASSWORD_POLICY_VIOLATION = "Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.";
  public static final String UNMATCHED_PASSWORDS = "Girdiğiniz şifreler birbiriyle eşleşmiyor.";
  public static final String PASSWORDS_DO_NOT_MATCH = "Yeni şifre ve şifre tekrarı eşleşmiyor.";
  public static final String OLD_PASSWORD_INCORRECT = "Mevcut şifreniz hatalı.";
  public static final String INSUFFICIENT_PERMISSIONS = "Bu işlem için yeterli yetkiniz bulunmuyor.";

  // Password Reset
  public static final String INVALID_RESET_TOKEN = "Geçersiz şifre sıfırlama bağlantısı.";
  public static final String RESET_TOKEN_EXPIRED = "Şifre sıfırlama bağlantısının süresi dolmuş.";
  public static final String RESET_TOKEN_USED = "Bu şifre sıfırlama bağlantısı daha önce kullanılmış.";
  public static final String REFRESH_TOKEN_EXPIRED = "Refresh token süresi dolmuş, lütfen tekrar giriş yapın.";

  // Security
  public static final String ACCESS_DENIED = "Bu sayfaya erişim yetkiniz bulunmuyor.";
  public static final String UNAUTHORIZED = "Bu işlem için giriş yapmalısınız.";
  public static final String TOKEN_EXPIRED = "Oturum süreniz doldu, lütfen tekrar giriş yapın.";
  public static final String UNAUTHORIZED_ACCESS = "Bu kaynağa erişim yetkiniz yok.";

  // Customer
  public static final String CUSTOMER_NOT_FOUND = "Müşteri bulunamadı.";
  public static final String CUSTOMER_DELETED = "Silinen müşteri güncellenemez.";
  public static final String CUSTOMER_PHONE_REQUIRED = "Telefon numarası boş bırakılamaz.";
  public static final String CUSTOMER_FULLNAME_REQUIRED = "Ad-soyad boş bırakılamaz.";

  // Vehicle
  public static final String VEHICLE_NOT_FOUND = "Araç kaydı bulunamadı.";
  public static final String VEHICLE_DELETED = "Silinen araç güncellenemez.";
  public static final String VEHICLE_CUSTOMER_MISMATCH = "Seçilen araç müşteriye ait değildir.";
  public static final String VEHICLE_LICENSE_PLATE_REQUIRED = "Plaka boş bırakılamaz.";
  public static final String VEHICLE_LICENSE_PLATE_SIZE = "Plaka maksimum 20 karakter olmalıdır.";
  public static final String VEHICLE_CUSTOMER_ID_POSITIVE = "Müşteri ID pozitif bir sayı olmalıdır.";
  public static final String VEHICLE_BRAND_ID_REQUIRED = "Marka ID zorunludur.";
  public static final String VEHICLE_BRAND_ID_POSITIVE = "Marka ID pozitif bir sayı olmalıdır.";
  public static final String VEHICLE_MODEL_ID_REQUIRED = "Model ID zorunludur.";
  public static final String VEHICLE_MODEL_ID_POSITIVE = "Model ID pozitif bir sayı olmalıdır.";
  public static final String VEHICLE_YEAR_MIN = "Üretim yılı 1900'den sonra olmalıdır.";
  public static final String VEHICLE_YEAR_MAX = "Üretim yılı 2100'den önce olmalıdır.";
  public static final String VEHICLE_CHASSIS_NUMBER_SIZE = "Şase no maksimum 50 karakter olmalıdır.";
  public static final String VEHICLE_COLOR_SIZE = "Renk maksimum 30 karakter olmalıdır.";
  public static final String VEHICLE_ODOMETER_MIN = "Kilometre sıfırdan az olamaz.";

  // ServiceCatalog
  public static final String SERVICE_CATALOG_NOT_FOUND = "Hizmet kataloğu bulunamadı.";
  public static final String SERVICE_CATALOG_NAME_REQUIRED = "Hizmet adı boş bırakılamaz.";
  public static final String SERVICE_CATALOG_NAME_SIZE = "Hizmet adı 2-100 karakter arasında olmalıdır.";
  public static final String SERVICE_CATALOG_NAME_ALREADY_EXISTS = "Bu adda hizmet kataloğu zaten mevcut.";
  public static final String SERVICE_CATALOG_PRICE_INVALID = "Hizmet fiyatı 0'dan büyük olmalıdır.";
  public static final String SERVICE_CATALOG_DESCRIPTION_SIZE = "Açıklama maksimum 1000 karakter olmalıdır.";
  public static final String SERVICE_CATALOG_PRICE_DIGITS = "Fiyat maksimum 8 rakam ve 2 ondalık basamak olmalıdır.";
  public static final String SERVICE_CATALOG_DELETED = "Silinen hizmet kataloğu güncellenemez.";
  public static final String SERVICE_CATALOG_ALREADY_DELETED = "Hizmet kataloğu zaten silinmiş.";

  // Appointment
  public static final String APPOINTMENT_NOT_FOUND = "Randevu bulunamadı.";
  public static final String APPOINTMENT_REQUEST_INVALID = "Randevu isteği geçersiz.";
  public static final String APPOINTMENT_DATE_INVALID = "Randevu tarihi gelecekte olmalıdır.";
  public static final String APPOINTMENT_DELETED = "Silinen randevu güncellenemez.";
  public static final String APPOINTMENT_ALREADY_DELETED = "Randevu zaten silinmiş.";
  public static final String INVALID_DATE_RANGE = "Başlangıç tarihi bitiş tarihinden sonra olamaz.";
  public static final String APPOINTMENT_CUSTOMER_ID_REQUIRED = "Müşteri ID boş bırakılamaz.";
  public static final String APPOINTMENT_VEHICLE_ID_REQUIRED = "Araç ID boş bırakılamaz.";
  public static final String APPOINTMENT_DATE_REQUIRED = "Randevu tarihi boş bırakılamaz.";
  public static final String APPOINTMENT_NOTES_SIZE = "Notlar 1000 karakterden fazla olamaz.";

  // ServiceForm
  public static final String SERVICE_FORM_NOT_FOUND = "Servis formu bulunamadı.";
  public static final String SERVICE_FORM_DELETED = "Silinen servis formu güncellenemez.";
  public static final String SERVICE_FORM_ALREADY_DELETED = "Servis formu zaten silinmiş.";
  public static final String SERVICE_FORM_KM_INVALID = "Güncel kilometre, aracın son kaydedilen kilometresinden düşük olamaz.";
  public static final String SERVICE_FORM_ALREADY_EXISTS_FOR_APPOINTMENT = "Bu randevu için zaten bir servis formu mevcut.";
  public static final String SERVICE_FORM_VEHICLE_ID_REQUIRED = "Araç ID boş bırakılamaz.";
  public static final String SERVICE_FORM_CUSTOMER_ID_REQUIRED = "Müşteri ID boş bırakılamaz.";
  public static final String SERVICE_FORM_KM_REQUIRED = "Güncel kilometre boş bırakılamaz.";
  public static final String SERVICE_FORM_KM_MIN = "Kilometre 0'dan küçük olamaz.";
  public static final String SERVICE_FORM_COMPLAINTS_SIZE = "Şikayetler 2000 karakterden fazla olamaz.";
  public static final String SERVICE_FORM_CONDITION_SIZE = "Genel durum 2000 karakterden fazla olamaz.";

  // ServiceFormItem
  public static final String SERVICE_FORM_ITEM_NOT_FOUND = "Servis formu kalemi bulunamadı.";
  public static final String SERVICE_FORM_ITEM_DELETED = "Silinen servis formu kalemi güncellenemez.";
  public static final String SERVICE_FORM_ITEM_ALREADY_DELETED = "Servis formu kalemi zaten silinmiş.";
  public static final String SERVICE_FORM_ITEM_SERVICE_FORM_ID_REQUIRED = "Servis formu ID boş bırakılamaz.";
  public static final String SERVICE_FORM_ITEM_SERVICE_CATALOG_ID_REQUIRED = "Hizmet kataloğu ID boş bırakılamaz.";
  public static final String SERVICE_FORM_ITEM_QUANTITY_REQUIRED = "Miktar boş bırakılamaz.";
  public static final String SERVICE_FORM_ITEM_QUANTITY_MIN = "Miktar 1'den az olamaz.";
  public static final String SERVICE_FORM_ITEM_QUANTITY_MAX = "Miktar 1000'den fazla olamaz.";
  public static final String SERVICE_FORM_COMPLETED = "Tamamlanan servis formuna kalemi eklenemez.";
  public static final String SERVICE_FORM_LOCKED = "Faturası kesilmiş (Kilitli) bir iş emri üzerinde değişiklik yapılamaz.";

  // Expense
  public static final String EXPENSE_NOT_FOUND = "Gider kaydı bulunamadı.";
  public static final String EXPENSE_DELETED = "Silinen gider güncellenemez.";
  public static final String EXPENSE_ALREADY_DELETED = "Gider zaten silinmiş.";
  public static final String EXPENSE_AMOUNT_REQUIRED = "Gider tutarı boş bırakılamaz.";
  public static final String EXPENSE_AMOUNT_INVALID = "Gider tutarı 0.01'den az olamaz.";
  public static final String EXPENSE_AMOUNT_DIGITS = "Gider tutarı maksimum 8 rakam ve 2 ondalık basamak olmalıdır.";
  public static final String EXPENSE_DATE_REQUIRED = "Gider tarihi boş bırakılamaz.";
  public static final String EXPENSE_DATE_FUTURE = "Gider tarihi gelecekte olamaz.";
  public static final String EXPENSE_CATEGORY_REQUIRED = "Gider kategorisi zorunludur.";
  public static final String EXPENSE_DESCRIPTION_SIZE = "Açıklama maksimum 500 karakter olmalıdır.";

  // Payment
  public static final String PAYMENT_NOT_FOUND = "Ödeme kaydı bulunamadı.";
  public static final String PAYMENT_DELETED = "Silinen ödeme güncellenemez.";
  public static final String PAYMENT_ALREADY_DELETED = "Ödeme zaten silinmiş.";
  public static final String PAYMENT_SERVICE_FORM_ID_REQUIRED = "Servis formu ID boş bırakılamaz.";
  public static final String PAYMENT_AMOUNT_REQUIRED = "Ödeme tutarı boş bırakılamaz.";
  public static final String PAYMENT_AMOUNT_INVALID = "Ödeme tutarı 0.01'den az olamaz.";
  public static final String PAYMENT_AMOUNT_DIGITS = "Ödeme tutarı maksimum 8 rakam ve 2 ondalık basamak olmalıdır.";
  public static final String PAYMENT_AMOUNT_EXCEEDED = "Ödeme tutarı servis formunun toplam tutarını aşamaz.";
  public static final String PAYMENT_METHOD_REQUIRED = "Ödeme yöntemi zorunludur.";
  public static final String PAYMENT_FORM_STATUS_INVALID = "Sadece IN_PROGRESS veya COMPLETED durumundaki formlar için ödeme alınabilir.";

  // General
  public static final String INVALID_REQUEST = "İstek parametreleri geçersiz.";
}
