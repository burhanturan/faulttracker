
const fetch = require('node-fetch'); // Assuming node-fetch is available or using global fetch in Node 18+

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate random date within last N days
const getRandomDate = (daysBack) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date;
};

const API_URL = 'http://localhost:3000/api';

async function seedFaults() {
    try {
        console.log('Fetching Chiefdoms and Users...');
        const [chiefdomsRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/chiefdoms`),
            fetch(`${API_URL}/users`)
        ]);

        const chiefdoms = await chiefdomsRes.json();
        const users = await usersRes.json();

        if (chiefdoms.length === 0) {
            console.log('No chiefdoms found. Cannot seed faults.');
            return;
        }

        // Find a valid reporter (e.g., an admin or engineer, or just the first user)
        const reporter = users.find(u => u.role === 'admin' || u.role === 'engineer') || users[0];
        if (!reporter) {
            console.log('No users found. Cannot seed faults.');
            return;
        }

        console.log(`Found ${chiefdoms.length} chiefdoms. Starting seed...`);

        for (const chiefdom of chiefdoms) {
            console.log(`Seeding faults for Chiefdom: ${chiefdom.name} (ID: ${chiefdom.id})...`);

            // 1. Create 2 Open Faults
            for (let i = 0; i < 2; i++) {
                const date = getRandomDate(5); // Recent (last 5 days)
                const fault = {
                    title: `Açık Arıza ${i + 1} - ${chiefdom.name}`,
                    description: `Bu, ${chiefdom.name} için oluşturulmuş rastgele bir açık arıza kaydıdır. Detaylar incelenmelidir.`,
                    reportedById: reporter.id,
                    chiefdomId: chiefdom.id,
                    status: 'open',
                    // Optional: Add created date logic if API supports overriding createdAt, 
                    // but usually createdAt is auto-set. We can put it in description or title if needed.
                };

                await fetch(`${API_URL}/faults`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fault)
                });
            }

            // 2. Create 5 Closed Faults
            for (let i = 0; i < 5; i++) {
                const date = getRandomDate(30); // Older (last 30 days)
                const faultDateStr = date.toLocaleDateString('tr-TR');
                const faultTimeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                const fault = {
                    title: `Kapanmış Arıza ${i + 1} - ${chiefdom.name}`,
                    description: `Bu, ${chiefdom.name} bölgesindeki eski bir arızadır.`,
                    reportedById: reporter.id,
                    chiefdomId: chiefdom.id,
                    status: 'closed',
                    
                    // Closure Fields
                    faultDate: faultDateStr,
                    faultTime: faultTimeStr,
                    reporterName: reporter.fullName,
                    lineInfo: `Hat ${Math.floor(Math.random() * 10) + 1}`,
                    closureFaultInfo: `Arıza tespit edildi ve giderildi.`,
                    solution: `Parça değişimi yapıldı ve sistem test edildi. Her şey normal.`,
                    workingPersonnel: `Ekip A`,
                    tcddPersonnel: `Denetçi B`
                };

                await fetch(`${API_URL}/faults`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fault)
                });
            }
        }

        console.log('Seeding complete!');

    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seedFaults();
