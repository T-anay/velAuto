import React from 'react';
import { normalizePlateText, plateCountries, validatePlate } from '../constants/plateFormats';

export default function PlateInput({
    country = 'TR',
    value,
    province,
    letters,
    digits,
    onChange,
    onCountryChange,
    error,
}) {
    const legacyValue = `${province || ''} ${letters || ''} ${digits || ''}`.trim();
    const currentValue = value ?? legacyValue;
    const isValid = !currentValue || validatePlate(currentValue, country);
    const isTR = country === 'TR';

    const parseTR = (val) => {
        const normalized = normalizePlateText(val || '');
        const match = normalized.match(/^(\d{0,2})\s?([A-Z]{0,3})\s?(\d{0,4})$/);
        if (match) {
            return { p: match[1] || '', l: match[2] || '', d: match[3] || '' };
        }
        const parts = normalized.split(' ');
        return { p: parts[0] || '', l: parts[1] || '', d: parts[2] || '' };
    };

    const { p: trProvince, l: trLetters, d: trDigits } = isTR ? parseTR(currentValue) : { p: '', l: '', d: '' };

    const handleTRChange = (field, raw) => {
        let p = trProvince;
        let l = trLetters;
        let d = trDigits;

        if (field === 'province') p = raw.replace(/\D/g, '').slice(0, 2);
        if (field === 'letters') l = raw.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
        if (field === 'digits') d = raw.replace(/\D/g, '').slice(0, 4);

        const newPlate = (p || l || d) ? `${p} ${l} ${d}`.trimStart() : '';
        
        if (value !== undefined) {
             onChange?.(newPlate);
        } else {
             // Legacy
             onChange?.('province', p);
             onChange?.('letters', l);
             onChange?.('digits', d);
        }
    };

    const handleValueChange = (rawValue) => {
        const normalized = normalizePlateText(rawValue).slice(0, 16);
        if (value !== undefined) {
            onChange?.(normalized);
            return;
        }

        const trMatch = normalized.match(/^(\d{0,2})\s?([A-Z]{0,3})\s?(\d{0,4})$/);
        if (trMatch) {
            onChange?.('province', trMatch[1] || province || '34');
            onChange?.('letters', trMatch[2] || '');
            onChange?.('digits', trMatch[3] || '');
        }
    };

    return (
        <div className="space-y-2 rounded-xl border border-[var(--border-strong)]/20 bg-[var(--bg-main)]/25 p-4">
            <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-gray-500 uppercase font-bold block">Plaka No</label>
                <select
                    value={country}
                    onChange={(event) => onCountryChange?.(event.target.value)}
                    className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-main)] px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                    {plateCountries.map((item) => (
                        <option key={item.country} value={item.country}>{item.country}</option>
                    ))}
                </select>
            </div>

            {isTR ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={trProvince}
                        onChange={(e) => handleTRChange('province', e.target.value)}
                        placeholder="34"
                        className={`min-h-[56px] w-1/4 rounded-xl border bg-[var(--bg-main)] p-4 text-center text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error || !isValid ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                    />
                    <input
                        type="text"
                        value={trLetters}
                        onChange={(e) => handleTRChange('letters', e.target.value)}
                        placeholder="ABC"
                        className={`min-h-[56px] w-1/4 rounded-xl border bg-[var(--bg-main)] p-4 text-center uppercase text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error || !isValid ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                    />
                    <input
                        type="text"
                        value={trDigits}
                        onChange={(e) => handleTRChange('digits', e.target.value)}
                        placeholder="123"
                        className={`min-h-[56px] w-2/4 rounded-xl border bg-[var(--bg-main)] p-4 text-center text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error || !isValid ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                    />
                </div>
            ) : (
                <input
                    type="text"
                    value={currentValue}
                    onChange={(event) => handleValueChange(event.target.value)}
                    placeholder={plateCountries.find((item) => item.country === country)?.placeholder || 'Plaka'}
                    className={`min-h-[56px] w-full rounded-xl border bg-[var(--bg-main)] p-4 text-center uppercase text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error || !isValid ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                />
            )}

            <div className="flex justify-between gap-3 text-[10px] font-bold">
                <span className={isValid ? 'text-gray-500' : 'text-red-400'}>
                    {plateCountries.find((item) => item.country === country)?.hint}
                </span>
                <span className="text-[var(--accent)]">Onizleme: {currentValue || '___'}</span>
            </div>
        </div>
    );
}
