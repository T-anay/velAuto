import { useMemo, useState } from 'react';
import { 
  Brain, 
  Car, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { pushToast } from '../lib/toastBus';
import { mapDamageToCatalog, damagePrices } from '../constants/damageCatalogMap';
import { applyBrandMultiplier } from '../constants/brandTiers';
import { carBrands } from '../constants/carData';

export default function AIAnalysis() {
  const [complaintText, setComplaintText] = useState('');
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

    if (!complaintText.trim()) {
      pushToast({ type: 'warning', title: 'Açıklama Girin', message: 'Analiz için şikayet veya teknik not girilmelidir.' });
      return;
    }

    setIsRunning(true);
    setAiReport('');
    setRemoteSuggestions([]);

    try {
      const formData = new FormData();
      formData.append('description', complaintText || `${brand} ${model} servis talebi`);
      
      const response = await fetch('http://localhost:8000/analyze-text', { 
        method: 'POST', 
        body: formData 
      });

      if (response.ok) {
        const data = await response.json();
        setAiReport(data.ai_analysis_report);
        setRemoteSuggestions([]);
      } else {
        throw new Error('Servis hatası');
      }

      setAnalysisRunAt(new Date().toLocaleString('tr-TR'));
      pushToast({ type: 'success', title: 'Analiz Tamamlandı', message: 'Yapay zeka usta raporu hazır.' });
    } catch (err) {
      console.error('AI Analiz hatası:', err);
      pushToast({ type: 'error', title: 'Analiz Hatası', message: 'Yapay zeka servisi şu an yanıt vermiyor.' });
    } finally {
      setIsRunning(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Üst Başlık Bölümü */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
            <div className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Yapay Zeka v2.4 Aktif</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Akıllı <span className="text-[var(--accent)]">Teşhis</span> Merkezi
          </h1>
          <p className="text-[var(--text-muted)] font-medium mt-2 max-w-2xl">
            Yapay zeka destekli hasar analizi sistemi. 
            Teknik veriler ve şikayet notları üzerinden anında raporlama.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Giriş Yapılandırması - SOL SÜTUN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-[32px] p-8 relative overflow-hidden group border border-[var(--border-soft)]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <Car size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)]">Araç Bilgileri</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Marka</label>
                  <div className="relative">
                    <select
                      value={brand}
                      onChange={(e) => { setBrand(e.target.value); setModel(''); }}
                      className="w-full p-4 bg-[var(--bg-main)]/50 border border-[var(--border-soft)] rounded-2xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Marka Seçin</option>
                      {Object.keys(carBrands).sort().map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <ArrowRight size={16} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Model</label>
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={!brand}
                      className="w-full p-4 bg-[var(--bg-main)]/50 border border-[var(--border-soft)] rounded-2xl text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all appearance-none cursor-pointer disabled:opacity-30"
                    >
                      <option value="">Model Seçin</option>
                      {(carBrands[brand] || []).sort().map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Detaylı Şikayet / Teknik Notlar</label>
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full p-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-main)]/50 min-h-[220px] text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all resize-none"
                  placeholder="Araçtaki sorunları, sesleri veya teknik belirtileri buraya detaylıca yazın..."
                />
              </div>

              <button
                onClick={runAnalysis}
                disabled={isRunning || !brand}
                className="w-full p-5 rounded-2xl bg-[var(--accent)] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>ANALİZ EDİLİYOR...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    <span>AKILLI ANALİZİ BAŞLAT</span>
                  </>
                )}
                {isRunning && <div className="absolute inset-0 bg-white/20 shimmer" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sonuçlar / Zeka - SAĞ SÜTUN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[32px] p-8 min-h-[620px] flex flex-col border border-[var(--border-soft)] relative">
            <div className="absolute top-8 right-8 text-[var(--accent)]/5">
              <Brain size={120} strokeWidth={1} />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-[var(--text-primary)]">Analiz Raporu</h2>
              </div>
              
              {analysisRunAt && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Güncel
                </div>
              )}
            </div>

            {aiReport ? (
              <div className="flex-1 space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Yapay Zeka Metin Raporu */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[var(--accent)]/30 rounded-full" />
                  <div className="pl-6">
                    <h3 className="text-xs font-black text-[var(--accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={14} />
                      Teknik Değerlendirme
                    </h3>
                    <div className="text-[var(--text-primary)] font-bold text-lg leading-relaxed whitespace-pre-wrap">
                      {aiReport}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 rounded-[32px] bg-[var(--bg-main)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--accent)]/20 mb-6 relative">
                  <Brain size={48} />
                  {isRunning && (
                    <div className="absolute inset-0 border-2 border-[var(--accent)] rounded-[32px] animate-ping opacity-20" />
                  )}
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">
                    {isRunning ? 'Veriler İşleniyor' : 'Sistem Hazır'}
                  </h3>
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    {isRunning 
                      ? 'Yapay zeka modellerimiz verileri işliyor, bu işlem birkaç saniye sürebilir.' 
                      : 'Araç bilgilerini ve şikayet detaylarını girin. Raporunuz burada görüntülenecektir.'}
                  </p>
                </div>
              </div>
            )}

            {analysisRunAt && (
              <div className="mt-auto pt-8 border-t border-[var(--border-soft)]/50">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500" />
                    Son Başarılı Analiz: {analysisRunAt}
                  </div>
                  <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                    ID: {Math.random().toString(36).substring(7).toUpperCase()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
