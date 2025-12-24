/**
 * Formats seconds into a human-readable time string (MM:SS or HH:MM:SS)
 * @param seconds - Number of seconds to format
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into a natural language time string
 * @param seconds - Number of seconds to format
 * @returns Natural language time string (e.g., "2 minutes 32 seconds", "1 minute", "45 seconds")
 */
export function formatTimeNatural(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (secs > 0) {
    parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }

  return parts.length > 0 ? parts.join(' ') : '0 seconds';
}
