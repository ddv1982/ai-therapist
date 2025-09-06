#!/usr/bin/env node
/**
 * Encryption Key Setup Script
 * Helps initialize secure encryption keys for the therapeutic AI application
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local if present, otherwise .env
try {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (_) {
  // Non-fatal if env files are missing; setup can still proceed
}

/**
 * Generate a secure encryption key
 */
function generateSecureEncryptionKey() {
  // Generate 256-bit (32 bytes) random key and encode as base64
  const keyBytes = crypto.randomBytes(32);
  return keyBytes.toString('base64');
}

/**
 * Validate encryption key format and strength
 */
function validateEncryptionKey(key) {
  if (!key) {
    return { valid: false, error: 'Encryption key is required' };
  }
  
  if (key.length < 32) {
    return { valid: false, error: 'Encryption key must be at least 32 characters long' };
  }
  
  // Check if it's a properly formatted base64 key (recommended)
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length < 32) {
      return { valid: false, error: 'Encryption key must decode to at least 32 bytes' };
    }
  } catch {
    // If base64 decoding fails, check if it's at least 32 UTF-8 characters
    if (Buffer.from(key, 'utf8').length < 32) {
      return { valid: false, error: 'Encryption key must be at least 32 bytes when encoded as UTF-8' };
    }
  }
  
  return { valid: true };
}

/**
 * Update .env file with encryption key
 */
function updateEnvFile(key) {
  const envPath = path.join(__dirname, '..', '.env');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  
  let envContent = '';
  let targetFile = envLocalPath; // Prefer .env.local for local development
  
  // Read existing .env.local first, then .env
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    targetFile = envPath;
  }
  
  // Check if ENCRYPTION_KEY already exists
  if (envContent.includes('ENCRYPTION_KEY=')) {
    // Replace existing key
    envContent = envContent.replace(/^ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY="${key}"`);
  } else {
    // Add new key
    envContent += envContent.endsWith('\n') ? '' : '\n';
    envContent += `ENCRYPTION_KEY="${key}"\n`;
  }
  
  fs.writeFileSync(targetFile, envContent);
  return targetFile;
}

/**
 * Main setup function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔐 Therapeutic AI - Encryption Key Setup\n');
  
  switch (command) {
    case 'generate':
      const newKey = generateSecureEncryptionKey();
      console.log('✅ Generated secure encryption key:');
      console.log(`ENCRYPTION_KEY="${newKey}"`);
      console.log('\n⚠️  Important Security Notes:');
      console.log('- Store this key securely and never commit it to version control');
      console.log('- Use different keys for development, staging, and production');
      console.log('- Keep a secure backup of production keys');
      console.log('- Rotate keys periodically for enhanced security');
      break;
      
    case 'setup':
      try {
        // If an encryption key already exists and is valid, do not overwrite
        const existingKey = process.env.ENCRYPTION_KEY;
        const existingValid = validateEncryptionKey(existingKey || '').valid;
        if (existingValid) {
          console.log('✅ Encryption key already configured. Skipping generation.');
          console.log('📁 Source: .env.local or environment');
          break;
        }

        const setupKey = generateSecureEncryptionKey();
        const envFile = updateEnvFile(setupKey);
        
        console.log('✅ Encryption key setup completed!');
        console.log(`📁 Updated file: ${envFile}`);
        console.log(`🔑 Generated key: ${setupKey.substring(0, 16)}...`);
        console.log('\n⚠️  Security Checklist:');
        console.log('- ✓ Encryption key generated and saved to .env file');
        console.log('- ⚠️  Ensure .env files are in .gitignore');
        console.log('- ⚠️  Use different keys for production deployment');
        console.log('- ⚠️  Store production keys in secure environment variables');
        
      } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
      }
      break;
      
    case 'validate':
      const keyToValidate = args[1] || process.env.ENCRYPTION_KEY;
      if (!keyToValidate) {
        console.error('❌ No encryption key provided.');
        console.log('Usage: node setup-encryption.js validate <key>');
        console.log('   Or: ENCRYPTION_KEY=<key> node setup-encryption.js validate');
        process.exit(1);
      }
      
      const validation = validateEncryptionKey(keyToValidate);
      if (validation.valid) {
        console.log('✅ Encryption key is valid and secure');
        console.log(`🔑 Key length: ${keyToValidate.length} characters`);
        try {
          const decoded = Buffer.from(keyToValidate, 'base64');
          console.log(`📊 Decoded length: ${decoded.length} bytes (base64 encoded)`);
        } catch {
          const utf8Length = Buffer.from(keyToValidate, 'utf8').length;
          console.log(`📊 UTF-8 length: ${utf8Length} bytes`);
        }
      } else {
        console.error('❌ Invalid encryption key:', validation.error);
        process.exit(1);
      }
      break;
      
    case 'help':
    default:
      console.log('🔐 Encryption Key Management Commands:');
      console.log('');
      console.log('  generate  - Generate a new secure encryption key');
      console.log('  setup     - Generate and save encryption key to .env file');
      console.log('  validate  - Validate an encryption key');
      console.log('  help      - Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/setup-encryption.js generate');
      console.log('  node scripts/setup-encryption.js setup');
      console.log('  node scripts/setup-encryption.js validate <key>');
      console.log('');
      console.log('For production deployment:');
      console.log('1. Generate a key: node scripts/setup-encryption.js generate');
      console.log('2. Store securely in your deployment environment variables');
      console.log('3. Never commit encryption keys to version control');
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureEncryptionKey,
  validateEncryptionKey,
  updateEnvFile
};