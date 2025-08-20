import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/lib/database/db';
import { generateSecureRandomString } from '@/lib/utils/utils';
import { encryptSensitiveData, decryptSensitiveData, encryptBackupCodes, decryptBackupCodes } from '@/lib/auth/crypto-utils';
import { logger } from '@/lib/utils/logger';

export interface TOTPSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

/**
 * Generate a new TOTP secret and setup data
 */
export async function generateTOTPSetup(): Promise<TOTPSetupData> {
  // Generate a secret for TOTP
  const secret = speakeasy.generateSecret({
    name: 'AI Therapist',
    issuer: 'AI Therapist App',
    length: 32,
  });

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    generateSecureRandomString(8).toUpperCase()
  );

  // Generate QR code URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32!,
    qrCodeUrl,
    backupCodes,
    manualEntryKey: secret.base32!,
  };
}

/**
 * Save TOTP configuration to database with encryption
 */
export async function saveTOTPConfig(secret: string, backupCodes: string[]): Promise<void> {
  // First check if config already exists and remove it
  const existingConfig = await prisma.authConfig.findFirst();
  if (existingConfig) {
    await prisma.authConfig.delete({
      where: { id: existingConfig.id }
    });
  }

  // Create backup codes with metadata
  const backupCodesData: BackupCode[] = backupCodes.map(code => ({
    code,
    used: false,
  }));

  // Encrypt sensitive data before storage
  const encryptedSecret = encryptSensitiveData(secret);
  const encryptedBackupCodes = encryptBackupCodes(backupCodesData);

  await prisma.authConfig.create({
    data: {
      secret: encryptedSecret,
      backupCodes: encryptedBackupCodes,
      isSetup: true,
    },
  });
}

/**
 * Get TOTP diagnostics for debugging time sync issues
 */
export async function getTOTPDiagnostics(token?: string): Promise<{
  currentTime: number;
  currentToken: string;
  isValidTime: boolean;
  providedToken?: string;
  providedTokenValid?: boolean;
}> {
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    throw new Error('TOTP not configured');
  }

  // Decrypt the secret for use
  const decryptedSecret = decryptSensitiveData(config.secret);

  const currentTime = Math.floor(Date.now() / 1000);
  const currentToken = speakeasy.totp({
    secret: decryptedSecret,
    encoding: 'base32',
    time: currentTime,
  });

  let providedTokenValid;
  if (token) {
    const cleanToken = token.replace(/\s/g, '');
    providedTokenValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: cleanToken,
      window: 4,
    });
  }

  return {
    currentTime,
    currentToken,
    isValidTime: true,
    providedToken: token,
    providedTokenValid,
  };
}

/**
 * Verify TOTP token
 */
export async function verifyTOTPToken(token: string): Promise<boolean> {
  const verificationId = generateSecureRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
  logger.debug(`TOTP verification starting`, { verificationId });
  
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    logger.debug(`TOTP verification failed: No config or not setup`, { verificationId });
    return false;
  }

  // Decrypt the secret for use
  const decryptedSecret = decryptSensitiveData(config.secret);

  // Clean and validate token format
  const cleanToken = token.replace(/\s/g, ''); // Remove any whitespace
  logger.debug(`Token cleaned`, { verificationId, originalToken: token, cleanToken });
  
  if (!/^\d{6}$/.test(cleanToken)) {
    logger.debug(`Invalid token format`, { verificationId, cleanToken, length: cleanToken.length });
    return false;
  }

  // Get current time info for comparison
  const currentTime = Math.floor(Date.now() / 1000);
  const currentToken = speakeasy.totp({
    secret: decryptedSecret,
    encoding: 'base32',
    time: currentTime,
  });
  
  logger.debug(`Server time`, { verificationId, serverTime: new Date().toISOString() });
  logger.debug(`Current server token`, { verificationId, currentToken });
  logger.debug(`Provided token`, { verificationId, providedToken: cleanToken });
  logger.debug(`Tokens match check`, { verificationId, match: currentToken === cleanToken });

  // Verification with window tolerance
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: cleanToken,
    window: 4, // Increased from 2 to 4 for better multi-device support
  });

  logger.debug(`TOTP verification result`, { verificationId, verified, result: verified ? 'SUCCESS' : 'FAILED' });
  
  // If verification failed, show time windows for debugging
  if (!verified) {
    logger.debug(`Checking time windows for token match`, { verificationId });
    let foundMatch = false;
    
    for (let i = -6; i <= 6; i++) {
      const testTime = currentTime + (i * 30);
      const testToken = speakeasy.totp({
        secret: decryptedSecret,
        encoding: 'base32',
        time: testTime,
      });
      const matches = testToken === cleanToken;
      
      if (matches) {
        logger.debug(`MATCH FOUND at time window`, { verificationId, window: i, offset: i * 30, testToken, matchTime: new Date(testTime * 1000).toISOString() });
        foundMatch = true;
      }
    }
    
    if (!foundMatch) {
      logger.debug(`No token match found in any time window`, { verificationId, possibleIssues: 'device time sync, wrong secret, or expired token' });
    }
  }
  
  return verified;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(code: string): Promise<boolean> {
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    return false;
  }

  let backupCodes: BackupCode[];
  try {
    backupCodes = decryptBackupCodes(config.backupCodes);
  } catch {
    return false;
  }

  // Find and verify the backup code
  const codeIndex = backupCodes.findIndex(
    backup => backup.code === code.toUpperCase() && !backup.used
  );

  if (codeIndex === -1) {
    return false;
  }

  // Mark the backup code as used
  backupCodes[codeIndex].used = true;
  backupCodes[codeIndex].usedAt = new Date();

  // Re-encrypt and update the database
  const encryptedBackupCodes = encryptBackupCodes(backupCodes);
  await prisma.authConfig.update({
    where: { id: config.id },
    data: {
      backupCodes: encryptedBackupCodes,
    },
  });

  return true;
}

/**
 * Check if TOTP is set up
 */
export async function isTOTPSetup(): Promise<boolean> {
  const config = await prisma.authConfig.findFirst();
  return config?.isSetup === true;
}

/**
 * Get unused backup codes count
 */
export async function getUnusedBackupCodesCount(): Promise<number> {
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    return 0;
  }

  let backupCodes: BackupCode[];
  try {
    backupCodes = decryptBackupCodes(config.backupCodes);
  } catch {
    return 0;
  }

  return backupCodes?.filter(code => !code.used).length || 0;
}

/**
 * Generate new backup codes (for regeneration)
 */
export async function regenerateBackupCodes(): Promise<string[]> {
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    throw new Error('TOTP not set up');
  }

  const newBackupCodes = Array.from({ length: 10 }, () => 
    generateSecureRandomString(8).toUpperCase()
  );

  const backupCodesData: BackupCode[] = newBackupCodes.map(code => ({
    code,
    used: false,
  }));

  // Encrypt the backup codes before storage
  const encryptedBackupCodes = encryptBackupCodes(backupCodesData);

  await prisma.authConfig.update({
    where: { id: config.id },
    data: {
      backupCodes: encryptedBackupCodes,
    },
  });

  return newBackupCodes;
}

/**
 * Reset TOTP configuration (for disabling 2FA)
 */
export async function resetTOTPConfig(): Promise<void> {
  const config = await prisma.authConfig.findFirst();
  if (config) {
    await prisma.authConfig.delete({
      where: { id: config.id }
    });
  }

  // Also clear all trusted devices and sessions
  await prisma.authSession.deleteMany({});
  await prisma.trustedDevice.deleteMany({});
}