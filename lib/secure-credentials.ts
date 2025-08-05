/**
 * Secure credential management for sensitive data like Google App Passwords
 */

import { prisma } from '@/lib/db';
import { encryptEmailCredentials, decryptEmailCredentials } from '@/lib/encryption';
import { getDeviceUserInfo } from '@/lib/user-session';

export interface EmailCredentials {
  service: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
}

/**
 * Store encrypted email credentials for a user
 */
export async function storeEmailCredentials(
  request: Request,
  credentials: EmailCredentials
): Promise<void> {
  try {
    const deviceUser = getDeviceUserInfo(request);
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: deviceUser.userId },
      update: {},
      create: {
        id: deviceUser.userId,
        email: deviceUser.email,
        name: deviceUser.name,
      },
    });

    // Encrypt the credentials
    const encryptedData = encryptEmailCredentials(credentials);

    // Store in database
    await prisma.secureCredential.upsert({
      where: {
        userId_service: {
          userId: deviceUser.userId,
          service: 'gmail'
        }
      },
      update: {
        encryptedData,
        updatedAt: new Date()
      },
      create: {
        userId: deviceUser.userId,
        service: 'gmail',
        encryptedData
      }
    });

    console.log(`[SECURE_CREDENTIALS] Email credentials stored securely for user: ${deviceUser.userId}`);
  } catch (error) {
    console.error('Failed to store email credentials:', error);
    throw new Error('Failed to store email credentials securely');
  }
}

/**
 * Retrieve and decrypt email credentials for a user
 */
export async function getEmailCredentials(request: Request): Promise<EmailCredentials | null> {
  try {
    const deviceUser = getDeviceUserInfo(request);

    const credential = await prisma.secureCredential.findUnique({
      where: {
        userId_service: {
          userId: deviceUser.userId,
          service: 'gmail'
        }
      }
    });

    if (!credential) {
      return null;
    }

    // Decrypt the credentials
    const decryptedCredentials = decryptEmailCredentials(credential.encryptedData);
    
    console.log(`[SECURE_CREDENTIALS] Email credentials retrieved for user: ${deviceUser.userId}`);
    return decryptedCredentials;
  } catch (error) {
    console.error('Failed to retrieve email credentials:', error);
    return null;
  }
}

/**
 * Check if user has stored email credentials
 */
export async function hasStoredEmailCredentials(request: Request): Promise<boolean> {
  try {
    const deviceUser = getDeviceUserInfo(request);

    const count = await prisma.secureCredential.count({
      where: {
        userId: deviceUser.userId,
        service: 'gmail'
      }
    });

    return count > 0;
  } catch (error) {
    console.error('Failed to check stored credentials:', error);
    return false;
  }
}

/**
 * Delete stored email credentials for a user
 */
export async function deleteEmailCredentials(request: Request): Promise<boolean> {
  try {
    const deviceUser = getDeviceUserInfo(request);

    await prisma.secureCredential.deleteMany({
      where: {
        userId: deviceUser.userId,
        service: 'gmail'
      }
    });

    console.log(`[SECURE_CREDENTIALS] Email credentials deleted for user: ${deviceUser.userId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete email credentials:', error);
    return false;
  }
}

/**
 * Initialize default Gmail credentials (for your specific use case)
 */
export async function initializeDefaultGmailCredentials(request: Request): Promise<void> {
  const defaultCredentials: EmailCredentials = {
    service: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpUser: 'your-email@gmail.com', // You'll need to update this
    smtpPass: 'zvxg gpyx ugoa cuxg', // Your provided app password
    fromEmail: 'AI Therapist <your-email@gmail.com>' // You'll need to update this
  };

  await storeEmailCredentials(request, defaultCredentials);
}