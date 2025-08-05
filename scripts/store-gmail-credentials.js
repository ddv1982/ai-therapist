/**
 * Script to securely store Gmail App Password credentials
 * Run this once to store your Gmail credentials in the encrypted database
 */

const { prisma } = require('../lib/db');
const { encryptEmailCredentials } = require('../lib/encryption');
const path = require('path');

// Set up database path
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

async function storeGmailCredentials() {
  try {
    console.log('🔐 Storing Gmail App Password credentials securely...');
    
    // Your Gmail credentials
    const credentials = {
      service: 'smtp',
      smtpHost: 'smtp.gmail.com',
      smtpUser: 'your-email@gmail.com', // Replace with your actual Gmail address
      smtpPass: 'zvxg gpyx ugoa cuxg', // Your provided App Password
      fromEmail: 'AI Therapist <your-email@gmail.com>' // Replace with your actual Gmail address
    };

    // Generate encryption key if not exists
    if (!process.env.ENCRYPTION_KEY) {
      const crypto = require('crypto');
      const key = crypto.randomBytes(32).toString('hex');
      process.env.ENCRYPTION_KEY = key;
      console.log('⚠️  Generated new encryption key. Add this to your .env.local:');
      console.log(`ENCRYPTION_KEY=${key}`);
      console.log('');
    }

    // Create default device user
    const defaultUserId = 'device-user-default';
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: {
        id: defaultUserId,
        email: 'default@local.device',
        name: 'Computer User',
      },
    });

    // Encrypt and store credentials
    const encryptedData = encryptEmailCredentials(credentials);
    
    await prisma.secureCredential.upsert({
      where: {
        userId_service: {
          userId: defaultUserId,
          service: 'gmail'
        }
      },
      update: {
        encryptedData,
        updatedAt: new Date()
      },
      create: {
        userId: defaultUserId,
        service: 'gmail',
        encryptedData
      }
    });

    console.log('✅ Gmail credentials stored securely in encrypted database!');
    console.log('📧 Your email reports will now use these stored credentials automatically.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update the smtpUser and fromEmail fields with your actual Gmail address');
    console.log('2. Add the ENCRYPTION_KEY to your .env.local file');
    console.log('3. Your App Password is now safely stored and encrypted');
    
  } catch (error) {
    console.error('❌ Failed to store Gmail credentials:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

storeGmailCredentials();