/**
 * Translation function type for next-intl
 */
export type TranslateFunction = (key: string, params?: Record<string, any>) => string;

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "just now")
 * @param date - The date to format
 * @param t - The next-intl translation function
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date, t: TranslateFunction): string {
  // Validate input: check for invalid dates
  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return '';
  }

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return t('relativeTime.justNow');
  }

  // Less than 1 hour (1-59 minutes)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('relativeTime.minutesAgo', { count: diffInMinutes });
  }

  // Less than 1 day (1-23 hours)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('relativeTime.hoursAgo', { count: diffInHours });
  }

  // Less than 30 days (1-29 days)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return t('relativeTime.daysAgo', { count: diffInDays });
  }

  // 30+ days (months)
  const diffInMonths = Math.floor(diffInDays / 30);
  return t('relativeTime.monthsAgo', { count: diffInMonths });
}
