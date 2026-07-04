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
    <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-900">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          disabled={isPending || locale === currentLocale}
          className={`
            px-3 py-1.5 text-sm font-semibold rounded-md transition-all
            ${locale === currentLocale 
              ? 'bg-blue-600 text-white shadow-sm cursor-default' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
