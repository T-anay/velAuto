const DEFAULT_CAR_BRANDS = {
    'Renault': ['Clio', 'Megane', 'Symbol', 'Fluence', 'Captur', 'Kadjar', 'Talisman', 'Kangoo', 'Master', 'Twingo'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Jetta', 'Tiguan', 'T-Roc', 'Caddy', 'Transporter', 'Sharan', 'Touran'],
    'Fiat': ['Egea', 'Doblo', 'Linea', 'Tipo', '500', '500L', 'Panda', 'Qubo', 'Ducato', 'Fiorino'],
    'Hyundai': ['i20', 'i30', 'Accent', 'Tucson', 'Santa Fe', 'Elantra', 'i10', 'Kona', 'Creta', 'Staria'],
    'Toyota': ['Corolla', 'Yaris', 'Auris', 'C-HR', 'RAV4', 'Camry', 'Hilux', 'Land Cruiser', 'Proace', 'Aqua'],
    'Opel': ['Astra', 'Corsa', 'Insignia', 'Crossland', 'Grandland', 'Mokka', 'Combo', 'Vivaro', 'Zafira', 'Meriva'],
    'Ford': ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'Puma', 'Ranger', 'Transit', 'Tourneo', 'Mustang', 'Explorer'],
    'Peugeot': ['301', '207', '208', '308', '2008', '3008', 'Partner', 'Expert', 'Boxer', 'Bipper'],
    'Citroen': ['C-Elysee', 'Berlingo', 'C3', 'C4', 'C5 Aircross', 'Jumpy', 'Nemo', 'DS3', 'DS4', 'DS5'],
    'Honda': ['Civic', 'City', 'Jazz', 'CR-V', 'HR-V', 'Accord', 'Insight', 'Pilot', 'Ridgeline', 'Odyssey'],
    'Nissan': ['Micra', 'Qashqai', 'Juke', 'X-Trail', 'Navara', 'Primera', 'Almera', 'Pulsar', 'NV200', 'NV400'],
    'Kia': ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto', 'Stonic', 'Niro', 'Carnival', 'Optima', 'Soul'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'A-Class', 'GLC', 'GLE', 'S-Class', 'CLA', 'GLA', 'Vito', 'Sprinter'],
    'BMW': ['3 Serisi', '5 Serisi', '1 Serisi', 'X3', 'X5', 'X1', '7 Serisi', 'X6', 'i3', 'Z4'],
    'Audi': ['A3', 'A4', 'A6', 'Q5', 'Q7', 'Q3', 'A1', 'A5', 'TT', 'A8'],
    'Skoda': ['Octavia', 'Fabia', 'Superb', 'Kodiaq', 'Karoq', 'Scala', 'Kamiq', 'Rapid', 'Yeti', 'Roomster'],
    'Seat': ['Ibiza', 'Leon', 'Ateca', 'Arona', 'Tarraco', 'Toledo', 'Alhambra', 'Mii', 'Altea', 'Exeo'],
    'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-30', 'CX-9', 'MX-5', 'Mazda2', 'CX-3', 'BT-50', 'CX-60'],
    'Mitsubishi': ['L200', 'ASX', 'Outlander', 'Eclipse Cross', 'Pajero', 'Colt', 'Space Star', 'Grandis', 'Fuso', 'i-MiEV'],
    'Volvo': ['XC60', 'XC90', 'XC40', 'S60', 'S90', 'V60', 'V90', 'C30', 'C70', 'S40'],
    'Dacia': ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker', 'Spring', 'Jogger', 'Sandero Stepway', 'Logan MCV', 'Duster Oroch'],
    'Tofaş': ['Doğan', 'Şahin', 'Kartal', 'Murat 124', 'Murat 131', 'Serçe', 'Uno', 'Tempra', 'Fiorino', 'Tipo'],
    'Anadol': ['Anadol A1', 'Anadol A2', 'Anadol STC-16', 'Anadol SC', 'Anadol SL', 'Anadol SV', 'Anadol ST', 'Anadol A3', 'Anadol A4', 'Anadol A5'],
    'Diğer': []
};

export const carBrands = JSON.parse(localStorage.getItem('AI_CAR_DATA')) || DEFAULT_CAR_BRANDS;