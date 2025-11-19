#!/usr/bin/env node

/**
 * Run database audit to check for orphaned data and legacy field usage
 * 
 * Usage:
 *   node scripts/run-data-audit.js
 * 
 * This script requires Convex to be running (npm run convex:dev)
 */

const { ConvexHttpClient } = require('convex/browser');
const path = require('path');
const fs = require('fs');

async function runAudit() {
  console.log('🔍 Starting Database Audit...\n');

  // Read CONVEX_URL from .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local not found');
    console.error('   Please create .env.local with CONVEX_URL');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const convexUrlMatch = envContent.match(/CONVEX_URL=["']?([^"'\n]+)["']?/);
  
  if (!convexUrlMatch) {
    console.error('❌ Error: CONVEX_URL not found in .env.local');
    process.exit(1);
  }

  const convexUrl = convexUrlMatch[1];
  const client = new ConvexHttpClient(convexUrl);

  try {
    // 1. Database Stats
    console.log('📊 Database Statistics');
    console.log('─'.repeat(60));
    const stats = await client.query('data_audit:getDatabaseStats');
    console.log(`Users:                  ${stats.users}`);
    console.log(`Sessions:               ${stats.sessions}`);
    console.log(`Messages:               ${stats.messages}`);
    console.log(`Reports:                ${stats.reports}`);
    console.log(`Avg Messages/Session:   ${stats.avgMessagesPerSession}`);
    console.log(`Avg Reports/Session:    ${stats.avgReportsPerSession}`);
    console.log('');

    // 2. Verify Indexes
    console.log('🔍 Index Verification');
    console.log('─'.repeat(60));
    const indexCheck = await client.query('data_audit:verifyIndexes');
    if (indexCheck.status === 'success') {
      console.log('✅', indexCheck.message);
      console.log(`   Test Session ID: ${indexCheck.testSessionId}`);
      console.log(`   Reports Found: ${indexCheck.reportsFound}`);
      console.log('   Indexes:');
      Object.entries(indexCheck.indexes).forEach(([name, status]) => {
        console.log(`     - ${name}: ${status}`);
      });
    } else {
      console.log('⚠️ ', indexCheck.message);
    }
    console.log('');

    // 3. Check for Orphaned Data
    console.log('🧹 Orphaned Data Check');
    console.log('─'.repeat(60));
    
    const orphanedMessages = await client.query('data_audit:findOrphanedMessages');
    if (orphanedMessages.orphaned > 0) {
      console.log(`⚠️  Found ${orphanedMessages.orphaned} orphaned messages (out of ${orphanedMessages.total})`);
      console.log('   These messages reference sessions that no longer exist');
      orphanedMessages.orphanedMessages.slice(0, 5).forEach(m => {
        console.log(`   - Message ${m.messageId} → Session ${m.sessionId}`);
      });
      if (orphanedMessages.orphaned > 5) {
        console.log(`   ... and ${orphanedMessages.orphaned - 5} more`);
      }
    } else {
      console.log(`✅ No orphaned messages (${orphanedMessages.total} total)`);
    }

    const orphanedReports = await client.query('data_audit:findOrphanedReports');
    if (orphanedReports.orphaned > 0) {
      console.log(`⚠️  Found ${orphanedReports.orphaned} orphaned reports (out of ${orphanedReports.total})`);
      console.log('   These reports reference sessions that no longer exist');
      orphanedReports.orphanedReports.slice(0, 5).forEach(r => {
        console.log(`   - Report ${r.reportId} → Session ${r.sessionId}`);
      });
      if (orphanedReports.orphaned > 5) {
        console.log(`   ... and ${orphanedReports.orphaned - 5} more`);
      }
    } else {
      console.log(`✅ No orphaned reports (${orphanedReports.total} total)`);
    }

    const orphanedSessions = await client.query('data_audit:findOrphanedSessions');
    if (orphanedSessions.orphaned > 0) {
      console.log(`⚠️  Found ${orphanedSessions.orphaned} orphaned sessions (out of ${orphanedSessions.total})`);
      console.log('   These sessions reference users that no longer exist');
      orphanedSessions.orphanedSessions.slice(0, 5).forEach(s => {
        console.log(`   - Session ${s.sessionId} (${s.title}) → User ${s.userId}`);
      });
      if (orphanedSessions.orphaned > 5) {
        console.log(`   ... and ${orphanedSessions.orphaned - 5} more`);
      }
    } else {
      console.log(`✅ No orphaned sessions (${orphanedSessions.total} total)`);
    }
    console.log('');

    // 4. Legacy ID Analysis
    console.log('🔄 Legacy ID Usage Analysis');
    console.log('─'.repeat(60));
    const legacyAnalysis = await client.query('data_audit:analyzeLegacyIds');
    
    console.log('Users:');
    console.log(`  Total: ${legacyAnalysis.users.total}`);
    console.log(`  With legacyId: ${legacyAnalysis.users.withLegacyId} (${legacyAnalysis.users.percentage}%)`);
    
    console.log('Sessions:');
    console.log(`  Total: ${legacyAnalysis.sessions.total}`);
    console.log(`  With legacyId: ${legacyAnalysis.sessions.withLegacyId} (${legacyAnalysis.sessions.percentage}%)`);
    
    console.log('Messages:');
    console.log(`  Total: ${legacyAnalysis.messages.total}`);
    console.log(`  With legacyId: ${legacyAnalysis.messages.withLegacyId} (${legacyAnalysis.messages.percentage}%)`);
    
    console.log('Reports:');
    console.log(`  Total: ${legacyAnalysis.reports.total}`);
    console.log(`  With legacyId: ${legacyAnalysis.reports.withLegacyId} (${legacyAnalysis.reports.percentage}%)`);
    
    console.log('');
    console.log('📋 Recommendation:');
    console.log(`   ${legacyAnalysis.summary.recommendation}`);
    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('✅ Audit Complete!');
    console.log('═'.repeat(60));

    // Return summary for programmatic use
    const hasOrphans = orphanedMessages.orphaned > 0 || 
                       orphanedReports.orphaned > 0 || 
                       orphanedSessions.orphaned > 0;
    
    if (hasOrphans) {
      console.log('\n⚠️  Action Required: Orphaned data found');
      console.log('   Run cleanup mutation to remove orphaned records\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

runAudit();
