import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';
import path from 'path';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testUpload() {
    try {
        const filePath = path.join(__dirname, 'uploads', 'railway1.jpg');
        console.log('Uploading:', filePath);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'fault-tracker-test'
        });

        console.log('Upload Success:', result);
    } catch (error) {
        console.error('Upload Failed:', error);
    }
}

testUpload();
