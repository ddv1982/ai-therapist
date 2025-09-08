import { spawn } from 'child_process';
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

// Function to detect Next.js port by parsing its output
function detectNextJSPort(output) {
  const portMatch = output.match(/http:\/\/localhost:(\d+)/);
  return portMatch ? portMatch[1] : '4000';
}

console.log('🌐 Starting Therapist AI App...');
console.log('');

// Start Next.js with Turbopack for faster development
const nextProcess = spawn('next', ['dev', '--turbo', '--hostname', '0.0.0.0', '--port', '4000'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    // Environment variables for Turbopack network HMR
    TURBOPACK_DEV_HOST: '0.0.0.0',
    TURBOPACK_DEV_PORT: '4000',
    // Allow network access for HMR
    NEXT_DEV_ALLOW_ANY_HOST: 'true',
  }
});

let portDetected = false;

// Filter Next.js output and detect port
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Detect port from Next.js output
  if (!portDetected && output.includes('http://localhost:')) {
    const port = detectNextJSPort(output);
    console.log('📍 Network URLs:');
    console.log(`   Local:   http://localhost:${port}`);
    console.log(`   Network: http://${networkIP}:${port}`);
    console.log('');
    console.log('📱 Access from other devices using: http://' + networkIP + ':' + port);
    console.log('');
    portDetected = true;
  }
  
  // Skip duplicate network URLs from Next.js
  if (!output.includes('Network:') && !output.includes('0.0.0.0')) {
    process.stdout.write(output);
  }
});

nextProcess.stderr.on('data', (data) => {
  const output = data.toString();
  // Skip the shell option warning and other noise
  if (!output.includes('shell option') && 
      !output.includes('DEP0190') && 
      !output.includes('DeprecationWarning')) {
    process.stderr.write(output);
  }
});

nextProcess.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});
