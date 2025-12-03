import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Hash password '123'
    const hashedPassword = await bcrypt.hash('123', 10);

    // Create Chiefdoms
    const chiefdoms = [];
    for (let i = 1; i <= 5; i++) {
        const chiefdom = await prisma.chiefdom.upsert({
            where: { name: `Chiefdom ${i}` },
            update: {},
            create: { name: `Chiefdom ${i}` },
        });
        chiefdoms.push(chiefdom);
    }

    // Create Admin
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: hashedPassword },
        create: { username: 'admin', password: hashedPassword, fullName: 'System Admin', role: 'admin' },
    });

    // Create Engineer
    await prisma.user.upsert({
        where: { username: 'engineer' },
        update: { password: hashedPassword },
        create: { username: 'engineer', password: hashedPassword, fullName: 'Chief Engineer', role: 'engineer' },
    });

    // Create CTC
    await prisma.user.upsert({
        where: { username: 'ctc' },
        update: { password: hashedPassword },
        create: { username: 'ctc', password: hashedPassword, fullName: 'CTC Watchman', role: 'ctc_watchman' },
    });

    // Create Worker (assigned to first Chiefdom)
    await prisma.user.upsert({
        where: { username: 'worker' },
        update: { password: hashedPassword, chiefdomId: chiefdoms[0].id },
        create: {
            username: 'worker',
            password: hashedPassword,
            fullName: 'Field Worker',
            role: 'worker',
            chiefdomId: chiefdoms[0].id,
        },
    });

    // Create additional Workers for testing
    for (const chiefdom of chiefdoms) {
        for (let i = 1; i <= 2; i++) {
            const username = `worker_${chiefdom.id}_${i}`;
            await prisma.user.upsert({
                where: { username },
                update: { password: hashedPassword, chiefdomId: chiefdom.id },
                create: {
                    username,
                    password: hashedPassword,
                    fullName: `Worker ${i} of ${chiefdom.name}`,
                    role: 'worker',
                    chiefdomId: chiefdom.id,
                },
            });
        }
    }

    console.log('Seed data created: Admin, Engineer, CTC, Worker, and extra workers with hashed passwords.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
