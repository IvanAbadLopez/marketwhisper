/**
 * i18n Request Configuration
 * Gets locale from cookie (NEXT_LOCALE) for next-intl without routing
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // Get locale from cookie (set by LocaleSwitcher)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');
  
  // Validate and use cookie value, or fallback to default
  const locale: Locale = 
    localeCookie && locales.includes(localeCookie.value as Locale)
      ? (localeCookie.value as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
