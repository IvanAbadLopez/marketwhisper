/**
 * Server Action: Set Locale
 * Sets NEXT_LOCALE cookie and revalidates the page
 */

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Locale } from '@/i18n/config';

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  
  // Set cookie with 1 year expiration
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // Revalidate all paths to refresh with new locale
  revalidatePath('/', 'layout');
}
