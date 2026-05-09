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
    if (!brand) {
      pushToast({ type: 'warning', title: 'Marka Seçin', message: 'Analiz için araç markası gereklidir.' });
      return;
    }

    setIsRunning(true);
    setAiReport('');
    setRemoteSuggestions([]);

    try {
      const next = [];
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        formData.append('image', uploadedFiles[0]);
        formData.append('description', complaintText || `${brand} ${model} araç kontrolü`);

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
      setRemoteSuggestions(next);
      setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
      pushToast({ type: 'success', title: 'Analiz Tamamlandı', message: 'Yapay zeka usta raporu hazır.' });
    } catch (err) {
      console.error('AI Analiz hatası:', err);
      pushToast({ type: 'error', title: 'Analiz Hatası', message: 'AI servisi şu an yanıt vermiyor.' });
    } finally {
      setIsRunning(false);
    }
  };

  const tier = getBrandTier(brand);

  const estimatedPrice = useMemo(() => {
    const categories = new Set();
    remoteSuggestions.forEach((s) => {
      if (s.type === 'YOLO') {
        mapDamageToCatalog(s.label).forEach((c) => categories.add(c));
      }
    });

    if (categories.size === 0) {
      const textToScan = (aiReport + ' ' + complaintText).toLowerCase();
      mapDamageToCatalog(textToScan).forEach((c) => categories.add(c));
    }

    let baseTotal = 0;
    categories.forEach((cat) => {
      baseTotal += damagePrices[cat] || 0;
    });

    if (baseTotal === 0 && (aiReport || complaintText)) baseTotal = 1000;

    return applyBrandMultiplier(baseTotal, brand);
  }, [remoteSuggestions, aiReport, complaintText, brand]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">AI Service Online</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">Admin Panel / Akıllı Teşhis</p>
        <h1 className="text-4xl font-black text-[var(--text-primary)] mt-2 tracking-tight">AI Hasar Analizi ve Raporlama</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Input Section */}
        <section className="xl:col-span-1 space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl rounded-full" />
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-soft)] flex items-center justify-center text-lg"></span>
              Araç Bilgileri
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); setModel(''); }}
                  className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-2xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] transition-all cursor-pointer"
                >
                  <option value="">Marka</option>
                  {Object.keys(carBrands).sort().map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!brand}
                  className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-2xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] transition-all cursor-pointer disabled:opacity-30"
                >
                  <option value="">Model</option>
                  {(carBrands[brand] || []).sort().map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                className="w-full p-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)] min-h-[120px] text-sm font-medium outline-none focus:border-[var(--accent)] transition-all"
                placeholder="Müşteri şikayeti veya teknik notlar..."
              />

              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
                <div className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${uploadedFiles.length > 0 ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-soft)] bg-[var(--bg-main)] group-hover:border-[var(--accent)]/50'}`}>
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[var(--accent)] font-black text-[10px] uppercase">Görsel Seçildi</p>
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{uploadedFiles[0].name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-2xl mb-1">📸</p>
                      <p className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">Hasar Fotoğrafı</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={isRunning || !brand}
                className="w-full p-5 rounded-2xl bg-[var(--accent)] text-black font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50 mt-4"
              >
                {isRunning ? 'ANALİZ EDİLİYOR...' : 'AI ANALİZİNİ BAŞLAT'}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Report Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[32px] p-8 shadow-xl min-h-[400px] flex flex-col">
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-lg"></span>
                AI Raporu
              </h2>

              {aiReport ? (
                <div className="flex-1 animate-in fade-in zoom-in duration-500">
                  <div className="p-6 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-[24px] relative">
                    <div className="absolute -top-3 -left-3 text-4xl opacity-10">"</div>
                    <div className="text-[var(--text-primary)] font-bold text-lg leading-relaxed italic whitespace-pre-wrap">
                      {aiReport}
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {remoteSuggestions.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-soft)]">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                          <span className="text-sm font-bold">{item.label}</span>
                        </div>
                        <span className="text-xs font-black text-[var(--accent)]">%{item.confidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                  <div className="text-6xl mb-4">⚙️</div>
                  <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Analiz Sonucu Bekleniyor</p>
                </div>
              )}
            </div>
          </div>

          {analysisRunAt && (
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Son Başarılı Analiz: {analysisRunAt}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
