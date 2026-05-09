import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (options.triggerOnce) observer.unobserve(entry.target);
      } else if (!options.triggerOnce) {
        setIsIntersecting(false);
      }
    }, options);

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isIntersecting];
};

const Reveal = ({ children, className = '', delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.1 });
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-12 blur-sm'}`}
    >
      {children}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-soft)] w-full max-w-2xl rounded-3xl p-10 shadow-2xl animate-fade-in-up">
        <h3 className="text-3xl font-black mb-6">{title}</h3>
        <div className="text-[var(--text-secondary)] leading-relaxed space-y-4 overflow-y-auto max-h-[60vh] pr-4">
          {content}
        </div>
        <button 
          onClick={onClose}
          className="mt-10 w-full py-4 bg-[var(--accent)] text-white md:text-black font-black rounded-2xl hover:brightness-110 transition-all"
        >
          Anladım
        </button>
      </div>
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden transition-colors duration-500">
      <Modal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        title={activeModal === 'terms' ? 'Kullanım Koşulları' : 'Gizlilik Politikası'}
        content={
          activeModal === 'terms' ? (
            <>
              <p>VelAuto, otomotiv servislerinin iş akışlarını dijitalleştirmek için tasarlanmış bir yönetim panelidir.</p>
              <p>Sistemi kullanarak verilerinizin güvenli bir şekilde işlenmesini ve saklanmasını kabul etmiş sayılırsınız.</p>
              <p>Hesap bilgilerinizin güvenliği kullanıcı sorumluluğundadır.</p>
            </>
          ) : (
            <>
              <p>Verileriniz 256-bit şifreleme ile korunmaktadır.</p>
              <p>Müşteri bilgileri ve araç geçmişi sadece sizin yetkilendirdiğiniz personel tarafından görülebilir.</p>
              <p>Üçüncü taraf paylaşımı kesinlikle yapılmamaktadır.</p>
            </>
          )
        }
      />

      {/* Dynamic Background Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-30 transition-all duration-1000"
        style={{ 
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, var(--accent) 0%, transparent 50%)`,
          opacity: isDark ? 0.15 : 0.05
        }}
      />


      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[var(--bg-main)]/70 backdrop-blur-xl border-b border-[var(--border-soft)] py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white md:text-black font-black text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-[var(--accent)]/20">V</div>
            <div className="text-2xl font-black tracking-tighter">VEL<span className="text-[var(--accent)]">AUTO</span></div>
          </div>
          <nav className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest">
            <button onClick={() => scrollTo('about')} className="hover:text-[var(--accent)] transition-all relative group uppercase">Hakkımızda</button>
            <button onClick={() => scrollTo('services')} className="hover:text-[var(--accent)] transition-all relative group uppercase">Hizmetler</button>
            <button onClick={() => scrollTo('ai')} className="hover:text-[var(--accent)] transition-all relative group uppercase">AI Destekli</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-[var(--accent)] transition-all relative group uppercase">İletişim</button>
            
            <div className="h-4 w-px bg-[var(--border-soft)]" />
            
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] flex items-center justify-center hover:border-[var(--accent)] transition-all text-xl"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <button onClick={() => navigate('/login')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Yönetici Paneli</button>
            <button onClick={() => navigate('/public-appointment')} className="px-6 py-3 rounded-full bg-[var(--accent)] text-white md:text-black font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/30">RANDEVU AL</button>
          </nav>
          
          <div className="md:hidden flex gap-4">
             <button onClick={toggleTheme} className="text-2xl">{isDark ? '☀️' : '🌙'}</button>
             <button onClick={() => navigate('/login')} className="text-2xl">👤</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="Hero" className={`w-full h-full object-cover scale-110 blur-[2px] transition-opacity duration-1000 ${isDark ? 'opacity-40' : 'opacity-20'}`} />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)]/90 via-[var(--bg-main)]/50 to-[var(--bg-main)]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-4xl">
            <Reveal delay={200}><div className="flex items-center gap-3 mb-8"><span className="h-px w-12 bg-[var(--accent)]" /><span className="text-[var(--accent)] font-black text-xs tracking-[0.4em] uppercase">VelAuto v2.0 Yayında</span></div></Reveal>
            <Reveal delay={400}><h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.9] tracking-tighter mb-10">ATÖLYENİZİ <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[var(--accent)]">DİJİTAL</span> <br />YÖNETİN.</h1></Reveal>
            <Reveal delay={600}><p className="text-xl text-[var(--text-secondary)] max-w-xl mb-12 leading-relaxed">Geleneksel servis yönetimini modern teknolojiyle birleştirin. Randevu, müşteri ve iş takibi artık çok daha kolay.</p></Reveal>
            <Reveal delay={800} className="flex flex-wrap gap-6">
              <button onClick={() => navigate('/public-appointment')} className="group relative px-10 py-5 bg-[var(--accent)] text-white md:text-black font-black text-lg rounded-2xl transition-all shadow-lg shadow-[var(--accent)]/20 hover:pr-14"><span className="relative z-10">HEMEN BAŞLAYIN</span><span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-2xl">→</span></button>
              <button onClick={() => scrollTo('services')} className="px-10 py-5 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl font-bold hover:bg-[var(--bg-hover)] transition-all backdrop-blur-xl">ÖZELLİKLERİ GÖR</button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-40 bg-[var(--bg-card)]/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-video rounded-3xl overflow-hidden border border-[var(--border-soft)] shadow-2xl bg-black/20">
                 <img src="/hero-bg.png" alt="About" className="w-full h-full object-cover grayscale opacity-30" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--accent)]/20 blur-3xl rounded-full" />
            </div>
            <div className="space-y-8">
              <Reveal><h2 className="text-5xl font-black tracking-tighter">BİZ KİMİZ?</h2></Reveal>
              <Reveal delay={200}><p className="text-xl text-[var(--text-secondary)] leading-relaxed">VelAuto, otomotiv servislerinin dijital dönüşümüne öncülük eden modern bir yönetim panelidir. İşletme sahiplerinin her detayı tek bir ekran üzerinden takip edebilmesini sağlıyoruz.</p></Reveal>
              <div className="grid grid-cols-2 gap-6">
                 {['%100 Yerli Yazılım', 'Kullanıcı Dostu', 'Hızlı Entegrasyon', 'AI Desteği'].map((item, i) => (
                   <Reveal key={item} delay={300 + (i * 100)} className="flex items-center gap-3">
                     <span className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white md:text-black font-bold text-[10px]">✓</span>
                     <span className="font-bold text-sm text-[var(--text-secondary)]">{item}</span>
                   </Reveal>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-40">
        <div className="max-w-7xl mx-auto px-8">
          <Reveal className="mb-24 text-center md:text-left"><h2 className="text-5xl font-black tracking-tighter mb-4">SİSTEM ÖZELLİKLERİ.</h2><p className="text-[var(--text-secondary)] text-lg">Atölyenizdeki tüm süreçleri dijitalleştirin.</p></Reveal>
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 p-10 rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--accent)]/50 transition-all shadow-xl group">
               <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📋</div>
               <h3 className="text-2xl font-black mb-4">İş Emri Takibi</h3>
               <p className="text-[var(--text-muted)]">Aktif işlerin durumunu, teknisyen atamalarını ve süreleri canlı olarak izleyin.</p>
            </div>
            <div className="md:col-span-4 p-10 rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--accent)]/50 transition-all shadow-xl group">
               <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">👤</div>
               <h3 className="text-2xl font-black mb-4">Müşteri Yönetimi</h3>
               <p className="text-[var(--text-muted)]">Müşteri bilgilerini, araç geçmişini ve sadakat durumunu tek bir yerden yönetin.</p>
            </div>
            <div className="md:col-span-4 p-10 rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--accent)]/50 transition-all shadow-xl group">
               <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">💰</div>
               <h3 className="text-2xl font-black mb-4">Finansal Takip</h3>
               <p className="text-[var(--text-muted)]">Giderler, faturalar ve kasa durumu ile işletmenizin karlılığını kontrol edin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section id="ai" className="py-40 bg-[var(--bg-main)]">
         <div className="max-w-7xl mx-auto px-8">
           <div className="p-12 md:p-24 rounded-[48px] bg-gradient-to-br from-[var(--bg-card)] to-transparent border border-[var(--border-soft)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/10 blur-[100px] rounded-full" />
              <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                 <div>
                   <Reveal><h2 className="text-5xl font-black tracking-tighter mb-8 leading-tight">YAPAY ZEKA <br /> DESTEKLİ ANALİZ.</h2></Reveal>
                   <Reveal delay={200}><p className="text-xl text-[var(--text-secondary)] mb-10 leading-relaxed">VelAuto, araç fotoğrafları üzerinden otomatik analiz yapabilen AI entegrasyonuna sahiptir. Bu sayede hasar tespit süreçlerinizi hızlandırır.</p></Reveal>
                   <Reveal delay={400}><div className="flex gap-4"><span className="px-6 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-black">OLLAMA DESTEĞİ</span><span className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black">GÖRÜNTÜ ANALİZİ</span></div></Reveal>
                 </div>
                 <div className="hidden md:flex justify-center">
                    <div className="w-64 h-64 border-4 border-dashed border-[var(--border-soft)] rounded-full animate-spin-slow flex items-center justify-center">
                       <div className="text-6xl">🤖</div>
                    </div>
                 </div>
              </div>
           </div>
         </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-40">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <Reveal><h2 className="text-5xl font-black tracking-tighter mb-10">BİZE ULAŞIN.</h2></Reveal>
          <Reveal delay={200}><p className="text-xl text-[var(--text-secondary)] mb-12">Sistem hakkında daha fazla bilgi almak veya teknik destek için bizimle iletişime geçin.</p></Reveal>
          <Reveal delay={400} className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-soft)] flex flex-col items-center">
               <span className="text-3xl mb-4">📧</span>
               <span className="font-bold">destek@velauto.com</span>
            </div>
            <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-soft)] flex flex-col items-center">
               <span className="text-3xl mb-4">📞</span>
               <span className="font-bold">+90 (212) 555 01 01</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[var(--border-soft)] bg-[var(--bg-card)]/20">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="text-2xl font-black tracking-tighter mb-4 text-[var(--accent)]">VELAUTO</div>
            <p className="text-[var(--text-muted)] text-sm">© 2026 VelAuto Intelligence. Tüm Hakları Saklıdır.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            <button onClick={() => setActiveModal('terms')} className="hover:text-[var(--accent)] transition-colors">Kullanım Koşulları</button>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-[var(--accent)] transition-colors">Gizlilik Politikası</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-[var(--accent)] transition-colors">İletişim</button>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        html { scroll-behavior: smooth; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
