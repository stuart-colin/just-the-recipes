import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string into a URL-friendly slug.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified text.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars (alphanumeric, underscore, hyphen)
    .replace(/--+/g, '-')         // Replace multiple hyphens with a single hyphen
    .replace(/^-+/, '')             // Trim hyphens from the start
    .replace(/-+$/, '');            // Trim hyphens from the end
}
