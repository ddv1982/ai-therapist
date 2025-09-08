import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Always set DATABASE_URL programmatically
process.env.DATABASE_URL = `file:${dbPath}`;

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('🗃️  Setting up database for first time...');
  console.log('📄 Database will be created at: prisma/dev.db');
  
  // Run prisma db push to create the database
  const setupProcess = spawn('npx', ['prisma', 'db', 'push'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` }
  });

  setupProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Database setup complete!');
    } else {
      console.error('❌ Database setup failed');
      process.exit(code);
    }
  });
} else {
  // Database exists, just ensure the client is up to date
  const generateProcess = spawn('npx', ['prisma', 'generate'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` }
  });

  generateProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Prisma client generation failed');
      process.exit(code);
    }
  });
}
