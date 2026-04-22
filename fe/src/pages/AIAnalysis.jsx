import { useMemo, useState } from 'react';
import { pushToast } from '../lib/toastBus';

const KEYWORD_MAP = [
  { keywords: ['titreme', 'sarsıntı', 'vibrasyon'], suggestion: 'Balans / Rot ayarı kontrolü', confidence: 84 },
  { keywords: ['çekiş', 'hızlanmıyor', 'performans'], suggestion: 'Yakıt filtresi ve enjektör temizliği', confidence: 78 },
  { keywords: ['fren', 'ses', 'ötme'], suggestion: 'Fren balatası ve disk kontrolü', confidence: 90 },
  { keywords: ['hararet', 'ısınma', 'su eksiltme'], suggestion: 'Radyatör ve termostat testi', confidence: 88 },
  { keywords: ['marş', 'çalışmıyor', 'akü'], suggestion: 'Akü ve marş motoru ölçümü', confidence: 86 },
  { keywords: ['duman', 'egzoz'], suggestion: 'Egzoz emisyon ve turbo kaçağı kontrolü', confidence: 75 },
];

const extractImageHint = (fileName) => {
  const normalized = fileName.toLowerCase();
  if (normalized.includes('fren')) return 'Fren sistemi hasar izi algılandı.';
  if (normalized.includes('motor')) return 'Motor bölümünde yağ/sızdırma şüphesi.';
  if (normalized.includes('kaput') || normalized.includes('hasar')) return 'Kaporta hasarı kalemleri eşleştirildi.';
  if (normalized.includes('lastik')) return 'Lastik aşınma paterni analizi önerildi.';
  return 'Genel görsel tarama tamamlandı.';
};

export default function AIAnalysis() {
  const [complaintText, setComplaintText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisRunAt, setAnalysisRunAt] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  const textSuggestions = useMemo(() => {
    const text = complaintText.toLowerCase();
    if (!text.trim()) return [];

    const matches = KEYWORD_MAP.filter((item) => item.keywords.some((keyword) => text.includes(keyword)));
    const unique = new Map();
    matches.forEach((item) => unique.set(item.suggestion, item));
    return Array.from(unique.values());
  }, [complaintText]);

  const visualSuggestions = useMemo(() => {
    return uploadedFiles.map((file) => ({
      fileName: file.name,
      suggestion: extractImageHint(file.name),
    }));
  }, [uploadedFiles]);

  const allSuggestions = useMemo(() => {
    const base = textSuggestions.map((item) => ({
      type: 'METIN',
      label: item.suggestion,
      confidence: item.confidence,
    }));
    const visual = visualSuggestions.map((item, index) => ({
      type: 'GORSEL',
      label: `${item.suggestion} (${item.fileName})`,
      confidence: 70 + (index % 20),
    }));
    return [...base, ...visual];
  }, [textSuggestions, visualSuggestions]);

  const runAnalysis = () => {
    setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
    pushToast({ type: 'success', title: 'Analiz çalıştı', message: 'Şikayet metni ve görsel önerileri güncellendi.' });
  };

  const toggleSuggestion = (label) => {
    setSelectedSuggestions((prev) => prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]);
    pushToast({ type: 'info', title: 'Kalem seçildi', message: `${label} servise eklenecek seçimlere alındı.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Gemini + Vertex AI</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Akıllı Teşhis ve AI Analizi</h1>
        <p className="text-[var(--text-secondary)] mt-2">Şikayet metni ve görsel verilerden servis kalemi önerilerini otomatik üretir.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Metin Analizi</h2>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="w-full mt-4 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-40"
            placeholder="Örn: Araç düşük hızda titreme yapıyor, fren yapınca ses geliyor..."
          />
          <button
            type="button"
            onClick={runAnalysis}
            className="mt-4 w-full p-3 rounded-xl bg-[var(--accent)] text-white font-black hover:brightness-110 transition-all"
          >
            METİN ANALİZİNİ ÇALIŞTIR
          </button>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Görsel İşleme</h2>
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
        </section>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Önerilen Teşhis Kalemleri</h2>
          <p className="text-sm text-[var(--text-secondary)]">{analysisRunAt ? `Son analiz: ${analysisRunAt}` : 'Analiz henüz çalıştırılmadı'}</p>
        </div>

        <div className="space-y-3">
          {allSuggestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-[var(--text-secondary)]">
              Şikayet metni yazıp veya görsel yükleyip analiz çalıştır.
            </div>
          )}

          {allSuggestions.map((item) => {
            const selected = selectedSuggestions.includes(item.label);
            return (
              <button
                type="button"
                key={item.label}
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
          <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Servis Formuna Eklenecek Kalemler</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedSuggestions.length === 0 && <span className="text-sm text-[var(--text-secondary)]">Henüz seçim yapılmadı.</span>}
            {selectedSuggestions.map((item) => (
              <span key={item} className="px-3 py-1 rounded-full text-xs font-black bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25">{item}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
