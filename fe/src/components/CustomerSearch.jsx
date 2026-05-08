import React, { useState, useEffect, useRef } from 'react';

export default function CustomerSearch({ customers = [], onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const nameMatch = c.fullName?.toLowerCase().includes(term) || c.name?.toLowerCase().includes(term);
    const phoneMatch = String(c.phone || '').replace(/\D/g, '').includes(term);
    const plateMatch = c.plate?.toLowerCase().includes(term);
    return nameMatch || phoneMatch || plateMatch;
  });

  const handleSelect = (customer) => {
    setSearchTerm('');
    setIsOpen(false);
    onSelect(customer);
  };

  const formatPhoneDisplay = (phone) => {
    const cleaned = String(phone || '').replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    return match ? [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ') : cleaned;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Mevcut Müşteri Ara (İsim, Telefon, Plaka)"
          className="w-full p-4 pl-12 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder:text-gray-500 focus:border-[var(--accent)] font-sans"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[var(--accent)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() !== '' && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {filteredCustomers.length > 0 ? (
            <ul className="py-2">
              {filteredCustomers.map(customer => (
                <li
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="px-4 py-3 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors border-b border-[var(--border-strong)]/30 last:border-0 flex items-center justify-between group"
                >
                  <div>
                    <p className="text-[var(--text-primary)] font-bold text-sm group-hover:text-[var(--accent)] transition-colors">
                      {customer.fullName || customer.name}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 font-medium">
                      <span>{formatPhoneDisplay(customer.phone) || 'Telefon Yok'}</span>
                      {customer.plate && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="uppercase tracking-wider">{customer.plate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              Eşleşen kayıt bulunamadı. Yeni bir müşteri olarak girebilirsiniz.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
