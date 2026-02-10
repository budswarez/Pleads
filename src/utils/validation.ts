/**
 * Validation utilities for input sanitization and security
 */

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid and uses http/https protocol
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitizes text input by trimming whitespace and limiting length
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Sanitized text
 */
export const sanitizeText = (text: string, maxLength: number = 5000): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Limit length to prevent DOS attacks
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
};

/**
 * Validates and sanitizes a phone number
 * @param phone - The phone number to validate
 * @returns Cleaned phone number with only digits, or empty string if invalid
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Validate length (Brazilian phone numbers are 10-11 digits)
  // International numbers can vary, so we'll be lenient
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return '';
  }

  return digitsOnly;
};

/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns true if the email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex - not perfect but catches most cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitizes HTML input to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML with dangerous tags/attributes removed
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their contents
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove onclick, onerror, and other event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol from links
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
};

/**
 * Validates a Google Places API key format
 * @param key - The API key to validate
 * @returns true if the format looks correct
 */
export const isValidGoogleApiKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Google API keys start with "AIza" and are 39 characters long
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key);
};

/**
 * Validates a Supabase URL format
 * @param url - The Supabase URL to validate
 * @returns true if the format looks correct
 */
export const isValidSupabaseUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Supabase URLs follow the pattern: https://[project-id].supabase.co
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url);
};

/**
 * Validates a Supabase anon key format
 * @param key - The Supabase anon key to validate
 * @returns true if the format looks correct
 */
export const isValidSupabaseKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Supabase anon keys start with "eyJ" (JWT format)
  return key.startsWith('eyJ') && key.length > 100;
};

/**
 * Validates if a string contains only alphanumeric characters and common separators
 * Useful for validating IDs, usernames, etc.
 * @param str - The string to validate
 * @param allowedChars - Additional allowed characters (default: '-_')
 * @returns true if the string is valid
 */
export const isAlphanumeric = (str: string, allowedChars: string = '-_'): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  const regex = new RegExp(`^[a-zA-Z0-9${allowedChars}]+$`);
  return regex.test(str);
};

/**
 * Escapes special characters in a string for use in regex
 * @param str - The string to escape
 * @returns Escaped string
 */
export const escapeRegex = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates a color hex code
 * @param color - The color hex code to validate (e.g., '#FF5733' or '#F00')
 * @returns true if the color format is valid
 */
export const isValidHexColor = (color: string): boolean => {
  if (!color || typeof color !== 'string') {
    return false;
  }

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};
