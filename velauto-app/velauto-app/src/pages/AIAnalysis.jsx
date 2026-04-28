import { useEffect, useMemo, useState } from 'react';
import { useService } from '../context/ServiceContext';
import { api } from '../api/velautoApi';
import { pushToast } from '../lib/toastBus';

const AI_CONFIDENCE_THRESHOLD = 0.7;
const DRAFT_STORAGE_KEY = 'velauto_ai_service_draft_items';

const KEYWORD_MAP = [
  { keywords: ['titreme', 'sarsıntı', 'vibrasyon'], suggestion: 'Balans / Rot ayarı kontrolü', confidence: 84 },
  { keywords: ['çekiş', 'hızlanmıyor', 'performans'], suggestion: 'Yakıt filtresi ve enjektör temizliği', confidence: 78 },
  { keywords: ['fren', 'ses', 'ötme'], suggestion: 'Fren balatası ve disk kontrolü', confidence: 90 },
  { keywords: ['hararet', 'ısınma', 'su eksiltme'], suggestion: 'Radyatör ve termostat testi', confidence: 88 },
  { keywords: ['marş', 'çalışmıyor', 'akü'], suggestion: 'Akü ve marş motoru ölçümü', confidence: 86 },
  { keywords: ['duman', 'egzoz'], suggestion: 'Egzoz emisyon ve turbo kaçağı kontrolü', confidence: 75 },
];

const normalizeForMatch = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const getDamageSolutionSuggestion = (label) => {
  const normalized = normalizeForMatch(label);

  if (normalized.includes('cam')) return 'Cam degisimi onerilir.';
  if (normalized.includes('kirik') || normalized.includes('catlak')) return 'Parca degisimi onerilir.';
  if (normalized.includes('gocuk') || normalized.includes('dent')) return 'Kaporta duzeltme ve lokal boya onerilir.';
  if (normalized.includes('cizik') || normalized.includes('scratch')) return 'Yuzey polisaji ve boya onarimi onerilir.';
  if (normalized.includes('far') || normalized.includes('stop') || normalized.includes('lamba')) return 'Aydinlatma parcasi degisimi onerilir.';
  if (normalized.includes('lastik')) return 'Lastik degisimi ve balans kontrolu onerilir.';

  return 'Hasara uygun parca ve onarim islemi icin teknik kontrol onerilir.';
};

const getMultiDamageSolutionSuggestion = (damages) => {
  if (!Array.isArray(damages) || damages.length <= 1) {
    return getDamageSolutionSuggestion(damages?.[0]?.label);
  }

  const labels = [...new Set(damages.map((damage) => damage?.label).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

  if (labels.length === 0) {
    return 'Hasara uygun parca ve onarim islemi icin teknik kontrol onerilir.';
  }

  if (labels.length === 1) {
    return getDamageSolutionSuggestion(labels[0]);
  }

  if (labels.length === 2) {
    return `${labels[0]} ve ${labels[1]} icin kapsamli kontrol ve gerekli onarim onerilir.`;
  }

  return 'Birden fazla hasar icin kapsamli kontrol ve gerekli onarim onerilir.';
};

const buildVisualSummary = (damages) => {
  if (!Array.isArray(damages) || damages.length === 0) {
    return 'Hasar tespit edilemedi, usta incelemesi onerilir. Hasara uygun cozum icin teknik kontrol onerilir. Sonraki asamada usta gorusu ile detaylari girin.';
  }

  const allDamagesHighConfidence = damages.every((damage) => Number(damage?.confidence || 0) >= AI_CONFIDENCE_THRESHOLD);
  const firstSentence = allDamagesHighConfidence
    ? 'Yukaridaki hasarlar tespit edildi.'
    : 'Yukaridaki hasarlar tespit edildi ancak usta incelemesi onerilir.';
  const secondSentence = getMultiDamageSolutionSuggestion(damages);
  const thirdSentence = 'Sonraki asamada usta gorusu ile detaylari girin.';

  return `${firstSentence} ${secondSentence} ${thirdSentence}`;
};

const extractImageHint = (fileName) => {
  const normalized = normalizeForMatch(fileName);
  if (normalized.includes('fren')) return 'Fren sistemi hasar izi algılandı.';
  if (normalized.includes('motor')) return 'Motor bölümünde yağ/sızdırma şüphesi.';
  if (normalized.includes('kaput') || normalized.includes('hasar')) return 'Kaporta hasarı kalemleri eşleştirildi.';
  if (normalized.includes('lastik')) return 'Lastik aşınma paterni analizi önerildi.';
  return 'Genel görsel tarama tamamlandı.';
};

const buildDraftItem = (name, source) => ({
  id: `${source}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  source,
});

const loadDraftItems = () => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function AIAnalysis() {
  const { serviceCatalog, addServiceCatalogItem, removeServiceCatalogItem } = useService();
  const [complaintText, setComplaintText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisRunAt, setAnalysisRunAt] = useState('');
  const [analysisMode, setAnalysisMode] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [serviceDraftItems, setServiceDraftItems] = useState(() => loadDraftItems());
  const [customServiceItem, setCustomServiceItem] = useState('');
  const [isTextAnalyzing, setIsTextAnalyzing] = useState(false);
  const [isVisualAnalyzing, setIsVisualAnalyzing] = useState(false);
  const [aiDetectedDamages, setAiDetectedDamages] = useState([]);
  const [aiAnalysisReport, setAiAnalysisReport] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serviceDraftItems));
    } catch {
      // ignore storage errors
    }
  }, [serviceDraftItems]);

  const textSuggestions = useMemo(() => {
    const text = complaintText.toLowerCase();
    if (!text.trim()) return [];

    const matches = KEYWORD_MAP.filter((item) => item.keywords.some((keyword) => text.includes(keyword)));
    const unique = new Map();
    matches.forEach((item) => unique.set(item.suggestion, item));
    return Array.from(unique.values());
  }, [complaintText]);

  const visualSuggestions = useMemo(() => {
    if (aiDetectedDamages.length > 0) {
      return aiDetectedDamages.map((item) => ({
        suggestion: `${item.label} hasari tespit edildi`,
        confidence: Math.round(item.confidence * 100),
      }));
    }

    return uploadedFiles.map((file) => ({
      fileName: file.name,
      suggestion: extractImageHint(file.name),
      confidence: 70,
    }));
  }, [uploadedFiles, aiDetectedDamages]);

  const allSuggestions = useMemo(() => {
    const base = textSuggestions.map((item) => ({
      type: 'METIN',
      label: item.suggestion,
      confidence: item.confidence,
    }));

    const visual = visualSuggestions.map((item, index) => ({
      type: 'GORSEL',
      label: item.fileName ? `${item.suggestion} (${item.fileName})` : item.suggestion,
      confidence: item.confidence ?? (70 + (index % 20)),
    }));

    return [...base, ...visual];
  }, [textSuggestions, visualSuggestions]);

  const runTextAnalysis = async () => {
    if (!complaintText.trim()) {
      pushToast({ type: 'warning', title: 'Metin gerekli', message: 'Metin analizi için şikayet metni girin.' });
      return;
    }

    try {
      setIsTextAnalyzing(true);
      const response = await api.ai.analyzeText({ description: complaintText });
      setAiAnalysisReport(response?.ai_analysis_report || 'Metin analizi sonucu alınamadı.');
      setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
      setAnalysisMode('METIN');
      setAiDetectedDamages([]);
      pushToast({ type: 'success', title: 'Metin analizi tamamlandı', message: 'Dış AI bağlantısı üzerinden metin özeti oluşturuldu.' });
    } catch (analysisError) {
      pushToast({
        type: 'error',
        title: 'Metin analiz hatası',
        message: analysisError.message || 'AI servisine ulaşılamadı.',
      });
    } finally {
      setIsTextAnalyzing(false);
    }
  };

  const runVisualAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      pushToast({ type: 'warning', title: 'Görsel gerekli', message: 'Görsel analizi için en az bir görsel yükleyin.' });
      return;
    }

    try {
      setIsVisualAnalyzing(true);

      const responses = await Promise.all(
        uploadedFiles.map((file) => api.ai.analyzeDamage({
          file,
          description: complaintText || 'Musteri sikayeti belirtilmedi.',
        })),
      );

      const mergedByLabel = new Map();

      responses.forEach((response) => {
        (response?.detected_damages || []).forEach((damage) => {
          const previous = mergedByLabel.get(damage.label);
          if (!previous || damage.confidence > previous.confidence) {
            mergedByLabel.set(damage.label, damage);
          }
        });
      });

      const mergedDamages = Array.from(mergedByLabel.values());
      setAiDetectedDamages(mergedDamages);
      setAiAnalysisReport(buildVisualSummary(mergedDamages));
      setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
      setAnalysisMode('GORSEL');
      pushToast({ type: 'success', title: 'Görsel analizi tamamlandı', message: 'Hasar tespiti ve AI özeti güncellendi.' });
    } catch (analysisError) {
      pushToast({
        type: 'error',
        title: 'Görsel analiz hatası',
        message: analysisError.message || 'AI servisine ulaşılamadı.',
      });
    } finally {
      setIsVisualAnalyzing(false);
    }
  };

  const toggleSuggestion = (label) => {
    setSelectedSuggestions((prev) => (prev.includes(label)
      ? prev.filter((item) => item !== label)
      : [...prev, label]));
  };

  const addSelectedToDrafts = () => {
    if (selectedSuggestions.length === 0) {
      pushToast({ type: 'warning', title: 'Kalem seçilmedi', message: 'Önce önerilen kalemlerden seçim yapın.' });
      return;
    }

    setServiceDraftItems((prev) => {
      const existingNames = new Set(prev.map((item) => item.name));
      const nextItems = selectedSuggestions
        .filter((label) => !existingNames.has(label))
        .map((label) => buildDraftItem(label, 'ai'));

      if (nextItems.length === 0) {
        pushToast({ type: 'info', title: 'Kalemler hazır', message: 'Seçilen kalemler zaten taslakta bulunuyor.' });
        return prev;
      }

      pushToast({ type: 'success', title: 'Taslağa eklendi', message: `${nextItems.length} kalem arka plan taslağına alındı.` });
      return [...prev, ...nextItems];
    });
  };

  const addCustomDraftItem = () => {
    const name = customServiceItem.trim();
    if (!name) return;

    setServiceDraftItems((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        pushToast({ type: 'info', title: 'Kalem mevcut', message: 'Bu servis kalemi zaten taslakta var.' });
        return prev;
      }

      pushToast({ type: 'success', title: 'Kalem eklendi', message: `${name} taslağa eklendi.` });
      return [...prev, buildDraftItem(name, 'manual')];
    });

    setCustomServiceItem('');
  };

  const removeDraftItem = (itemId) => {
    setServiceDraftItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearDraftItems = () => {
    setServiceDraftItems([]);
    pushToast({ type: 'info', title: 'Taslak temizlendi', message: 'Servis kalemi taslak listesi silindi.' });
  };

  const persistDraftItemsToCatalog = async () => {
    const uniqueNames = [...new Set([
      ...selectedSuggestions,
      ...serviceDraftItems.map((item) => item.name),
    ].map((item) => item.trim()).filter(Boolean))];

    if (uniqueNames.length === 0) {
      pushToast({ type: 'warning', title: 'Kalem seçilmedi', message: 'Önce servis kalemi seçin veya ekleyin.' });
      return;
    }

    try {
      let addedCount = 0;
      for (const name of uniqueNames) {
        const created = await addServiceCatalogItem({
          name,
          description: 'AI analizinden kaydedildi',
          basePrice: 0,
        });
        if (created) {
          addedCount += 1;
        }
      }

      setSelectedSuggestions([]);
      setServiceDraftItems([]);
      pushToast({ type: 'success', title: 'Kataloğa kaydedildi', message: `${addedCount} kalem fatura kalemleri listesine eklendi.` });
    } catch (saveError) {
      pushToast({
        type: 'error',
        title: 'Kayıt hatası',
        message: saveError.message || 'Kalemler kataloğa eklenemedi.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">AI Analiz Merkezi</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Akıllı Teşhis ve Servis Kalemi Taslağı</h1>
        <p className="text-[var(--text-secondary)] mt-2">Metin analizi dış AI bağlantısıyla, görsel analiz ayrı butonla çalışır. Çıktı her iki tarafta da aynı kısa formatta gösterilir.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Metin Analizi</h2>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Dış AI</span>
          </div>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="w-full mt-4 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-40"
            placeholder="Örn: Araç düşük hızda titreme yapıyor, fren yapınca ses geliyor..."
          />
          <button
            type="button"
            onClick={runTextAnalysis}
            disabled={isTextAnalyzing}
            className="mt-4 w-full p-3 rounded-xl bg-[var(--accent)] text-white font-black hover:brightness-110 transition-all"
          >
            {isTextAnalyzing ? 'METİN ANALİZİ ÇALIŞIYOR...' : 'METİN ANALİZİ ÇALIŞTIR'}
          </button>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Görsel Analizi</h2>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">YOLO + AI</span>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
            className="w-full mt-4 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]"
          />
          <div className="mt-4 space-y-2">
            {uploadedFiles.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Henüz görsel yüklenmedi.</p>}
            {uploadedFiles.map((file) => (
              <div key={file.name} className="p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)]">
                {file.name}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={runVisualAnalysis}
            disabled={isVisualAnalyzing || uploadedFiles.length === 0}
            className="mt-4 w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-soft)] text-[var(--text-primary)] font-black hover:border-[var(--accent)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVisualAnalyzing ? 'GÖRSEL ANALİZİ ÇALIŞIYOR...' : 'GÖRSELİ ANALİZ ET'}
          </button>
        </section>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">AI Teknik Ozet</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {analysisMode ? `${analysisMode} analizi sonucu` : 'Analiz henüz çalıştırılmadı'}
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{analysisRunAt ? `Son analiz: ${analysisRunAt}` : 'Analiz bekleniyor'}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
          <p className="text-sm whitespace-pre-line text-[var(--text-primary)]">
            {aiAnalysisReport || 'Rapor henüz oluşmadı. Metin veya görsel analizi çalıştırın.'}
          </p>
        </div>

        {aiDetectedDamages.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
            <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] mb-2">Tespit Edilen Hasarlar</p>
            <div className="space-y-2">
              {aiDetectedDamages.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                  <span>{item.label}</span>
                  <span className="font-bold text-[var(--accent)]">%{Math.round(item.confidence * 100)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Servis Kalemi Taslağı</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Seçilen önerileri kalıcı fatura kalemi olarak kaydedebilirsin.</p>
          </div>
          <button
            type="button"
            onClick={persistDraftItemsToCatalog}
            className="px-4 py-3 rounded-xl bg-[var(--accent)] text-white font-black hover:brightness-110 transition-all"
          >
            Kalıcı Fatura Kalemine Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <input
            type="text"
            value={customServiceItem}
            onChange={(e) => setCustomServiceItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomDraftItem();
              }
            }}
            className="w-full p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-primary)]"
            placeholder="Özel servis kalemi yazın (ör. Ön tampon değişimi)"
          />
          <button
            type="button"
            onClick={addCustomDraftItem}
            className="px-5 py-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-soft)] text-[var(--text-primary)] font-black hover:border-[var(--accent)] transition-all"
          >
            Kalem Ekle
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] mb-2">Seçilen AI Önerileri</p>
          <div className="flex flex-wrap gap-2">
            {selectedSuggestions.length === 0 && <span className="text-sm text-[var(--text-secondary)]">Henüz seçim yapılmadı.</span>}
            {selectedSuggestions.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => toggleSuggestion(item)}
                className="px-3 py-1 rounded-full text-xs font-black bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {allSuggestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-[var(--text-secondary)] md:col-span-2">
              Şikayet metni yazıp veya görsel yükleyip analiz çalıştır.
            </div>
          )}

          {allSuggestions.map((item) => {
            const selected = selectedSuggestions.includes(item.label);
            return (
              <button
                type="button"
                key={`${item.type}-${item.label}`}
                onClick={() => toggleSuggestion(item.label)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${selected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-soft)] bg-[var(--bg-main)]'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">{item.type}</p>
                    <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">{item.label}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-xs font-black border border-[var(--border-soft)] text-[var(--text-secondary)] bg-white">
                    Güven: %{item.confidence}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Arka Plan Taslak Kalemleri</p>
            {serviceDraftItems.length > 0 && (
              <button
                type="button"
                onClick={clearDraftItems}
                className="text-xs font-black uppercase tracking-widest text-[var(--danger)] hover:underline"
              >
                Tümünü Sil
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {serviceDraftItems.length === 0 && <span className="text-sm text-[var(--text-secondary)]">Henüz taslak kalem eklenmedi.</span>}
            {serviceDraftItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => removeDraftItem(item.id)}
                className="group px-3 py-1 rounded-full text-xs font-black bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-soft)] hover:border-[var(--accent)] transition-all inline-flex items-center gap-2"
                title="Kaldır"
              >
                {item.name}
                <span className="text-[10px] text-[var(--danger)] opacity-70 group-hover:opacity-100">Sil</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Kalıcı Fatura Kalemleri</p>
            <span className="text-xs text-[var(--text-secondary)]">İşlem Seç listesini besler</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {serviceCatalog.length === 0 && <span className="text-sm text-[var(--text-secondary)]">Kalıcı fatura kalemi bulunmuyor.</span>}
            {serviceCatalog.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => removeServiceCatalogItem(item.id)}
                className="group px-3 py-1 rounded-full text-xs font-black bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25 hover:border-[var(--danger)] transition-all inline-flex items-center gap-2"
                title="Kalıcı listeden sil"
              >
                {item.name}
                <span className="text-[10px] text-[var(--danger)] opacity-70 group-hover:opacity-100">Sil</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
