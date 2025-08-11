const { spawn } = require('child_process');
const os = require('os');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const networkIP = getNetworkIP();
const port = process.env.PORT || 4000;

console.log('🌐 Starting Therapist AI App (Production)...');
console.log('');
console.log('📍 Network URLs:');
console.log(`   Local:   http://localhost:${port}`);
console.log(`   Network: http://${networkIP}:${port}`);
console.log('');
console.log('📱 Access from other devices using: http://' + networkIP + ':' + port);
console.log('');

// Start Next.js with network binding
const nextProcess = spawn('next', ['start', '--hostname', '0.0.0.0', '--port', port], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Filter Next.js output to avoid duplicate network URLs
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  // Skip lines that contain network URLs from Next.js
  if (!output.includes('Network:') && !output.includes('0.0.0.0')) {
    process.stdout.write(output);
  }
});

nextProcess.stderr.on('data', (data) => {
  const output = data.toString();
  // Skip the shell option warning
  if (!output.includes('shell option')) {
    process.stderr.write(output);
  }
});

nextProcess.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});