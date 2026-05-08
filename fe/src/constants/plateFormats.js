export const plateFormats = {
  TR: {
    country: 'TR',
    label: 'Turkiye',
    placeholder: '34 ABC 123',
    pattern: /^(\d{2})\s?([A-Z]{1,3})\s?(\d{2,4})$/,
    hint: 'Il kodu, harf grubu ve seri numarasi',
  },
  DE: {
    country: 'DE',
    label: 'Almanya',
    placeholder: 'B AB 1234',
    pattern: /^[A-ZÄÖÜ]{1,3}\s?[A-Z]{1,2}\s?\d{1,4}[A-Z]?$/,
    hint: 'Sehir kodu, harf grubu ve numara',
  },
  GB: {
    country: 'GB',
    label: 'Birlesik Krallik',
    placeholder: 'AB12 CDE',
    pattern: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$/,
    hint: 'Standart UK formatinda serbest metin',
  },
  FREE: {
    country: 'FREE',
    label: 'Serbest',
    placeholder: 'Plaka',
    pattern: /^[A-Z0-9 -]{2,16}$/,
    hint: 'Harf, rakam, bosluk veya tire',
  },
};

export const plateCountries = Object.values(plateFormats);

const charMap = {
  Ç: 'C',
  Ğ: 'G',
  İ: 'I',
  Ö: 'O',
  Ş: 'S',
  Ü: 'U',
  ç: 'C',
  ğ: 'G',
  ı: 'I',
  i: 'I',
  ö: 'O',
  ş: 'S',
  ü: 'U',
};

export const normalizePlateText = (value = '') => String(value)
  .split('')
  .map((char) => charMap[char] || char)
  .join('')
  .toUpperCase()
  .replace(/[^A-Z0-9 -]/g, '')
  .replace(/\s+/g, ' ')
  .trimStart();

export const validatePlate = (plate, country = 'TR') => {
  const config = plateFormats[country] || plateFormats.FREE;
  return config.pattern.test(normalizePlateText(plate).trim());
};
