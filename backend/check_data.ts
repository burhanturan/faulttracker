import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        const userCount = await prisma.user.count();
        const faultCount = await prisma.fault.count();
        const chiefdomCount = await prisma.chiefdom.count();

        console.log('Users:', userCount);
        console.log('Faults:', faultCount);
        console.log('Chiefdoms:', chiefdomCount);
    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
