#!/usr/bin/env node
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platform = os.platform();

/**
 * Check if Redis is installed and running
 */
function checkRedisStatus() {
  return new Promise((resolve) => {
    exec('redis-cli ping', (error, stdout) => {
      if (error) {
        resolve({ installed: false, running: false });
      } else {
        resolve({ installed: true, running: stdout.trim() === 'PONG' });
      }
    });
  });
}

/**
 * Install Redis based on platform
 */
function installRedis() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Installing Redis...');

    let command, args;

    switch (platform) {
      case 'darwin': // macOS
        command = 'brew';
        args = ['install', 'redis'];
        break;
      case 'linux':
        command = 'sudo';
        args = ['apt-get', 'update', '&&', 'sudo', 'apt-get', 'install', '-y', 'redis-server'];
        break;
      case 'win32':
        console.log('❌ Windows detected. Please install Redis manually:');
        console.log('   1. Download from: https://github.com/microsoftarchive/redis/releases');
        console.log('   2. Or use WSL: wsl --install');
        console.log('   3. Or use Docker: docker run -d --name redis -p 6379:6379 redis:alpine');
        resolve(false);
        return;
      default:
        console.log(`❌ Unsupported platform: ${platform}`);
        console.log('   Please install Redis manually for your platform');
        resolve(false);
        return;
    }

    const installProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: platform === 'linux', // Use shell for complex commands on Linux
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Redis installed successfully!');
        resolve(true);
      } else {
        console.error('❌ Redis installation failed');
        reject(new Error(`Installation failed with code ${code}`));
      }
    });
  });
}

/**
 * Start Redis service
 */
function startRedis() {
  return new Promise((resolve, _reject) => {
    console.log('🚀 Starting Redis service...');

    let command, args;

    switch (platform) {
      case 'darwin': // macOS
        command = 'brew';
        args = ['services', 'start', 'redis'];
        break;
      case 'linux':
        command = 'sudo';
        args = ['systemctl', 'start', 'redis-server'];
        break;
      case 'win32':
        console.log('⚠️  Please start Redis manually on Windows');
        resolve(true);
        return;
      default:
        console.log('⚠️  Please start Redis manually for your platform');
        resolve(true);
        return;
    }

    const startProcess = spawn(command, args, {
      stdio: 'inherit',
    });

    startProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Redis service started!');
        resolve(true);
      } else {
        console.log('⚠️  Redis service start failed, but continuing...');
        resolve(true); // Don't fail the setup if service start fails
      }
    });
  });
}

/**
 * Update .env.local with Redis configuration
 */
function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env.local with Redis configuration...');

    const envContent = `# Local environment configuration
# Fill in your values as needed. ENCRYPTION_KEY should be a 32-byte (base64) value.

GROQ_API_KEY=""
ENCRYPTION_KEY=""
NEXTAUTH_SECRET=""

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Cache Configuration
CACHE_ENABLED="true"
CACHE_DEFAULT_TTL="300"
CACHE_SESSION_TTL="1800"
CACHE_MESSAGE_TTL="900"

# Development-only options
BYPASS_AUTH=true
RATE_LIMIT_DISABLED=true
`;

    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
    console.log('✅ Created .env.local with Redis configuration');
  } else {
    // Check if Redis config already exists
    const envContent = fs.readFileSync(envPath, 'utf8');

    if (!envContent.includes('REDIS_URL')) {
      console.log('📝 Adding Redis configuration to existing .env.local...');

      const redisConfig = `

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Cache Configuration
CACHE_ENABLED="true"
CACHE_DEFAULT_TTL="300"
CACHE_SESSION_TTL="1800"
CACHE_MESSAGE_TTL="900"
`;

      fs.appendFileSync(envPath, redisConfig, { encoding: 'utf8' });
      console.log('✅ Added Redis configuration to .env.local');
    } else {
      console.log('✅ Redis configuration already exists in .env.local');
    }
  }
}

/**
 * Main setup function
 */
async function setupRedis() {
  try {
    console.log('🔍 Checking Redis status...');

    const { installed, running } = await checkRedisStatus();

    if (installed && running) {
      console.log('✅ Redis is already installed and running!');
      updateEnvFile();
      return;
    }

    if (installed && !running) {
      console.log('⚠️  Redis is installed but not running');
      await startRedis();
      updateEnvFile();
      return;
    }

    if (!installed) {
      console.log('📦 Redis not found, installing...');
      await installRedis();
      await startRedis();
      updateEnvFile();
    }

    // Final verification
    console.log('🔍 Verifying Redis installation...');
    const finalCheck = await checkRedisStatus();

    if (finalCheck.running) {
      console.log('✅ Redis setup complete!');
      console.log('📊 You can check Redis status with: npm run redis:status');
      console.log('🏥 Cache health check: npm run cache:health');
    } else {
      console.log('⚠️  Redis setup completed but service may not be running');
      console.log('   Try running: npm run redis:start');
    }
  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
    console.log('\n🔧 Manual setup instructions:');
    console.log('   macOS: brew install redis && brew services start redis');
    console.log(
      '   Ubuntu: sudo apt-get install redis-server && sudo systemctl start redis-server'
    );
    console.log('   Windows: Download from https://github.com/microsoftarchive/redis/releases');
    console.log('   Docker: docker run -d --name redis -p 6379:6379 redis:alpine');
    process.exit(1);
  }
}

// Run setup immediately when invoked directly
await setupRedis();
