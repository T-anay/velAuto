import { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import { pushToast } from '../lib/toastBus';
import { aiCatalogCategories, mapDamageToCatalog } from '../constants/damageCatalogMap';
import { applyBrandMultiplier, getBrandTier } from '../constants/brandTiers';

const KEYWORD_MAP = [
  { keywords: ['titreme', 'sarsinti', 'vibrasyon'], suggestion: 'Mekanik Kontrol', confidence: 84 },
  { keywords: ['fren', 'ses', 'otme'], suggestion: 'Fren Sistemi', confidence: 90 },
  { keywords: ['hararet', 'isinma', 'su'], suggestion: 'Mekanik Kontrol', confidence: 88 },
  { keywords: ['cizik', 'boya'], suggestion: 'Boya Islemi', confidence: 82 },
  { keywords: ['gocuk', 'kaporta'], suggestion: 'Kaporta Onarim', confidence: 86 },
  { keywords: ['far', 'elektrik'], suggestion: 'Elektrik Diagnostik', confidence: 76 },
];

export default function AIAnalysis() {
  const [complaintText, setComplaintText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisRunAt, setAnalysisRunAt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(aiCatalogCategories[0]);
  const [brand, setBrand] = useState('');
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const keywordSuggestions = useMemo(() => {
    const text = complaintText.toLowerCase();
    return KEYWORD_MAP
      .filter((item) => item.keywords.some((keyword) => text.includes(keyword)))
      .map((item) => ({ type: 'KEYWORD', label: item.suggestion, confidence: item.confidence }));
  }, [complaintText]);

  const fileFallbackSuggestions = useMemo(() => uploadedFiles.flatMap((file) => (
    mapDamageToCatalog(file.name).map((category) => ({ type: 'FALLBACK', label: category, confidence: 70 }))
  )), [uploadedFiles]);

  const allSuggestions = useMemo(() => {
    const unique = new Map();
    [...remoteSuggestions, ...keywordSuggestions, ...fileFallbackSuggestions, { type: 'MANUEL', label: selectedCategory, confidence: 65 }]
      .forEach((item) => unique.set(`${item.type}-${item.label}`, item));
    return Array.from(unique.values());
  }, [remoteSuggestions, keywordSuggestions, fileFallbackSuggestions, selectedCategory]);

  const runAnalysis = async () => {
    setIsRunning(true);
    const next = [];

    try {
      const ollama = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt: `Bu sikayeti servis katalog kategorilerine esle: ${complaintText}`, stream: false }),
      }).then((res) => (res.ok ? res.json() : null));

      if (ollama?.response) {
        next.push({ type: 'OLLAMA', label: ollama.response.slice(0, 120), confidence: 80 });
      }
    } catch {
      // Keyword fallback below remains active.
    }

    if (uploadedFiles.length > 0) {
      try {
        const formData = new FormData();
        uploadedFiles.forEach((file) => formData.append('files', file));
        const yolo = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData }).then((res) => (res.ok ? res.json() : null));
        const detections = Array.isArray(yolo?.detections) ? yolo.detections : [];
        detections.forEach((detection) => {
          mapDamageToCatalog(detection.label || detection.name).forEach((category) => {
            next.push({ type: 'YOLO', label: category, confidence: Math.round((detection.confidence || 0.75) * 100) });
          });
        });
      } catch {
        // Filename fallback below remains active.
      }
    }

    setRemoteSuggestions(next);
    setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
    setIsRunning(false);
    pushToast({ type: 'success', title: 'Analiz tamamlandi', message: next.length ? 'Lokal AI yaniti alindi.' : 'Fallback eslestirme kullanildi.' });
  };

  const toggleSuggestion = (label) => {
    setSelectedSuggestions((prev) => prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]);
  };

  const tier = getBrandTier(brand);
  const estimatedPrice = applyBrandMultiplier(1000, brand);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <BackButton />
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">YOLO + Ollama + Fallback</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Akilli Teshis ve AI Analizi</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Analiz Girdileri</h2>
          <textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} className="w-full mt-4 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-36" placeholder="Sikayet metni..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" placeholder="Marka carpani icin marka" />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]">
              {aiCatalogCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <input type="file" multiple accept="image/*" onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))} className="w-full mt-3 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)]" />
          <button type="button" onClick={runAnalysis} disabled={isRunning} className="mt-4 w-full p-3 rounded-xl bg-[var(--accent)] text-white font-black hover:brightness-110 transition-all disabled:opacity-60">
            {isRunning ? 'Analiz calisiyor...' : 'AI Analizini Calistir'}
          </button>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Fiyat Carpani</h2>
          <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-5">
            <p className="text-sm text-[var(--text-secondary)]">Sinif: <span className="font-black text-[var(--text-primary)]">{tier.label}</span></p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Carpan: <span className="font-black text-[var(--accent)]">x{tier.multiplier}</span></p>
            <p className="text-3xl font-black text-[var(--accent)] mt-4">{estimatedPrice.toLocaleString('tr-TR')} TL</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">1000 TL baz fiyat ornegi</p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-4">{analysisRunAt ? `Son analiz: ${analysisRunAt}` : 'Analiz henuz calistirilmadi'}</p>
        </section>
      </div>

      <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">Onerilen Katalog Eslesmeleri</h2>
        <div className="space-y-3">
          {allSuggestions.map((item) => {
            const selected = selectedSuggestions.includes(item.label);
            return (
              <button type="button" key={`${item.type}-${item.label}`} onClick={() => toggleSuggestion(item.label)} className={`w-full text-left rounded-xl border p-4 transition-all ${selected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-soft)] bg-[var(--bg-main)]'}`}>
                <p className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">{item.type}</p>
                <div className="mt-1 flex justify-between gap-3">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{item.label}</h3>
                  <span className="text-xs font-black text-[var(--accent)]">%{item.confidence}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
