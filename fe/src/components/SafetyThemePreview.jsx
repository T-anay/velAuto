export default function SafetyThemePreview() {
  return (
    <section className="card-surface p-6 mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="label-badge text-accent mb-2">Safety & Industrial Demo</p>
          <h3 className="text-h3 text-text-main">Tema Doğrulama Bileşeni</h3>
          <p className="text-body text-text-main/80 mt-1">
            Ana aksiyon butonu Signal Blue, hata kartı Hazard Red ile yüksek kontrast sunar.
          </p>
        </div>

        <button type="button" className="btn-primary-safety min-w-52">
          Ana Aksiyon (Signal Blue)
        </button>
      </div>

      <article className="mt-5 rounded-xl border border-danger/40 bg-danger/12 p-4">
        <p className="label-badge text-danger mb-1">Hazard Red</p>
        <p className="text-body text-text-main">
          Kritik hata: Hidrolik basınç sensörü okunamadı. Lütfen ekipmanı güvenli moda alın.
        </p>
      </article>
    </section>
  );
}
