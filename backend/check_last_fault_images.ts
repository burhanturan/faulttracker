import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastFault() {
    const lastFault = await prisma.fault.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { images: true }
    });

    if (lastFault) {
        console.log('Last Updated Fault:', {
            id: lastFault.id,
            title: lastFault.title,
            status: lastFault.status,
            updatedAt: lastFault.updatedAt,
            imagesCount: lastFault.images.length,
            images: lastFault.images
        });
    } else {
        console.log('No faults found.');
    }
}

checkLastFault()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
