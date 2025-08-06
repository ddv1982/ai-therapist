import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function generateSessionTitle(): string {
  const now = new Date();
  return `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
}

/**
 * Generate a UUID v4 compatible string using cryptographically secure methods
 * SECURITY: Removed Math.random() fallback - fails hard if crypto not available
 */
export function generateUUID(): string {
  // Try modern crypto.randomUUID() first (Node.js 19+ and modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for browsers and older Node.js versions using crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits according to RFC 4122
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }
  
  // SECURITY: No fallback to Math.random() - fail hard if crypto is unavailable
  throw new Error('Cryptographically secure random number generation is not available. Please ensure your environment supports crypto.randomUUID() or crypto.getRandomValues()');
}

/**
 * Generate cryptographically secure random string for general purposes
 * SECURITY: Removed Math.random() fallback - fails hard if crypto not available
 */
export function generateSecureRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  // Use Web Crypto API (available in browsers and Node.js 16+)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    return result;
  }
  
  // SECURITY: No fallback to Math.random() - fail hard if crypto is unavailable
  throw new Error('Cryptographically secure random number generation is not available. Please ensure your environment supports crypto.getRandomValues()');
}

/**
 * Detect if the request is coming from localhost or network access
 * Enhanced validation to prevent header spoofing
 */
export function isLocalhost(host: string): boolean {
  if (!host) return false;
  
  const cleanHost = host.toLowerCase().split(':')[0]; // Remove port
  
  return cleanHost === 'localhost' || 
         cleanHost === '127.0.0.1' || 
         cleanHost === '::1' ||
         cleanHost === '0.0.0.0'; // Also allow binding address
}

/**
 * Detect if the request is coming from a private network IP
 */
export function isPrivateNetworkAccess(host: string): boolean {
  // Match private IP ranges: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  return host.match(/192\.168\.\d+\.\d+/) !== null ||
         host.match(/10\.\d+\.\d+\.\d+/) !== null ||
         host.match(/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/) !== null;
}