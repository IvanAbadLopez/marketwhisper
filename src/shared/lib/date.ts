/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "just now")
 * @param date - The date to format
 * @param locale - The locale to use (currently unused, for future i18n)
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date, locale: string): string {
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
    return 'just now';
  }

  // Less than 1 hour (1-59 minutes)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 
      ? '1 minute ago' 
      : `${diffInMinutes} minutes ago`;
  }

  // Less than 1 day (1-23 hours)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 
      ? '1 hour ago' 
      : `${diffInHours} hours ago`;
  }

  // Less than 30 days (1-29 days)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 
      ? '1 day ago' 
      : `${diffInDays} days ago`;
  }

  // 30+ days (months)
  const diffInMonths = Math.floor(diffInDays / 30);
  return diffInMonths === 1 
    ? '1 month ago' 
    : `${diffInMonths} months ago`;
}
