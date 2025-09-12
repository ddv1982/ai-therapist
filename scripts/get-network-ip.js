import os from 'os';

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const netInterface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        return netInterface.address;
      }
    }
  }
  
  return 'localhost';
}

const networkIP = getNetworkIP();
const port = process.env.PORT || 4000;

console.log('🌐 Network URLs:');
console.log(`   Local:   http://localhost:${port}`);
console.log(`   Network: http://${networkIP}:${port}`);
console.log('');
console.log('📱 You can now access the app from other devices on your network!');
console.log(`   Use: http://${networkIP}:${port}`);