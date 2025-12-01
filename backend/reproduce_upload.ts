import fs from 'fs';
import path from 'path';

// Polyfill for Node environments older than 18 if needed, but assuming 18+
// If fetch/FormData is not available, this will fail, but we'll try.

async function run() {
    const faultId = 39; // Use the ID found previously
    const url = `http://127.0.0.1:3000/api/faults/${faultId}`;
    const filePath = path.join(__dirname, 'uploads', 'railway1.jpg');

    if (!fs.existsSync(filePath)) {
        console.error('Test image not found at', filePath);
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    // Manually construct multipart body because Node's native FormData is tricky with fs streams in some versions
    // and we want to be sure about what we are sending.

    let body = '';

    // Add text fields
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="status"\r\n\r\n`;
    body += `closed\r\n`;

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="solution"\r\n\r\n`;
    body += `Test Solution via Script\r\n`;

    // Add file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="images"; filename="test_image.jpg"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;

    const bodyHead = Buffer.from(body, 'utf-8');
    const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

    const finalBody = Buffer.concat([bodyHead, fileBuffer, bodyTail]);

    console.log('Sending PUT request to', url);

    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': finalBody.length.toString()
            },
            body: finalBody as any // Cast to any to satisfy TS if needed
        });

        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
