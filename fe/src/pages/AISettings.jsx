import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { damagePrices, aiCatalogCategories } from '../constants/damageCatalogMap';
import { brandTiers } from '../constants/brandTiers';
import { carBrands as initialCarBrands } from '../constants/carData';
import { pushToast } from '../lib/toastBus';

export default function AISettings() {
  const [prices, setPrices] = useState(damagePrices);
  const [selectedCategory, setSelectedCategory] = useState(aiCatalogCategories[0]);
  const [tempPrice, setTempPrice] = useState(damagePrices[aiCatalogCategories[0]] || 0);

  const [tiers, setTiers] = useState(() => {
    const obj = {};
    Object.keys(brandTiers).forEach(key => {
      obj[key] = { ...brandTiers[key] };
    });
    return obj;
  });

  const [carData, setCarData] = useState(initialCarBrands);
  const [selectedBrandForModels, setSelectedBrandForModels] = useState(Object.keys(initialCarBrands)[0]);
  const [newModelName, setNewModelName] = useState('');

  const [brandToMove, setBrandToMove] = useState(Object.keys(initialCarBrands)[0]);
  const [targetTier, setTargetTier] = useState('economy');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');

  useEffect(() => {
    setTempPrice(prices[selectedCategory] || 0);
  }, [selectedCategory, prices]);

  const updateCategoryPrice = () => {
    setPrices({ ...prices, [selectedCategory]: Number(tempPrice) });
    pushToast({ type: 'success', title: 'Guncellendi', message: 'Kategori fiyati degistirildi.' });
  };

  const addOrMoveBrandToTier = () => {
    const brandName = isAddingNewBrand ? customBrandName : brandToMove;
    if (!brandName) return;
    const updatedTiers = { ...tiers };
    Object.keys(updatedTiers).forEach(k => {
      updatedTiers[k].brands = updatedTiers[k].brands.filter(b => b.toLowerCase() !== brandName.toLowerCase());
    });
    updatedTiers[targetTier].brands.push(brandName);
    setTiers(updatedTiers);
    if (!carData[brandName]) setCarData({ ...carData, [brandName]: [] });
    setCustomBrandName('');
    setIsAddingNewBrand(false);
    pushToast({ type: 'success', title: 'Basarili', message: 'Marka segmenti guncellendi.' });
  };

  const removeBrand = (tierKey, brandName) => {
    const updatedTiers = { ...tiers };
    updatedTiers[tierKey].brands = updatedTiers[tierKey].brands.filter(b => b !== brandName);
    setTiers(updatedTiers);
  };

  const addModel = () => {
    if (!newModelName || !selectedBrandForModels) return;
    const updatedCarData = { ...carData };
    const modelsToAdd = newModelName.split(',').map(m => m.trim()).filter(m => m !== '');
    modelsToAdd.forEach(m => {
      if (!updatedCarData[selectedBrandForModels].includes(m)) updatedCarData[selectedBrandForModels].push(m);
    });
    setCarData(updatedCarData);
    setNewModelName('');
    pushToast({ type: 'success', title: 'Eklendi', message: 'Modeller listeye alindi.' });
  };

  const removeModel = (brand, model) => {
    const updatedCarData = { ...carData };
    updatedCarData[brand] = updatedCarData[brand].filter(m => m !== model);
    setCarData(updatedCarData);
  };

  const handleSave = () => {
    localStorage.setItem('AI_DAMAGE_PRICES', JSON.stringify(prices));
    localStorage.setItem('AI_BRAND_TIERS', JSON.stringify(tiers));
    localStorage.setItem('AI_CAR_DATA', JSON.stringify(carData));
    pushToast({ type: 'success', title: 'Kaydedildi', message: 'Tum ayarlar kalici olarak saklandi.' });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-soft)] shadow-sm">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">AI Fiyat ve Arac Ayarlari</h1>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Konfigurasyon Paneli</p>
          </div>
        </div>
        <button onClick={handleSave} className="px-8 py-4 bg-[var(--accent)] text-white font-black rounded-xl shadow-lg hover:brightness-110 transition-all active:scale-95">
          AYARLARI KAYDET
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL KOLON: Fiyatlar ve Carpanlar */}
        <div className="space-y-6">
          <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></span>
              Katalog Fiyat Ayari
            </h2>
            <div className="space-y-4">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl font-bold outline-none">
                {aiCatalogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} className="w-full p-4 pr-12 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl text-xl font-black outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-muted)]">TL</span>
                </div>
                <button onClick={updateCategoryPrice} className="px-6 bg-[var(--bg-main)] border-2 border-[var(--accent)] text-[var(--accent)] font-black rounded-xl hover:bg-[var(--accent)] hover:text-white transition-all">GUNCELLE</button>
              </div>
            </div>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--danger)] rounded-full"></span>
              Segment Carpanlari
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(tiers).map(key => (
                <div key={key} className="p-3 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl flex justify-between items-center">
                  <span className="text-xs font-black">{tiers[key].label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-[var(--text-muted)]">x</span>
                    <input type="number" step="0.1" value={tiers[key].multiplier} onChange={(e) => {
                      const newTiers = { ...tiers };
                      newTiers[key].multiplier = Number(e.target.value);
                      setTiers(newTiers);
                    }} className="w-10 bg-transparent font-black text-[var(--accent)] outline-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--warning)] rounded-full"></span>
              Model Yonetimi
            </h2>
            <div className="space-y-4">
              <select value={selectedBrandForModels} onChange={(e) => setSelectedBrandForModels(e.target.value)} className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl font-bold outline-none">
                {Object.keys(carData).sort().map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="text" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Orn: Clio, Megane, Symbol..." className="flex-1 p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-xl font-bold outline-none" />
                <button onClick={addModel} className="px-6 bg-[#4f46e5] text-white font-black rounded-xl hover:brightness-110 shadow-lg flex items-center justify-center text-2xl">+</button>
              </div>
              <div className="max-h-48 overflow-y-auto flex flex-wrap gap-2 pr-2 custom-scrollbar">
                {(carData[selectedBrandForModels] || []).sort().map(m => (
                  <div key={m} className="px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-lg text-[11px] font-bold flex items-center gap-2 group">
                    <span>{m}</span>
                    <button onClick={() => removeModel(selectedBrandForModels, m)} className="text-[var(--danger)] font-black">×</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* SAG KOLON: Marka Segment Eslesmesi */}
        <div className="space-y-6">
          <section className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></span>
              Marka Segment Eslesmesi
            </h2>
            
            <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-soft)] mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase">Marka</label>
                  {isAddingNewBrand ? (
                    <input type="text" value={customBrandName} onChange={(e) => setCustomBrandName(e.target.value)} placeholder="Yeni marka..." className="w-full p-3 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg font-bold outline-none" />
                  ) : (
                    <select value={brandToMove} onChange={(e) => { setBrandToMove(e.target.value); setSelectedBrandForModels(e.target.value); }} className="w-full p-3 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg font-bold outline-none">
                      {Object.keys(carData).sort().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  )}
                  <button onClick={() => setIsAddingNewBrand(!isAddingNewBrand)} className="text-[10px] font-black text-[var(--accent)] hover:underline">{isAddingNewBrand ? 'Vazgec' : '+ Yeni Marka'}</button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase">Segment</label>
                  <select value={targetTier} onChange={(e) => setTargetTier(e.target.value)} className="w-full p-3 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg font-bold outline-none">
                    {Object.keys(tiers).map(k => <option key={k} value={k}>{tiers[k].label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={addOrMoveBrandToTier} className="w-full py-3 bg-[var(--accent)] text-white font-black rounded-lg hover:brightness-110 transition-all text-sm">ESLESTIR / GUNCELLE</button>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {Object.keys(tiers).map(key => (
                <div key={key} className="p-4 bg-[var(--bg-main)] border border-[var(--border-soft)] rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-black uppercase text-[var(--text-primary)]">{tiers[key].label}</h3>
                    <span className="text-[10px] font-black text-[var(--accent)]">x{tiers[key].multiplier}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tiers[key].brands.sort().map(brand => (
                      <button key={brand} onClick={() => { setSelectedBrandForModels(brand); setBrandToMove(brand); setIsAddingNewBrand(false); }} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${selectedBrandForModels === brand ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-soft)] hover:border-[var(--accent)]'}`}>
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
