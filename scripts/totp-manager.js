#!/usr/bin/env node

// Simplified TOTP Management Script
// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/database/db.js';
import { generateTOTPSetup, saveTOTPConfig, resetTOTPConfig, isTOTPSetup, getTOTPDiagnostics, performTOTPHealthCheck } from '../src/lib/auth/totp-service.js';
import readline from 'readline';

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
  console.log('\n💾 Backup Codes (save these in a secure location):');
  console.log('─'.repeat(60));
  codes.forEach((code, index) => {
    console.log(`   ${String(index + 1).padStart(2, '0')}. ${code}`);
  });
  console.log('─'.repeat(60));
}

async function saveQRCodeToFile(dataUrl, filename = 'totp-qr.png') {
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

async function showStatus() {
  try {
    console.log('\n🔍 TOTP Status Check');
    console.log('─'.repeat(40));

    const isSetup = await isTOTPSetup();
    console.log(`Setup: ${isSetup ? '✅ Configured' : '❌ Not configured'}`);

    if (isSetup) {
      const diagnostics = await getTOTPDiagnostics();
      console.log(`Current Time: ${new Date(diagnostics.currentTime * 1000).toISOString()}`);
      console.log(`Current Token: ${diagnostics.currentToken}`);
      console.log(`Time Valid: ${diagnostics.isValidTime ? '✅' : '❌'}`);
    }

    console.log('─'.repeat(40));
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

async function showHealth() {
  try {
    console.log('\n🏥 TOTP Health Check');
    console.log('─'.repeat(50));

    const health = await performTOTPHealthCheck();

    console.log(`Overall Health: ${health.healthy ? '✅ Healthy' : '❌ Issues Found'}`);

    if (health.diagnostics.databaseAccessible) {
      console.log(`Database: ✅ Accessible`);
    } else {
      console.log(`Database: ❌ Not accessible`);
    }

    if (health.diagnostics.isConfigured) {
      console.log(`Configuration: ✅ Set up`);
    } else {
      console.log(`Configuration: ❌ Not configured`);
    }

    if (health.diagnostics.encryptionWorking) {
      console.log(`Encryption: ✅ Working`);
    } else {
      console.log(`Encryption: ❌ Failed`);
    }

    if (health.diagnostics.timeSync) {
      console.log(`Time Sync: ✅ In sync`);
    } else {
      console.log(`Time Sync: ❌ Out of sync`);
    }

    if (health.diagnostics.currentToken) {
      console.log(`Current Token: ${health.diagnostics.currentToken}`);
    }

    if (health.diagnostics.serverTime) {
      console.log(`Server Time: ${health.diagnostics.serverTime}`);
    }

    if (health.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      health.issues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (health.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      health.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log('─'.repeat(50));
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function setupNewTOTP() {
  try {
    console.log('\n🔄 Setting up new TOTP configuration...');

    // Generate new setup
    const setupData = await generateTOTPSetup();

    // Save to database
    await saveTOTPConfig(setupData.secret, setupData.backupCodes);

    console.log('✅ TOTP configuration saved successfully!');

    // Display setup information
    displayManualKey(setupData.manualEntryKey);
    displayQRCode(setupData.qrCodeUrl);
    displayBackupCodes(setupData.backupCodes);

    // Ask if user wants to save QR code
    const saveQR = await askQuestion('\n❓ Save QR code to file? (y/n): ');
    if (saveQR.toLowerCase() === 'yes' || saveQR.toLowerCase() === 'y') {
      const filename = await askQuestion('📁 Filename (press Enter for "totp-qr.png"): ') || 'totp-qr.png';
      await saveQRCodeToFile(setupData.qrCodeUrl, filename);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Open your authenticator app');
    console.log('   2. Scan the QR code or enter the manual key');
    console.log('   3. Save the backup codes in a secure location');
    console.log('   4. Test login with a code from your authenticator');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function resetTOTP() {
  try {
    console.log('\n⚠️  WARNING: This will completely reset TOTP authentication!');
    console.log('   - All TOTP configuration will be deleted');
    console.log('   - All sessions and trusted devices will be cleared');
    console.log('   - You will need to set up TOTP again');

    const confirm = await askQuestion('\n❓ Are you sure you want to reset TOTP? (type "RESET" to confirm): ');
    if (confirm !== 'RESET') {
      console.log('🚫 Reset cancelled.');
      return;
    }

    console.log('\n🔄 Resetting TOTP configuration...');
    await resetTOTPConfig();
    console.log('✅ TOTP configuration reset successfully!');
    console.log('🚀 You can now run setup again if needed.');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

async function testTOTP() {
  try {
    console.log('\n🧪 Testing TOTP functionality...');

    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      console.log('❌ TOTP not configured. Run setup first.');
      return;
    }

    const diagnostics = await getTOTPDiagnostics();
    console.log(`✅ Current token: ${diagnostics.currentToken}`);
    console.log(`✅ Time valid: ${diagnostics.isValidTime}`);

    const testToken = await askQuestion('Enter a TOTP token to test (or press Enter to skip): ');
    if (testToken.trim()) {
      const testDiagnostics = await getTOTPDiagnostics(testToken.trim());
      console.log(`Token valid: ${testDiagnostics.providedTokenValid ? '✅' : '❌'}`);
    }

    console.log('✅ TOTP test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  try {
    console.log('🔐 AI Therapist - TOTP Manager');
    console.log('=' .repeat(50));

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'status') {
      await showStatus();
    } else if (command === 'health') {
      await showHealth();
    } else if (command === 'setup') {
      await setupNewTOTP();
    } else if (command === 'reset') {
      await resetTOTP();
    } else if (command === 'test') {
      await testTOTP();
    } else {
      console.log('\n📋 Available commands:');
      console.log('   status   - Show basic TOTP status');
      console.log('   health   - Comprehensive health check with diagnostics');
      console.log('   setup    - Set up new TOTP configuration');
      console.log('   reset    - Reset TOTP (removes all config)');
      console.log('   test     - Test TOTP functionality');
      console.log('\n💡 Usage: node scripts/totp-manager.js <command>');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
