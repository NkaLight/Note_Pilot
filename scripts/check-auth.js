// scripts/check-auth.js
/**
 * Quick script to check authentication status and create a test user if needed
 * Run with: node scripts/check-auth.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAuth() {
    try {
        console.log('🔍 Checking authentication status...\n');

        // Check if any users exist
        const userCount = await prisma.application_user.count();
        console.log(`📊 Total users in database: ${userCount}`);

        if (userCount === 0) {
            console.log('❌ No users found in database after reset');
            console.log('💡 Creating test user...\n');

            // Create a test user
            const hashedPassword = await bcrypt.hash('testpassword123', 10);
            const testUser = await prisma.application_user.create({
                data: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: hashedPassword,
                }
            });

            console.log('✅ Test user created successfully!');
            console.log('📧 Email: test@example.com');
            console.log('🔑 Password: testpassword123');
            console.log('👤 User ID:', testUser.user_id);

            // Create a test paper for the user
            const testPaper = await prisma.paper.create({
                data: {
                    user_id: testUser.user_id,
                    name: 'Test Paper',
                    code: 'TEST101',
                    description: 'Test paper for authentication testing'
                }
            });

            console.log('📄 Test paper created with ID:', testPaper.paper_id);

        } else {
            console.log('✅ Users exist in database');

            // List existing users (without passwords)
            const users = await prisma.application_user.findMany({
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    date_of_creation: true
                }
            });

            console.log('\n📋 Existing users:');
            users.forEach(user => {
                console.log(`  • ${user.email} (${user.username}) - ID: ${user.user_id}`);
            });
        }

        // Check active sessions
        const sessionCount = await prisma.session.count({
            where: {
                expires_at: {
                    gt: new Date()
                },
                is_used: false
            }
        });

        console.log(`\n🔐 Active sessions: ${sessionCount}`);

        if (sessionCount === 0) {
            console.log('❌ No active sessions found');
            console.log('💡 Users need to sign in again to create new sessions');
        }

    } catch (error) {
        console.error('❌ Error checking authentication:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAuth();