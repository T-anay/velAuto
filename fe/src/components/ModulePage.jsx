import { Link } from 'react-router-dom';

export default function ModulePage({ module }) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3 max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--text-secondary)] font-black">{module.eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">{module.title}</h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-7">{module.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="bg-[var(--accent)] text-white px-5 py-3 rounded-xl font-black hover:brightness-110 active:scale-[0.98] transition-all shadow-lg">
            {module.primaryAction}
          </button>
          <button className="bg-[var(--bg-card)] text-[var(--text-primary)] px-5 py-3 rounded-xl font-bold border border-[var(--border-soft)] hover:border-[var(--accent)] transition-all">
            {module.secondaryAction}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {module.stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-lg">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)] font-black">{stat.label}</p>
            <p className="mt-3 text-3xl font-black text-[var(--text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {module.sections.map((section) => (
          <section key={section.title} className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">{section.title}</h2>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shrink-0" />
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">Backend Desteği</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] font-black text-sm">
            {module.backend}
          </div>
          <p className="mt-4 text-[var(--text-secondary)] leading-7">
            Bu ekran, mevcut servis altyapısına bağlanmak için hazırlanmış bir White Mode konseptidir. Yönetim akışları backend hazır olduğunda aynı arayüz üzerinden gerçek veriye geçirilebilir.
          </p>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-4">Konsept Notu</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            {module.accent}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-black uppercase tracking-widest">WCAG Odaklı</span>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-main)] border border-[var(--border-soft)] text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest">White Mode</span>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-main)] border border-[var(--border-soft)] text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest">Admin Panel</span>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard" className="px-5 py-3 rounded-xl border border-[var(--border-soft)] text-[var(--text-primary)] font-bold hover:border-[var(--accent)] transition-all bg-[var(--bg-card)]">
          Dashboard'a Dön
        </Link>
      </div>
    </div>
  );
}
