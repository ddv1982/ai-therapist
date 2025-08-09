/**
 * Authentication & Security Types
 * Type definitions for authentication, security, and user management
 */

// User type (defined here to avoid circular imports)
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication-specific types
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// TOTP and 2FA types
export interface TOTPSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TOTPVerificationRequest {
  token: string;
  backupCode?: string;
}

// Device trust and fingerprinting
export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  canvas?: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: DeviceFingerprint;
  lastUsed: Date;
  trusted: boolean;
}