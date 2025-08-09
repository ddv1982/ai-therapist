import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { generateSecureRandomString } from '@/lib/utils';

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  name: string;
  userAgent: string;
  ipAddress: string;
}

export interface AuthSessionData {
  sessionToken: string;
  expiresAt: Date;
  deviceId: string;
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
  
  // Look for existing device with same fingerprint
  let device = await prisma.trustedDevice.findFirst({
    where: { fingerprint },
  });
  
  if (!device) {
    // Create new device entry
    const deviceId = generateSecureRandomString(32);
    device = await prisma.trustedDevice.create({
      data: {
        deviceId,
        name: deviceName,
        fingerprint,
        ipAddress,
        userAgent,
        lastSeen: new Date(),
      },
    });
  } else {
    // Update last seen and IP (IP might change)
    device = await prisma.trustedDevice.update({
      where: { id: device.id },
      data: {
        lastSeen: new Date(),
        ipAddress,
      },
    });
  }
  
  return {
    deviceId: device.deviceId,
    fingerprint: device.fingerprint,
    name: device.name,
    userAgent: device.userAgent,
    ipAddress: device.ipAddress,
  };
}

/**
 * Create authentication session for a device
 */
export async function createAuthSession(deviceId: string, ipAddress: string): Promise<AuthSessionData> {
  const sessionToken = generateSecureRandomString(64);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  // Find the device record
  const device = await prisma.trustedDevice.findUnique({
    where: { deviceId },
  });
  
  if (!device) {
    throw new Error('Device not found');
  }
  
  // Clean up old sessions for this device
  await prisma.authSession.deleteMany({
    where: {
      deviceId: device.id,
      expiresAt: { lt: new Date() },
    },
  });
  
  // Create new session
  await prisma.authSession.create({
    data: {
      sessionToken,
      deviceId: device.id,
      ipAddress,
      expiresAt,
    },
  });
  
  return {
    sessionToken,
    expiresAt,
    deviceId,
  };
}

/**
 * Verify authentication session
 */
export async function verifyAuthSession(sessionToken: string): Promise<DeviceInfo | null> {
  const session = await prisma.authSession.findUnique({
    where: { sessionToken },
    include: { device: true },
  });
  
  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.authSession.delete({
        where: { id: session.id },
      });
    }
    return null;
  }
  
  // Update last activity
  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastActivity: new Date() },
  });
  
  return {
    deviceId: session.device.deviceId,
    fingerprint: session.device.fingerprint,
    name: session.device.name,
    userAgent: session.device.userAgent,
    ipAddress: session.device.ipAddress,
  };
}

/**
 * Revoke authentication session
 */
export async function revokeAuthSession(sessionToken: string): Promise<boolean> {
  const result = await prisma.authSession.deleteMany({
    where: { sessionToken },
  });
  
  return result.count > 0;
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
  const devices = await prisma.trustedDevice.findMany({
    include: {
      authSessions: {
        where: {
          expiresAt: { gt: new Date() },
        },
      },
    },
    orderBy: { lastSeen: 'desc' },
  });
  
  return devices.map(device => ({
    id: device.id,
    deviceId: device.deviceId,
    name: device.name,
    lastSeen: device.lastSeen,
    trustedAt: device.trustedAt,
    ipAddress: device.ipAddress,
    hasActiveSessions: device.authSessions.length > 0,
  }));
}

/**
 * Revoke device trust (removes device and all its sessions)
 */
export async function revokeDeviceTrust(deviceId: string): Promise<boolean> {
  const device = await prisma.trustedDevice.findUnique({
    where: { deviceId },
  });
  
  if (!device) {
    return false;
  }
  
  // Delete device (cascade will remove sessions)
  await prisma.trustedDevice.delete({
    where: { id: device.id },
  });
  
  return true;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.authSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  
  return result.count;
}