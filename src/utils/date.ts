/**
 * Date utilities for consistent YYYY-MM-DD formatting
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  return formatDate(today);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date object
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date string is valid YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = parseDate(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}


/**
 * Get human-friendly relative date label
 */
export function getRelativeDateLabel(dateString: string): string {
  const date = parseDate(dateString);
  const today = parseDate(getTodayDate());

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";

  // If within last 7 days, show weekday name
  if (diffDays > -7 && diffDays < 0) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Otherwise return standard format
  return formatDate(date);
}
