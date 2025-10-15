// scripts/create-test-user.js
/**
 * Creates a simple test user for authentication testing
 * Run with: node scripts/create-test-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        console.log('🔧 Creating test user for authentication...\n');

        // Check if test user already exists
        const existingUser = await prisma.application_user.findUnique({
            where: { email: 'demo@test.com' }
        });

        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log('📧 Email: demo@test.com');
            console.log('🔑 Password: demo123');
            console.log('👤 User ID:', existingUser.user_id);
            return;
        }

        // Create test user
        const hashedPassword = await bcrypt.hash('demo123', 10);
        const testUser = await prisma.application_user.create({
            data: {
                username: 'demouser',
                email: 'demo@test.com',
                password: hashedPassword,
            }
        });

        console.log('✅ Test user created successfully!');
        console.log('📧 Email: demo@test.com');
        console.log('🔑 Password: demo123');
        console.log('👤 User ID:', testUser.user_id);

        // Create a test paper
        const testPaper = await prisma.paper.create({
            data: {
                user_id: testUser.user_id,
                name: 'Demo Paper',
                code: 'DEMO101',
                description: 'Demo paper for testing the multi-lecture selection system'
            }
        });

        console.log('📄 Demo paper created with ID:', testPaper.paper_id);
        console.log('\n🎯 You can now sign in and test the lecture selection features!');

    } catch (error) {
        console.error('❌ Error creating test user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();