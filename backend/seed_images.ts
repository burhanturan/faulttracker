import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import https from 'https';
import path from 'path';

const prisma = new PrismaClient();

const downloadImage = (url: string, filepath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

async function seedImages() {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const image1Name = 'railway1.jpg';
    const image2Name = 'railway2.jpg';
    const image1Path = path.join(uploadDir, image1Name);
    const image2Path = path.join(uploadDir, image2Name);

    // Placeholder images (using placehold.co for reliability as random railway images might be hard to get directly without API keys)
    // Ideally we would use real railway images, but for this task, placeholders or generic ones are safer to automate.
    // Let's try to get something generic.
    const imageUrl1 = 'https://placehold.co/600x400/222/fff?text=Railway+Image+1';
    const imageUrl2 = 'https://placehold.co/600x400/333/fff?text=Railway+Image+2';

    console.log('Downloading images...');
    await downloadImage(imageUrl1, image1Path);
    await downloadImage(imageUrl2, image2Path);
    console.log('Images downloaded.');

    const closedFaults = await prisma.fault.findMany({
        where: { status: 'closed' },
        include: { images: true }
    });

    console.log(`Found ${closedFaults.length} closed faults.`);

    for (const fault of closedFaults) {
        if (fault.images.length === 0) {
            console.log(`Adding images to fault ${fault.id}...`);
            await prisma.faultImage.createMany({
                data: [
                    { faultId: fault.id, url: `/uploads/${image1Name}` },
                    { faultId: fault.id, url: `/uploads/${image2Name}` }
                ]
            });
        } else {
            console.log(`Fault ${fault.id} already has images.`);
        }
    }

    console.log('Seeding complete.');
}

seedImages()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
