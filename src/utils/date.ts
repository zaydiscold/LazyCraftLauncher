/**
 * Date and Time Utilities
 * Shared formatting and manipulation functions
 */

/**
 * Format a date for backup filenames
 * Format: YYYYMMDD-HHMM
 *
 * @example
 * formatBackupTimestamp(new Date('2025-11-17T14:30:00'))
 * // Returns: '20251117-1430'
 */
export function formatBackupTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}`;
}

/**
 * Format a date for log filenames
 * Format: YYYYMMDD
 *
 * @example
 * formatLogDate(new Date('2025-11-17T14:30:00'))
 * // Returns: '20251117'
 */
export function formatLogDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Format a date for ISO 8601 log timestamps
 * Format: YYYY-MM-DD
 *
 * @example
 * formatISODate(new Date('2025-11-17T14:30:00'))
 * // Returns: '2025-11-17'
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format file size in human-readable format
 *
 * @example
 * formatFileSize(1024)  // Returns: '1.0 KB'
 * formatFileSize(1048576)  // Returns: '1.0 MB'
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format uptime in human-readable format
 *
 * @example
 * formatUptime(3665)  // Returns: '1h 1m 5s'
 * formatUptime(65)    // Returns: '1m 5s'
 * formatUptime(30)    // Returns: '30s'
 */
export function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Parse a backup filename timestamp back to a Date
 *
 * @example
 * parseBackupTimestamp('20251117-1430')
 * // Returns: Date object for 2025-11-17 14:30:00
 */
export function parseBackupTimestamp(timestamp: string): Date | null {
  const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hours, minutes] = match;

  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Month is 0-indexed
    parseInt(day, 10),
    parseInt(hours, 10),
    parseInt(minutes, 10)
  );
}

/**
 * Get a human-readable time ago string
 *
 * @example
 * getTimeAgo(Date.now() - 30000)   // Returns: '30 seconds ago'
 * getTimeAgo(Date.now() - 3600000) // Returns: '1 hour ago'
 */
export function getTimeAgo(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
