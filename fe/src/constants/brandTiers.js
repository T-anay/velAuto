export const brandTiers = {
  economy: {
    label: 'Ekonomi',
    multiplier: 0.9,
    brands: ['Fiat', 'Renault', 'Dacia', 'Hyundai', 'Kia', 'Citroen', 'Peugeot'],
  },
  standard: {
    label: 'Standart',
    multiplier: 1,
    brands: ['Toyota', 'Honda', 'Volkswagen', 'Ford', 'Opel', 'Skoda', 'Seat'],
  },
  premium: {
    label: 'Premium',
    multiplier: 1.25,
    brands: ['BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'Mini'],
  },
  luxury: {
    label: 'Luks',
    multiplier: 1.6,
    brands: ['Porsche', 'Maserati', 'Land Rover', 'Jaguar', 'Bentley', 'Ferrari'],
  },
};

export const getBrandTier = (brand = '') => {
  const normalized = String(brand).toLowerCase();
  return Object.values(brandTiers).find((tier) => (
    tier.brands.some((entry) => normalized.includes(entry.toLowerCase()))
  )) || brandTiers.standard;
};

export const applyBrandMultiplier = (price, brand) => {
  const tier = getBrandTier(brand);
  return Math.round(Number(price || 0) * tier.multiplier);
};
