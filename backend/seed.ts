import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

    // Create Admin and CTC
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: { username: 'admin', password: '123', fullName: 'System Admin', role: 'admin' },
    });

    await prisma.user.upsert({
        where: { username: 'ctc' },
        update: {},
        create: { username: 'ctc', password: '123', fullName: 'CTC Watchman', role: 'ctc_watchman' },
    });

    // Create Workers for each Chiefdom
    for (const chiefdom of chiefdoms) {
        for (let i = 1; i <= 3; i++) {
            const username = `worker_${chiefdom.id}_${i}`;
            await prisma.user.upsert({
                where: { username },
                update: { chiefdomId: chiefdom.id },
                create: {
                    username,
                    password: '123',
                    fullName: `Worker ${i} of ${chiefdom.name}`,
                    role: 'worker',
                    chiefdomId: chiefdom.id,
                },
            });
        }
    }

    console.log('Seed data created: 5 Chiefdoms, Admin, CTC, and 15 Workers');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
