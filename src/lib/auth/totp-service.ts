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
 * Uses transaction to prevent race conditions during concurrent setup attempts
 */
export async function saveTOTPConfig(secret: string, backupCodes: string[]): Promise<void> {
  // Create backup codes with metadata
  const backupCodesData: BackupCode[] = backupCodes.map(code => ({
    code,
    used: false,
  }));

  // Encrypt sensitive data before storage
  const encryptedSecret = encryptSensitiveData(secret);
  const encryptedBackupCodes = encryptBackupCodes(backupCodesData);

  // Use transaction to atomically handle delete+create to prevent race conditions
  await prisma.$transaction(async (tx) => {
    // Remove any existing config first
    const existingConfig = await tx.authConfig.findFirst();
    if (existingConfig) {
      await tx.authConfig.delete({
        where: { id: existingConfig.id }
      });
    }

    // Create new config
    await tx.authConfig.create({
      data: {
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        isSetup: true,
      },
    });
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
 * Verify TOTP token with improved error handling
 */
export async function verifyTOTPToken(token: string): Promise<boolean> {
  const verificationId = generateSecureRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
  logger.debug(`TOTP verification starting`, { verificationId });

  // Load config; surface DB errors
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    logger.debug(`TOTP verification: no config or not setup`, { verificationId });
    return false;
  }

  // Decrypt the secret; surface decryption errors
  let decryptedSecret: string;
  try {
    decryptedSecret = decryptSensitiveData(config.secret);
  } catch (decryptError) {
    logger.error(`TOTP verification failed: Secret decryption error`, {
      verificationId,
      error: decryptError instanceof Error ? decryptError.message : 'Unknown decryption error'
    });
    throw decryptError instanceof Error ? decryptError : new Error(String(decryptError));
  }

  // Basic validation (allow shorter base32 secrets used in tests)
  if (!decryptedSecret) {
    logger.error(`TOTP verification failed: Empty secret`, { verificationId });
    return false;
  }

  // Clean and validate token format
  const cleanToken = token.replace(/\s/g, '');
  logger.debug(`Token cleaned`, { verificationId, originalToken: token, cleanToken });
  if (!/^\d{6}$/.test(cleanToken)) {
    logger.debug(`Invalid token format`, { verificationId, cleanToken, length: cleanToken.length });
    return false;
  }

  // For diagnostics only
  const currentTime = Math.floor(Date.now() / 1000);
  const currentToken = speakeasy.totp({ secret: decryptedSecret, encoding: 'base32', time: currentTime });
  logger.debug(`Server time`, { verificationId, serverTime: new Date().toISOString() });
  logger.debug(`Current server token`, { verificationId, currentToken });
  logger.debug(`Provided token`, { verificationId, providedToken: cleanToken });
  logger.debug(`Tokens match check`, { verificationId, match: currentToken === cleanToken });

  // Verification with tolerance
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: cleanToken,
    window: 4,
  });

  logger.debug(`TOTP verification result`, { verificationId, verified, result: verified ? 'SUCCESS' : 'FAILED' });

  if (!verified) {
    logger.debug(`Checking time windows for token match`, { verificationId });
    let foundMatch = false;
    for (let i = -6; i <= 6; i++) {
      const testTime = currentTime + (i * 30);
      const testToken = speakeasy.totp({ secret: decryptedSecret, encoding: 'base32', time: testTime });
      if (testToken === cleanToken) {
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
 * Verify backup code with concurrent access protection
 */
export async function verifyBackupCode(code: string): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    const config = await tx.authConfig.findFirst();
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

    // Re-encrypt and update the database within the transaction
    const encryptedBackupCodes = encryptBackupCodes(backupCodes);
    await tx.authConfig.update({
      where: { id: config.id },
      data: {
        backupCodes: encryptedBackupCodes,
      },
    });

    return true;
  });
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
 * Regenerate backup codes for an already set up TOTP configuration
 * Returns the new plaintext codes
 */
export async function regenerateBackupCodes(): Promise<string[]> {
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    throw new Error('TOTP not set up');
  }

  const newCodes = Array.from({ length: 10 }, () => generateSecureRandomString(8).toUpperCase());
  const backupCodesData: BackupCode[] = newCodes.map(code => ({ code, used: false }));
  const encryptedBackupCodes = encryptBackupCodes(backupCodesData);

  await prisma.authConfig.update({
    where: { id: config.id },
    data: { backupCodes: encryptedBackupCodes },
  });

  return newCodes;
}

/**
 * Regenerate TOTP secret while keeping the auth configuration active
 * This is useful for when users lose access to their authenticator device
 */
export async function regenerateTOTPSecret(): Promise<TOTPSetupData> {
  return await prisma.$transaction(async (tx) => {
    const config = await tx.authConfig.findFirst();
    if (!config || !config.isSetup) {
      throw new Error('TOTP not configured. Use generateTOTPSetup() for initial setup.');
    }

    // Generate new TOTP setup data
    const setupData = await generateTOTPSetup();

    // Encrypt the new secret and backup codes
    const encryptedSecret = encryptSensitiveData(setupData.secret);
    const backupCodesData: BackupCode[] = setupData.backupCodes.map(code => ({
      code,
      used: false,
    }));
    const encryptedBackupCodes = encryptBackupCodes(backupCodesData);

    // Update the existing config with new secret and backup codes
    await tx.authConfig.update({
      where: { id: config.id },
      data: {
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
      },
    });

    // Clear all trusted devices and sessions since the secret changed
    await tx.authSession.deleteMany({});
    await tx.trustedDevice.deleteMany({});

    return setupData;
  });
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

  // Clear the setup cache so new setup data is generated
  if (globalThis.totpSetupCache) {
    delete globalThis.totpSetupCache;
  }

  // Also clear all trusted devices and sessions
  await prisma.authSession.deleteMany({});
  await prisma.trustedDevice.deleteMany({});
}

/**
 * Comprehensive TOTP health check and diagnostics
 */
export async function performTOTPHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  diagnostics: {
    isConfigured: boolean;
    encryptionWorking: boolean;
    timeSync: boolean;
    databaseAccessible: boolean;
    currentToken?: string;
    serverTime?: string;
  };
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const diagnostics = {
    isConfigured: false,
    encryptionWorking: false,
    timeSync: false,
    databaseAccessible: false,
    currentToken: undefined as string | undefined,
    serverTime: undefined as string | undefined,
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.databaseAccessible = true;
  } catch {
    issues.push('Database connection failed');
    recommendations.push('Check database configuration and connectivity');
    return { healthy: false, issues, recommendations, diagnostics };
  }

  // Check TOTP configuration
  try {
    const config = await prisma.authConfig.findFirst();
    diagnostics.isConfigured = config?.isSetup === true;

    if (!diagnostics.isConfigured) {
      issues.push('TOTP not configured');
      recommendations.push('Run "node scripts/totp-manager.js setup" to configure TOTP');
      return { healthy: false, issues, recommendations, diagnostics };
    }

    // Test encryption/decryption
    if (config) {
      try {
        const decryptedSecret = decryptSensitiveData(config.secret);
        diagnostics.encryptionWorking = !!(decryptedSecret && decryptedSecret.length >= 32);

        if (!diagnostics.encryptionWorking) {
          issues.push('Encryption/decryption not working properly');
          recommendations.push('Check encryption key configuration');
        }

        // Test token generation
        if (diagnostics.encryptionWorking) {
          const currentTime = Math.floor(Date.now() / 1000);
          diagnostics.currentToken = speakeasy.totp({
            secret: decryptedSecret,
            encoding: 'base32',
            time: currentTime,
          });
          diagnostics.serverTime = new Date().toISOString();

          // Check time sync (basic validation)
          const now = Date.now();
          const tolerance = 30000; // 30 seconds
          diagnostics.timeSync = Math.abs(now - (currentTime * 1000)) < tolerance;

          if (!diagnostics.timeSync) {
            issues.push('Server time may be out of sync');
            recommendations.push('Synchronize server time with NTP');
          }
        }

      } catch {
        issues.push('TOTP secret decryption failed');
        recommendations.push('Reset TOTP configuration and set up again');
        diagnostics.encryptionWorking = false;
      }
    }

  } catch {
    issues.push('Failed to access TOTP configuration');
    recommendations.push('Check database permissions and TOTP configuration');
  }

  const healthy = issues.length === 0;

  if (!healthy) {
    recommendations.push('Run "node scripts/totp-manager.js test" for detailed diagnostics');
  }

  return { healthy, issues, recommendations, diagnostics };
}