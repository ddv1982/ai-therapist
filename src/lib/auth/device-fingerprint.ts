import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import { generateSecureRandomString } from '@/lib/utils/utils';
import type { ConvexTrustedDevice, ConvexAuthSession } from '@/types/convex';

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  name: string;
  userAgent: string;
  ipAddress: string;
  isVerified?: boolean;
}

export interface AuthSessionData {
  sessionToken: string;
  expiresAt: Date;
  deviceId: string;
  isActive?: boolean;
}

/**
 * Generate enhanced device fingerprint with increased entropy
 * Balances security with usability for therapeutic application
 */
export function generateDeviceFingerprint(userAgent: string, additionalData?: {
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
}): string {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  // Enhanced fingerprint with more entropy for security
  const fingerprintData = {
    // Core device information
    os: result.os.name || 'unknown',
    osVersion: result.os.version || 'unknown',
    device: result.device.type || 'desktop',
    deviceModel: result.device.model || 'unknown',
    deviceVendor: result.device.vendor || 'unknown',
    
    // Browser information (for security while maintaining some flexibility)
    browser: result.browser.name || 'unknown',
    browserMajor: result.browser.major || 'unknown',
    
    // Additional entropy data if provided
    screenResolution: additionalData?.screenResolution || 'unknown',
    timezone: additionalData?.timezone || 'unknown', 
    language: additionalData?.language || 'unknown',
    platform: additionalData?.platform || 'unknown',
    
    // CPU architecture if available
    cpu: result.cpu.architecture || 'unknown',
  };
  
  const fingerprintString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
  return createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Generate a fallback device fingerprint with reduced entropy for compatibility
 * Used when enhanced fingerprinting data is not available
 */
export function generateBasicDeviceFingerprint(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  // More permissive fingerprint that groups similar devices together
  // This helps with multi-browser support while maintaining some security
  const fingerprintData = {
    os: result.os.name || 'unknown',
    device: result.device.type || 'desktop',
    browser: result.browser.name || 'unknown',
  };
  
  const fingerprintString = JSON.stringify(fingerprintData);
  return createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Generate a user-friendly device name
 */
export function generateDeviceName(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  const browser = result.browser.name || 'Unknown Browser';
  const os = result.os.name || 'Unknown OS';
  const deviceType = result.device.type || 'desktop';
  
  // Create a readable device name
  if (deviceType === 'mobile') {
    return `${browser} on ${os} Mobile`;
  } else if (deviceType === 'tablet') {
    return `${browser} on ${os} Tablet`;
  } else {
    return `${browser} on ${os}`;
  }
}

/**
 * Get or create device information with enhanced fingerprinting
 * Uses upsert to prevent race conditions during concurrent device creation
 */
export async function getOrCreateDevice(
  userAgent: string, 
  ipAddress: string,
  additionalData?: {
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  }
): Promise<DeviceInfo> {
  // Try enhanced fingerprinting first, fall back to basic if additional data not available
  const fingerprint = additionalData 
    ? generateDeviceFingerprint(userAgent, additionalData)
    : generateBasicDeviceFingerprint(userAgent);
    
  const deviceName = generateDeviceName(userAgent);
  const deviceId = generateSecureRandomString(32);
  
  const client = getConvexHttpClient();
  const now = Date.now();
  const device = await client.mutation(anyApi.auth.upsertTrustedDevice, {
    deviceId,
    name: deviceName,
    fingerprint,
    ipAddress,
    userAgent,
    lastSeen: now,
  });

  const convexDevice = device as ConvexTrustedDevice;
  return {
    deviceId: convexDevice.deviceId,
    fingerprint: convexDevice.fingerprint,
    name: convexDevice.name,
    userAgent: convexDevice.userAgent,
    ipAddress: convexDevice.ipAddress,
  };
}

/**
 * Create authentication session for a device with transaction protection
 */
export async function createAuthSession(deviceId: string, ipAddress: string): Promise<AuthSessionData> {
  const sessionToken = generateSecureRandomString(64);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const client = getConvexHttpClient();
  const device = await client.query(anyApi.auth.getTrustedDeviceByDeviceId, { deviceId });
  const convexDevice = device as ConvexTrustedDevice | null;
  if (!convexDevice) throw new Error('Device not found');
  await client.mutation(anyApi.auth.deleteExpiredAuthSessions, { now: Date.now() });
  await client.mutation(anyApi.auth.createAuthSession, {
    sessionToken,
    deviceId: convexDevice._id,
    ipAddress,
    expiresAt: expiresAt.getTime(),
  });
  return { sessionToken, expiresAt, deviceId };
}

/**
 * Verify authentication session
 */
export async function verifyAuthSession(sessionToken: string): Promise<DeviceInfo | null> {
  const client = getConvexHttpClient();
  const session = await client.query(anyApi.auth.getAuthSessionByToken, { sessionToken });
  const convexSession = session as ConvexAuthSession | null;
  if (!convexSession || convexSession.expiresAt < Date.now()) {
    await client.mutation(anyApi.auth.deleteExpiredAuthSessions, { now: Date.now() });
    return null;
  }
  await client.mutation(anyApi.auth.touchAuthSession, { sessionToken });
  const device = await client.query(anyApi.auth.getTrustedDevice, { id: convexSession.deviceId });
  const convexDevice = device as ConvexTrustedDevice | null;
  if (!convexDevice) return null;
  return {
    deviceId: convexDevice.deviceId,
    fingerprint: convexDevice.fingerprint,
    name: convexDevice.name,
    userAgent: convexDevice.userAgent,
    ipAddress: convexDevice.ipAddress,
  };
}

/**
 * Revoke authentication session
 */
export async function revokeAuthSession(sessionToken: string): Promise<boolean> {
  const client = getConvexHttpClient();
  const session = await client.query(anyApi.auth.getAuthSessionByToken, { sessionToken });
  if (!session) return false;
  await client.mutation(anyApi.auth.deleteAuthSessionByToken, { sessionToken });
  return true;
}

/**
 * Get all trusted devices
 */
export async function getTrustedDevices(): Promise<Array<{
  id: string;
  deviceId: string;
  name: string;
  lastSeen: Date;
  trustedAt: Date;
  ipAddress: string;
  hasActiveSessions: boolean;
}>> {
  const client = getConvexHttpClient();
  const devices = await client.query(anyApi.auth.listTrustedDevices, {});
  const convexDevices = Array.isArray(devices) ? (devices as ConvexTrustedDevice[]) : [];
  const now = Date.now();
  return convexDevices
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map((device) => ({
      id: String(device._id),
      deviceId: device.deviceId,
      name: device.name,
      lastSeen: new Date(device.lastSeen),
      trustedAt: new Date(device.trustedAt),
      ipAddress: device.ipAddress,
      hasActiveSessions: device.lastSeen > now - 30 * 24 * 60 * 60 * 1000,
    }));
}

/**
 * Revoke device trust (removes device and all its sessions)
 */
export async function revokeDeviceTrust(deviceId: string): Promise<boolean> {
  const client = getConvexHttpClient();
  const device = await client.query(anyApi.auth.getTrustedDeviceByDeviceId, { deviceId });
  const convexDevice = device as ConvexTrustedDevice | null;
  if (!convexDevice) return false;
  await client.mutation(anyApi.auth.deleteTrustedDevice, { fingerprint: convexDevice.fingerprint });
  return true;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const client = getConvexHttpClient();
  const res = await client.mutation(anyApi.auth.deleteExpiredAuthSessions, { now: Date.now() });
  const result = res as { count?: number } | null;
  return result?.count ?? 0;
}
