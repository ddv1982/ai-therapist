#!/usr/bin/env tsx

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Regenerate TOTP authentication codes for users who lost access to their authenticator
import { prisma } from '../src/lib/database/db';
import { regenerateTOTPSecret, isTOTPSetup } from '../src/lib/auth/totp-service';
import readline from 'readline';
import fs from 'fs/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function displayQRCode(dataUrl) {
  console.log('\n📱 QR Code Data URL:');
  console.log('─'.repeat(60));
  console.log(dataUrl);
  console.log('─'.repeat(60));
}

function displayManualKey(key) {
  console.log('\n🔑 Manual Entry Key (for manual setup in authenticator app):');
  console.log('─'.repeat(60));
  console.log(`   ${key}`);
  console.log('─'.repeat(60));
}

function displayBackupCodes(codes) {
  console.log('\n💾 New Backup Codes (save these in a secure location):');
  console.log('─'.repeat(60));
  codes.forEach((code, index) => {
    console.log(`   ${String(index + 1).padStart(2, '0')}. ${code}`);
  });
  console.log('─'.repeat(60));
}

async function saveQRCodeToFile(dataUrl, filename = 'new-auth-qr.png') {
  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const filePath = path.resolve(filename);
    await fs.writeFile(filePath, base64Data, 'base64');
    console.log(`\n💾 QR code saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('❌ Failed to save QR code to file:', error.message);
    return null;
  }
}

async function regenerateAuth() {
  try {
    console.log('🔄 AI Therapist - Regenerate Authentication Setup');
    console.log('=' .repeat(60));
    
    // Check if TOTP is configured
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      console.log('❌ TOTP authentication is not currently set up.');
      console.log('💡 Use the initial setup flow in the app instead.');
      return;
    }

    console.log('✅ Current TOTP configuration found.');
    console.log('\n⚠️  WARNING: This will generate a NEW authenticator secret.');
    console.log('   - Current authenticator app will stop working');
    console.log('   - All trusted devices will be logged out');
    console.log('   - New backup codes will be generated');
    
    const confirm = await askQuestion('\n❓ Do you want to continue? (y/n): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('🚫 Operation cancelled.');
      return;
    }

    console.log('\n🔄 Generating new authentication setup...');
    
    // Generate new TOTP secret
    const setupData = await regenerateTOTPSecret();
    
    console.log('✅ New authentication setup generated successfully!');
    
    // Display the new setup information
    displayManualKey(setupData.manualEntryKey);
    displayQRCode(setupData.qrCodeUrl);
    displayBackupCodes(setupData.backupCodes);
    
    // Ask if user wants to save QR code to file
    const saveQR = await askQuestion('\n❓ Save QR code to file? (y/n): ');
    if (saveQR.toLowerCase() === 'yes' || saveQR.toLowerCase() === 'y') {
      const filename = await askQuestion('📁 Filename (press Enter for "new-auth-qr.png"): ') || 'new-auth-qr.png';
      await saveQRCodeToFile(setupData.qrCodeUrl, filename);
    }

    console.log('\n🎉 Regeneration complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Open your authenticator app');
    console.log('   2. Remove the old "AI Therapist" entry');
    console.log('   3. Add new entry by scanning QR code or using manual key');
    console.log('   4. Save the backup codes in a secure location');
    console.log('   5. Test login with a new code from your authenticator');

  } catch (error) {
    console.error('❌ Failed to regenerate authentication:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('🐛 Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
regenerateAuth().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});