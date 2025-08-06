import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { generateSecureRandomString } from '@/lib/utils';
import { encryptSensitiveData, decryptSensitiveData, encryptBackupCodes, decryptBackupCodes } from '@/lib/crypto-utils';

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
  const verificationId = Math.random().toString(36).substring(7);
  console.log(`  🔍 [${verificationId}] TOTP verification starting`);
  
  const config = await prisma.authConfig.findFirst();
  if (!config || !config.isSetup) {
    console.error(`  ❌ [${verificationId}] TOTP verification failed: No config or not setup`);
    return false;
  }

  // Decrypt the secret for use
  const decryptedSecret = decryptSensitiveData(config.secret);

  // Clean and validate token format
  const cleanToken = token.replace(/\s/g, ''); // Remove any whitespace
  console.log(`  🧽 [${verificationId}] Token cleaned: "${token}" -> "${cleanToken}"`);
  
  if (!/^\d{6}$/.test(cleanToken)) {
    console.error(`  ❌ [${verificationId}] Invalid token format: "${cleanToken}" (length: ${cleanToken.length})`);
    return false;
  }

  // Get current time info for comparison
  const currentTime = Math.floor(Date.now() / 1000);
  const currentToken = speakeasy.totp({
    secret: decryptedSecret,
    encoding: 'base32',
    time: currentTime,
  });
  
  console.log(`  🕰 [${verificationId}] Server time: ${new Date().toISOString()}`);
  console.log(`  🔢 [${verificationId}] Current server token: ${currentToken}`);
  console.log(`  📱 [${verificationId}] Provided token: ${cleanToken}`);
  console.log(`  ⚖️ [${verificationId}] Tokens match: ${currentToken === cleanToken ? 'YES' : 'NO'}`);

  // Verification with window tolerance
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: cleanToken,
    window: 4, // Increased from 2 to 4 for better multi-device support
  });

  console.log(`  ${verified ? '✅' : '❌'} [${verificationId}] TOTP verification: ${verified ? 'SUCCESS' : 'FAILED'}`);
  
  // If verification failed, show time windows for debugging
  if (!verified) {
    console.log(`  🔍 [${verificationId}] Checking time windows for token match:`);
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
        console.log(`  ⭐ [${verificationId}] MATCH FOUND at window ${i} (${i * 30}s offset): ${testToken}`);
        console.log(`  🕰 [${verificationId}] Match time: ${new Date(testTime * 1000).toISOString()}`);
        foundMatch = true;
      }
    }
    
    if (!foundMatch) {
      console.log(`  ❌ [${verificationId}] No token match found in any time window`);
      console.log(`  💡 [${verificationId}] Possible issues: device time sync, wrong secret, or expired token`);
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

  return backupCodes.filter(code => !code.used).length;
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