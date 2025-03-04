import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random password for auth flows
 */
export function generatePassword(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).toUpperCase().slice(2, 4) +
    '!1'
  );
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Truncates a string to a specified length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
