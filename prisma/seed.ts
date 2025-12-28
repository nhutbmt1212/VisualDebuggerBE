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

    // Common data
    const environments = ['production', 'staging', 'development'];
    const eventTypes = ['FUNCTION_CALL', 'HTTP_REQUEST', 'ERROR', 'LOG'];
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const apiPaths = [
        '/api/v1/projects',
        '/api/v1/auth/login',
        '/api/v1/users/me',
        '/api/v1/events',
        '/api/v1/sessions',
        '/api/v1/analytics/stats',
        '/api/v1/checkout',
        '/api/v1/products',
        '/api/v1/cart'
    ];
    const users = [user1, user2, user3];

    // Create more projects
    const projectNames = ['E-Commerce Platform', 'Mobile App Backend', 'Analytics Dashboard', 'Payment Gateway', 'Auth Service', 'Notification Hub'];
    const createdProjects = [];

    for (const name of projectNames) {
        const project = await prisma.project.create({
            data: {
                name,
                description: `Description for ${name}`,
                apiKey: `vd_${name.toLowerCase().replace(/ /g, '_')}_key_${Math.random().toString(36).substring(7)}`,
                userId: users[Math.floor(Math.random() * users.length)].id,
            },
        });
        createdProjects.push(project);
    }

    console.log(`✅ Created ${createdProjects.length} sample projects`);

    // Generate sessions and events for the last 30 days
    console.log('⏳ Generating sessions and events (this may take a moment)...');

    let totalSessions = 0;
    let totalEvents = 0;

    for (const project of createdProjects) {
        // Each project has between 10 to 30 sessions
        const sessionCount = Math.floor(Math.random() * 20) + 10;

        for (let i = 0; i < sessionCount; i++) {
            const startedAt = new Date();
            startedAt.setDate(startedAt.getDate() - Math.floor(Math.random() * 30));
            startedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const session = await prisma.debugSession.create({
                data: {
                    projectId: project.id,
                    environment: environments[Math.floor(Math.random() * environments.length)],
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    startedAt,
                    metadata: {
                        browser: 'Chrome',
                        version: '120.0',
                    },
                },
            });
            totalSessions++;

            // Each session has between 5 to 50 events
            const eventCount = Math.floor(Math.random() * 45) + 5;
            for (let j = 0; j < eventCount; j++) {
                const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const isError = type === 'ERROR';
                const isHttp = type === 'HTTP_REQUEST';

                const method = isHttp ? httpMethods[Math.floor(Math.random() * httpMethods.length)] : null;
                const path = isHttp ? apiPaths[Math.floor(Math.random() * apiPaths.length)] : null;
                const name = isError ? 'ErrorEvent' : (isHttp ? `${method} ${path}` : `Event_${j}`);

                await prisma.debugEvent.create({
                    data: {
                        sessionId: session.id,
                        type,
                        name,
                        filePath: `/src/app/${['utils', 'services', 'components', 'api'][Math.floor(Math.random() * 4)]}/file_${j}.ts`,
                        lineNumber: Math.floor(Math.random() * 500),
                        duration: type === 'HTTP_REQUEST' || type === 'FUNCTION_CALL' ? Math.floor(Math.random() * 1000) : null,
                        httpMethod: method,
                        httpUrl: path,
                        httpStatus: isHttp ? (Math.random() > 0.1 ? 200 : (Math.random() > 0.5 ? 400 : 500)) : null,
                        errorMessage: isError ? 'Something went wrong' : null,
                        timestamp: new Date(startedAt.getTime() + j * 1000), // Events slightly after session start
                    },
                });
                totalEvents++;
            }
        }
    }

    console.log(`✅ Created ${totalSessions} sample debug sessions`);
    console.log(`✅ Created ${totalEvents} sample debug events`);

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
