import React from 'react';

export default function PlateInput({ province, letters, digits, onChange, error }) {

    const charMap = {
        'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U',
        'ç': 'C', 'ğ': 'G', 'i': 'I', 'ö': 'O', 'ş': 'S', 'ü': 'U'
    };

    const handleLetterChange = (val) => {
        let transformed = val.split('').map(char => charMap[char] || char).join('');

        const finalVal = transformed.toUpperCase().replace(/[^A-Z]/g, '');

        onChange('letters', finalVal.slice(0, 3));
    };

    return (
        <div className="space-y-2 rounded-2xl border border-[var(--border-strong)]/20 bg-[var(--bg-main)]/25 p-4">
            <label className="text-xs text-gray-500 uppercase font-bold block">Plaka No *</label>
            <div className="grid grid-cols-3 gap-3 items-stretch">
                <select
                    value={province}
                    onChange={(e) => onChange('province', e.target.value)}
                    className="min-h-[56px] p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] text-center rounded-xl text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all"
                >
                    {Array.from({ length: 81 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((code) => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={letters}
                    onChange={(e) => handleLetterChange(e.target.value)}
                    placeholder="ABC"
                    className={`min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-center uppercase text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                />

                <input
                    type="text"
                    value={digits}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        onChange('digits', val.slice(0, 4));
                    }}
                    placeholder="000"
                    className={`min-h-[56px] p-4 bg-[var(--bg-main)] border rounded-xl text-center text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] ${error ? 'border-red-500 shadow-[0_0_10px_rgba(236,77,55,0.2)]' : 'border-[var(--border-strong)]'}`}
                />
            </div>
            <p className="text-[10px] text-[var(--accent)] font-bold text-right italic">
                Önizleme: {province} {letters || '___'} {digits || '____'}
            </p>
        </div>
    );
}