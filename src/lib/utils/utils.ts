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

// Re-export crypto functions from auth domain
export { 
  generateSecureUUID as generateUUID,
  generateSecureRandomString,
  generateSecureHex,
  generateRequestId,
  generateSessionToken
} from '../auth/crypto-secure';

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
  if (!host) return false;
  const cleanHost = host.toLowerCase().split(':')[0];
  // Match private IP ranges: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  return /192\.168\.\d+\.\d+/.test(cleanHost) ||
         /10\.\d+\.\d+\.\d+/.test(cleanHost) ||
         /172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/.test(cleanHost);
}
