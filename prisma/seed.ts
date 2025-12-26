import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await prisma.debugEvent.deleteMany();
    await prisma.debugSession.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create sample users
    const password = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
        data: {
            email: 'admin@visualdebugger.com',
            name: 'Admin User',
            passwordHash: password,
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: 'developer@example.com',
            name: 'John Developer',
            passwordHash: password,
        },
    });

    const user3 = await prisma.user.create({
        data: {
            email: 'tester@example.com',
            name: 'Jane Tester',
            passwordHash: password,
        },
    });

    console.log('✅ Created 3 sample users');
    console.log('   - admin@visualdebugger.com (password: password123)');
    console.log('   - developer@example.com (password: password123)');
    console.log('   - tester@example.com (password: password123)');

    // Create sample projects
    const project1 = await prisma.project.create({
        data: {
            name: 'E-Commerce Platform',
            description: 'Main production e-commerce application',
            apiKey: 'vd_ecommerce_prod_key_12345',
            userId: user1.id,
        },
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'Mobile App Backend',
            description: 'REST API for mobile application',
            apiKey: 'vd_mobile_api_key_67890',
            userId: user2.id,
        },
    });

    const project3 = await prisma.project.create({
        data: {
            name: 'Analytics Dashboard',
            description: 'Real-time analytics and reporting',
            apiKey: 'vd_analytics_key_abcdef',
            userId: user2.id,
        },
    });

    console.log('✅ Created 3 sample projects');

    // Create sample debug sessions
    const session1 = await prisma.debugSession.create({
        data: {
            projectId: project1.id,
            environment: 'production',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            ipAddress: '192.168.1.100',
            metadata: {
                browser: 'Chrome',
                version: '120.0',
                os: 'Windows 10',
            },
        },
    });

    const session2 = await prisma.debugSession.create({
        data: {
            projectId: project2.id,
            environment: 'development',
            userAgent: 'PostmanRuntime/7.36.0',
            ipAddress: '127.0.0.1',
            metadata: {
                tool: 'Postman',
                version: '10.0',
            },
        },
    });

    console.log('✅ Created 2 sample debug sessions');

    // Create sample debug events
    await prisma.debugEvent.create({
        data: {
            sessionId: session1.id,
            type: 'FUNCTION_CALL',
            name: 'processCheckout',
            filePath: '/src/services/checkout.service.ts',
            lineNumber: 45,
            columnNumber: 12,
            arguments: {
                userId: 'user_123',
                cartId: 'cart_456',
                total: 299.99,
            },
            returnValue: {
                orderId: 'order_789',
                status: 'success',
            },
            duration: 1250,
            depth: 0,
            metadata: {
                requestId: 'req_abc123',
            },
        },
    });

    await prisma.debugEvent.create({
        data: {
            sessionId: session1.id,
            type: 'HTTP_REQUEST',
            name: 'POST /api/checkout',
            filePath: '/src/controllers/checkout.controller.ts',
            lineNumber: 23,
            httpMethod: 'POST',
            httpUrl: '/api/checkout',
            httpStatus: 200,
            duration: 1500,
            depth: 0,
            metadata: {
                headers: {
                    'content-type': 'application/json',
                },
            },
        },
    });

    await prisma.debugEvent.create({
        data: {
            sessionId: session2.id,
            type: 'ERROR',
            name: 'ValidationError',
            filePath: '/src/validators/user.validator.ts',
            lineNumber: 67,
            errorMessage: 'Email format is invalid',
            errorStack: 'ValidationError: Email format is invalid\n    at validate...',
            depth: 0,
            metadata: {
                field: 'email',
                value: 'invalid-email',
            },
        },
    });

    console.log('✅ Created 3 sample debug events');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Projects: ${await prisma.project.count()}`);
    console.log(`   Debug Sessions: ${await prisma.debugSession.count()}`);
    console.log(`   Debug Events: ${await prisma.debugEvent.count()}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
