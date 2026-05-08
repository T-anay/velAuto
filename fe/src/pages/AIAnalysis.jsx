import { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import { pushToast } from '../lib/toastBus';
import { mapDamageToCatalog, damagePrices } from '../constants/damageCatalogMap';
import { applyBrandMultiplier, getBrandTier } from '../constants/brandTiers';
import { carBrands } from '../constants/carData';

export default function AIAnalysis() {
  const [complaintText, setComplaintText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisRunAt, setAnalysisRunAt] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const [aiReport, setAiReport] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runAnalysis = async () => {
    setIsRunning(true);
    const next = [];

    try {
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        formData.append('image', uploadedFiles[0]);
        formData.append('description', complaintText || `${brand} ${model} arac kontrolu`);

        const response = await fetch('http://localhost:8000/analyze-damage', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.detected_damages) {
            const detected = data.detected_damages.map((det) => ({
              type: 'YOLO',
              label: det.label,
              confidence: Math.round(det.confidence * 100)
            }));
            next.push(...detected);
          }
          if (data.ai_analysis_report) {
            setAiReport(data.ai_analysis_report);
          }
        }
      } else {
        const formData = new FormData();
        formData.append('description', complaintText || `${brand} ${model} servis talebi`);
        const response = await fetch('http://localhost:8000/analyze-text', { method: 'POST', body: formData });
        if (response.ok) {
          const data = await response.json();
          setAiReport(data.ai_analysis_report);
        }
      }
    } catch (err) {
      console.error('AI Analiz hatasi:', err);
      pushToast({ type: 'error', title: 'Analiz Hatasi', message: 'AI servisi calismiyor olabilir.' });
    }

    setRemoteSuggestions(next);
    setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
    setIsRunning(false);
    pushToast({ type: 'success', title: 'Analiz tamamlandi', message: next.length ? 'Lokal AI yaniti alindi.' : 'Fallback eslestirme kullanildi.' });
  };

  const tier = getBrandTier(brand);

  const estimatedPrice = useMemo(() => {
    // Collect all unique categories from suggestions
    const categories = new Set();
    remoteSuggestions.forEach((s) => {
      if (s.type === 'YOLO') {
        mapDamageToCatalog(s.label).forEach((c) => categories.add(c));
      }
    });

    // Fallback: If no YOLO detections, try matching from AI report text or complaint
    if (categories.size === 0) {
      const textToScan = (aiReport + ' ' + complaintText).toLowerCase();
      mapDamageToCatalog(textToScan).forEach((c) => categories.add(c));
    }

    // Sum base prices
    let baseTotal = 0;
    categories.forEach((cat) => {
      baseTotal += damagePrices[cat] || 0;
    });

    // If still 0, use a generic base price
    if (baseTotal === 0) baseTotal = 1000;

    return applyBrandMultiplier(baseTotal, brand);
  }, [remoteSuggestions, aiReport, complaintText, brand]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <BackButton />
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">YOLO + Ollama + Fallback</p>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mt-2">Akilli Teshis ve AI Analizi</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Arac ve Sikayet Bilgileri</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setModel(''); }}
              className="p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl text-[var(--text-primary)] outline-none"
            >
              <option value="">Marka Secin</option>
              {Object.keys(carBrands).sort().map((b) => <option key={b} value={b}>{b}</option>)}
            </select>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
              className="p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl text-[var(--text-primary)] outline-none disabled:opacity-50"
            >
              <option value="">Model Secin</option>
              {(carBrands[brand] || []).sort().map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="w-full mt-3 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-24"
            placeholder="Musteri sikayeti veya notlar (istege bagli)..."
          />

          <div className="mt-3 relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="p-4 border-2 border-dashed border-[var(--border-soft)] rounded-xl text-center hover:border-[var(--accent)] transition-all bg-[var(--bg-main)]">
              {uploadedFiles.length > 0 ? (
                <span className="text-[var(--accent)] font-bold">{uploadedFiles[0].name} secildi</span>
              ) : (
                <span className="text-[var(--text-muted)] text-sm font-bold">+ Hasar Fotografini Yukle</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isRunning || !brand}
            className="mt-4 w-full p-4 rounded-xl bg-[var(--accent)] text-white font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
          >
            {isRunning ? 'AI ANALIZ EDIYOR...' : 'AI ANALIZINI BASLAT'}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">AI Tespit Sonuclari</h2>

          {aiReport ? (
            <div className="p-5 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest font-black text-[var(--accent)] mb-2">AI Usta Raporu</p>
              <div className="text-[var(--text-primary)] font-bold whitespace-pre-wrap leading-7 italic">
                "{aiReport}"
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-[var(--border-soft)] rounded-2xl text-[var(--text-muted)] font-bold">
              Henuz analiz yapilmadi
            </div>
          )}

          <div className="mt-6 space-y-3">
            {remoteSuggestions.map((item) => (
              <div key={`${item.type}-${item.label}`} className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-soft)]">
                <div>
                  <span className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-tighter">TESPIT</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                </div>
                <span className="text-xs font-black text-[var(--accent)]">%{item.confidence}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">Maliyet Tahmini</h2>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-[var(--text-secondary)] font-bold">Arac Segmenti:</span>
              <span className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-black uppercase">{tier.label}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-[var(--text-secondary)] font-bold">Fiyat Carpani:</span>
              <span className="text-lg font-black text-[var(--text-primary)]">x{tier.multiplier}</span>
            </div>

            <div className="pt-6 border-t border-[var(--border-soft)]">
              <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Tahmini Servis Tutari</p>
              <p className="text-5xl font-black text-[var(--accent)] tracking-tighter">
                {estimatedPrice.toLocaleString('tr-TR')} <span className="text-2xl">TL</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-4 leading-4">
                * Bu fiyat yapay zeka tarafindan tespit edilen hasarlar ve parca carpanlari uzerinden tahmin edilmistir. Kesin tutar usta kontrolu sonrasi netlesir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
