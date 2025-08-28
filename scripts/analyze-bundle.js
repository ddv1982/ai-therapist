#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

function analyzeBundle() {
  const buildDir = path.join(__dirname, '..', '.next');
  const staticDir = path.join(buildDir, 'static');

  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run `npm run build` first.');
    return;
  }

  console.log('📊 Bundle Analysis\n');

  // Analyze chunks
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunks = fs.readdirSync(chunksDir);
    console.log(`📦 Found ${chunks.length} chunks:`);

    chunks.forEach(chunk => {
      const stats = fs.statSync(path.join(chunksDir, chunk));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  • ${chunk}: ${sizeKB} KB`);
    });
  }

  // Analyze CSS
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    console.log(`\n🎨 CSS Files (${cssFiles.length}):`);

    cssFiles.forEach(file => {
      const stats = fs.statSync(path.join(cssDir, file));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  • ${file}: ${sizeKB} KB`);
    });
  }

  console.log('\n💡 Optimization Recommendations:');
  console.log('  • Use dynamic imports for large components');
  console.log('  • Implement code splitting for routes');
  console.log('  • Use tree shaking to remove unused code');
  console.log('  • Optimize images and assets');
  console.log('  • Consider using a CDN for static assets');

  // Check for potential issues
  console.log('\n⚠️  Potential Issues:');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});

  if (deps.length > 50) {
    console.log(`  • High dependency count: ${deps.length} dependencies`);
  }

  if (devDeps.length > 20) {
    console.log(`  • High dev dependency count: ${devDeps.length} dev dependencies`);
  }
}

if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };
