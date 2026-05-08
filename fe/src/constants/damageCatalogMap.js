export const aiCatalogCategories = [
  'Kaporta Onarim',
  'Boya Islemi',
  'Cam Onarim',
  'Tampon Onarim',
  'Far Stop Onarim',
  'Mekanik Kontrol',
  'Fren Sistemi',
  'Lastik Jant',
  'Elektrik Diagnostik',
];

const DEFAULT_PRICES = {
  'Kaporta Onarim': 2500,
  'Boya Islemi': 1800,
  'Cam Onarim': 1200,
  'Tampon Onarim': 1500,
  'Far Stop Onarim': 950,
  'Mekanik Kontrol': 1000,
  'Fren Sistemi': 1400,
  'Lastik Jant': 800,
  'Elektrik Diagnostik': 1100,
};

export const damagePrices = JSON.parse(localStorage.getItem('AI_DAMAGE_PRICES')) || DEFAULT_PRICES;

export const damageCatalogMap = {
  gocuk: ['Kaporta Onarim', 'Boya Islemi'],
  dent: ['Kaporta Onarim', 'Boya Islemi'],
  cizik: ['Boya Islemi', 'Kaporta Onarim'],
  scratch: ['Boya Islemi'],
  cam: ['Cam Onarim'],
  glass: ['Cam Onarim'],
  tampon: ['Tampon Onarim'],
  bumper: ['Tampon Onarim'],
  far: ['Far Stop Onarim', 'Elektrik Diagnostik'],
  stop: ['Far Stop Onarim'],
  fren: ['Fren Sistemi'],
  brake: ['Fren Sistemi'],
  lastik: ['Lastik Jant'],
  tyre: ['Lastik Jant'],
  motor: ['Mekanik Kontrol'],
};

export const mapDamageToCatalog = (label = '') => {
  const normalized = String(label).toLowerCase();
  const matches = new Set();

  Object.entries(damageCatalogMap).forEach(([keyword, categories]) => {
    if (normalized.includes(keyword)) {
      categories.forEach((category) => matches.add(category));
    }
  });

  return Array.from(matches);
};
