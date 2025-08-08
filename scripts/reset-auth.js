// Reset authentication state to fix development environment
const { prisma } = require('../lib/db');
const { resetTOTPConfig } = require('../lib/totp-service');

async function resetAuth() {
  try {
    console.log('🔄 Resetting authentication state...');
    
    // Reset TOTP configuration
    await resetTOTPConfig();
    
    // Clear all sessions
    await prisma.deviceSession.deleteMany({});
    
    console.log('✅ Authentication state reset successfully!');
    console.log('🚀 You can now access the application at http://localhost:3000');
    console.log('⚙️  You will need to set up authentication again if needed');
    
  } catch (error) {
    console.error('❌ Failed to reset authentication:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAuth();