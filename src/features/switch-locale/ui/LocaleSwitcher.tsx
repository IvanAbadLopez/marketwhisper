/**
 * Locale Switcher Component
 * Displays current locale and allows switching between available locales
 */

'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { setLocale } from '../api/set-locale';

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          disabled={isPending || locale === currentLocale}
          className={`
            px-3 py-1 text-sm font-medium rounded-md transition-colors
            ${locale === currentLocale 
              ? 'bg-white/10 text-white cursor-default' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
            ${isPending ? 'opacity-50 cursor-wait' : ''}
            disabled:cursor-not-allowed
          `}
          aria-label={`Switch to ${localeLabels[locale]}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
