/**
 * Simple UUID generator for stable exercise IDs
 */

export function generateId(): string {
  // Simple UUID v4-like generator
  // For production, consider using a library, but keeping it minimal for now
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

