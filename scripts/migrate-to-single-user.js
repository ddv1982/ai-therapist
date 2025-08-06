/**
 * Migration script to consolidate device-specific sessions into a single user account
 * This allows cross-device session access for the therapeutic AI application
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SINGLE_USER_ID = 'therapeutic-ai-user';

async function migrateToSingleUser() {
  try {
    console.log('🔄 Starting migration to single user system...');

    // Get all existing users
    const existingUsers = await prisma.user.findMany({
      include: {
        sessions: {
          include: {
            messages: true,
            reports: true,
          },
        },
      },
    });

    console.log(`📊 Found ${existingUsers.length} existing users`);

    // Create or update the single user
    await prisma.user.upsert({
      where: { id: SINGLE_USER_ID },
      update: {
        name: 'Therapeutic AI User',
        email: 'user@therapeutic-ai.local',
        updatedAt: new Date(),
      },
      create: {
        id: SINGLE_USER_ID,
        name: 'Therapeutic AI User',
        email: 'user@therapeutic-ai.local',
      },
    });

    console.log('✅ Single user account created/updated');

    // Migrate sessions from device-specific users to the single user
    let totalSessionsMigrated = 0;
    let totalMessagesMigrated = 0;
    let totalReportsMigrated = 0;

    for (const user of existingUsers) {
      if (user.id === SINGLE_USER_ID) {
        console.log(`⏭️  Skipping single user account (${user.sessions.length} sessions already belong to it)`);
        continue;
      }

      console.log(`🔄 Migrating ${user.sessions.length} sessions from user: ${user.name || user.id}`);

      // Update each session to belong to the single user
      for (const session of user.sessions) {
        await prisma.session.update({
          where: { id: session.id },
          data: { userId: SINGLE_USER_ID },
        });

        totalSessionsMigrated++;
        totalMessagesMigrated += session.messages.length;
        totalReportsMigrated += session.reports.length;
      }
    }

    // Clean up old device-specific users (that now have no sessions)
    const usersToDelete = existingUsers.filter(user => 
      user.id !== SINGLE_USER_ID && user.sessions.length > 0
    );

    for (const user of usersToDelete) {
      // Double check the user has no sessions (they should all be migrated)
      const remainingSessions = await prisma.session.count({
        where: { userId: user.id }
      });

      if (remainingSessions === 0) {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`🗑️  Deleted old device user: ${user.name || user.id}`);
      } else {
        console.log(`⚠️  Skipping deletion of user ${user.id} - still has ${remainingSessions} sessions`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Migration Summary:`);
    console.log(`   • Sessions migrated: ${totalSessionsMigrated}`);
    console.log(`   • Messages migrated: ${totalMessagesMigrated}`);
    console.log(`   • Reports migrated: ${totalReportsMigrated}`);
    console.log(`   • Old users cleaned up: ${usersToDelete.length}`);

    // Verify the migration
    const finalUser = await prisma.user.findUnique({
      where: { id: SINGLE_USER_ID },
      include: {
        sessions: {
          include: {
            _count: {
              select: { messages: true, reports: true }
            }
          }
        }
      }
    });

    if (finalUser) {
      const totalMessages = finalUser.sessions.reduce((sum, session) => sum + session._count.messages, 0);
      const totalReports = finalUser.sessions.reduce((sum, session) => sum + session._count.reports, 0);
      
      console.log(`\n✅ Verification: Single user now has:`);
      console.log(`   • ${finalUser.sessions.length} sessions`);
      console.log(`   • ${totalMessages} messages`);
      console.log(`   • ${totalReports} reports`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToSingleUser()
    .then(() => {
      console.log('\n🎯 All sessions are now unified! You can access your complete chat history from any device.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToSingleUser };