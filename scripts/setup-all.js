#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

/**
 * Run a command and return a promise
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Main setup function
 */
async function setupAll() {
  try {
    console.log('🚀 Starting complete setup for AI Therapist application...\n');

    // Step 1: Environment setup
    console.log('📝 Step 1: Setting up environment configuration...');
    await runCommand('node', [path.join(__dirname, 'setup-env-local.js')]);
    console.log('✅ Environment configuration complete\n');

    // Step 2: Database setup
    console.log('🗃️  Step 2: Setting up database...');
    await runCommand('node', [path.join(__dirname, 'setup-database.js')]);
    console.log('✅ Database setup complete\n');

    // Step 3: Redis setup
    console.log('🔴 Step 3: Setting up Redis caching...');
    await runCommand('node', [path.join(__dirname, 'setup-redis.js')]);
    console.log('✅ Redis setup complete\n');

    // Step 4: Encryption setup
    console.log('🔐 Step 4: Setting up encryption...');
    try {
      await runCommand('node', [path.join(__dirname, 'setup-encryption.js'), 'setup']);
      console.log('✅ Encryption setup complete\n');
    } catch {
      console.log('⚠️  Encryption setup failed, but continuing...');
      console.log('   You may need to run: npm run encryption:setup\n');
    }

    // Step 5: Install dependencies
    console.log('📦 Step 5: Installing dependencies...');
    await runCommand('npm', ['install']);
    console.log('✅ Dependencies installed\n');

    // Step 6: Generate Prisma client
    console.log('🔧 Step 6: Generating Prisma client...');
    await runCommand('npm', ['run', 'db:generate']);
    console.log('✅ Prisma client generated\n');

    // Final verification
    console.log('🔍 Step 7: Verifying setup...');
    
    // Check Redis status
    try {
      await runCommand('npm', ['run', 'redis:status']);
      console.log('✅ Redis is running');
    } catch {
      console.log('⚠️  Redis may not be running. Try: npm run redis:start');
    }

    console.log('\n🎉 Setup complete! Your AI Therapist application is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('   1. Fill in your API keys in .env.local');
    console.log('   2. Run: npm run dev');
    console.log('   3. Open: http://localhost:4000');
    console.log('\n🛠️  Useful commands:');
    console.log('   • Start development: npm run dev');
    console.log('   • Check Redis status: npm run redis:status');
    console.log('   • Cache health check: npm run cache:health');
    console.log('   • Database studio: npm run db:studio');
    console.log('   • Run tests: npm test');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup steps:');
    console.log('   1. npm install');
    console.log('   2. npm run db:setup');
    console.log('   3. npm run redis:setup');
    console.log('   4. npm run encryption:setup');
    console.log('   5. Fill in .env.local with your API keys');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAll();
}

module.exports = { setupAll };
