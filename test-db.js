const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    try {
        console.log('🔄 Testing Supabase database connection...');
        console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':***@'));

        // Test basic connection
        console.log('🔍 Testing basic connection...');
        const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
        console.log('✅ Basic connection successful!');
        console.log('📊 Query result:', result);

        // Test table access
        console.log('🔍 Testing table access...');
        const userCount = await prisma.application_user.count();
        console.log(`✅ Found ${userCount} users in database`);

        // Test a simple select
        const users = await prisma.application_user.findMany({
            take: 1,
            select: {
                user_id: true,
                username: true,
                email: true,
                date_of_creation: true
            }
        });
        console.log('✅ Successfully queried users table');
        console.log('👤 Sample user:', users[0] || 'No users found');

        console.log('🎉 All database tests passed!');

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error meta:', error.meta);

        // Provide specific troubleshooting based on error type
        if (error.message?.includes('authentication failed')) {
            console.log('\n🔧 Troubleshooting: Authentication failed');
            console.log('1. Check your DATABASE_URL password in .env');
            console.log('2. Reset password in Supabase Dashboard → Settings → Database');
            console.log('3. Make sure you\'re using the correct connection string');
        } else if (error.message?.includes('can\'t reach database server')) {
            console.log('\n🔧 Troubleshooting: Can\'t reach server');
            console.log('1. Check if Supabase project is active (not paused)');
            console.log('2. Verify network connectivity');
            console.log('3. Try using port 5432 instead of 6543');
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.log('\n🔧 Troubleshooting: Table doesn\'t exist');
            console.log('1. Run: npx prisma db push');
            console.log('2. Or run: npx prisma migrate deploy');
        }

    } finally {
        await prisma.$disconnect();
        console.log('🔌 Database connection closed');
    }
}

testConnection();