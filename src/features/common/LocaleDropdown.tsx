'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { locales, type Locale } from '@/i18n/routing';

const localeData: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
};

export function LocaleDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currentLocale = localeData[locale];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 text-white group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        {/* Flag */}
        <span className="text-xl">{currentLocale.flag}</span>
        
        {/* Language name - hidden on mobile */}
        <span className="hidden sm:inline font-medium text-sm">
          {currentLocale.nativeName}
        </span>

        {/* Dropdown arrow */}
        <motion.svg
          className="w-4 h-4 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-48 origin-top-right"
            role="listbox"
            aria-label="Available languages"
          >
            {/* Dropdown card */}
            <div className="bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Language
                </p>
              </div>

              {/* Options */}
              <div className="p-2">
                {locales.map((loc, index) => {
                  const data = localeData[loc];
                  const isSelected = locale === loc;

                  return (
                    <motion.button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#ffdd00] to-[#f7941d] text-[#1a1a2e]'
                          : 'text-white hover:bg-white/10'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: isSelected ? 0 : 4 }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {/* Flag with background */}
                      <span className={`text-2xl ${isSelected ? '' : 'grayscale-0'}`}>
                        {data.flag}
                      </span>

                      {/* Language info */}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{data.nativeName}</p>
                        <p className={`text-xs ${isSelected ? 'text-[#1a1a2e]/70' : 'text-white/50'}`}>
                          {data.name}
                        </p>
                      </div>

                      {/* Checkmark for selected */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#1a1a2e] flex items-center justify-center"
                        >
                          <svg className="w-3 h-3 text-[#ffdd00]" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
