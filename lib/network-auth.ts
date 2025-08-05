import { generateNetworkPassword } from '@/lib/utils';

// Global password variable that gets set once on server startup
let GLOBAL_NETWORK_PASSWORD: string | null = null;
let INITIALIZED = false;

// Initialize password if not already set
function initializePassword(): string {
  if (!GLOBAL_NETWORK_PASSWORD) {
    GLOBAL_NETWORK_PASSWORD = generateNetworkPassword(16);
    
    // Set as environment variable for consistent access
    process.env.RUNTIME_NETWORK_PASSWORD = GLOBAL_NETWORK_PASSWORD;
    
    if (!INITIALIZED) {
      console.log('\n🔐 NETWORK ACCESS PROTECTION ENABLED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🔑 Network Password: ${GLOBAL_NETWORK_PASSWORD}`);
      console.log('📱 Use this password when accessing from network IP addresses');
      console.log('🏠 Localhost access (127.0.0.1, localhost) bypasses password');
      console.log('⏰ Session expires after 2 hours of inactivity');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      INITIALIZED = true;
    }
  }
  return GLOBAL_NETWORK_PASSWORD;
}

// Get the network password, ensuring it's initialized
export function getNetworkPassword(): string {
  // Try to get from environment first (for consistency)
  if (process.env.RUNTIME_NETWORK_PASSWORD) {
    return process.env.RUNTIME_NETWORK_PASSWORD;
  }
  
  // Initialize if not set
  return initializePassword();
}