/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "just now")
 * @param date - The date to format
 * @param locale - The locale to use (currently unused, for future i18n)
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Fallback (temporary)
  return 'unknown';
}
