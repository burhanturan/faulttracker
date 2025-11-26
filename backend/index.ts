import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Auth Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // In a real app, generate a JWT here
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register (for seeding/testing)
app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullName, role } = req.body;
    try {
        const user = await prisma.user.create({
            data: { username, password, fullName, role },
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'User already exists or invalid data' });
    }
});

// --- Fault Routes ---

// Get all faults (can filter by role later)
// Get all faults (can filter by role or reporter)
app.get('/api/faults', async (req, res) => {
    const { reportedById } = req.query;
    try {
        const whereClause = reportedById ? { reportedById: parseInt(reportedById as string) } : {};
        const faults = await prisma.fault.findMany({
            where: whereClause,
            include: {
                reportedBy: { select: { fullName: true } },
                assignedTo: { select: { fullName: true } },
                chiefdom: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(faults);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faults' });
    }
});

// Create a fault
// Get all chiefdoms
app.get('/api/chiefdoms', async (req, res) => {
    try {
        const chiefdoms = await prisma.chiefdom.findMany();
        res.json(chiefdoms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chiefdoms' });
    }
});

// Get all users (for assignment - optional now)
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, fullName: true, role: true, chiefdom: true, email: true, phone: true },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create a fault
app.post('/api/faults', async (req, res) => {
    const { title, description, reportedById, chiefdomId } = req.body;
    try {
        const fault = await prisma.fault.create({
            data: {
                title,
                description,
                reportedById,
                chiefdomId: chiefdomId ? parseInt(chiefdomId) : undefined,
                status: 'open',
            },
        });
        res.json(fault);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create fault' });
    }
});

// --- Admin Routes ---

// Create User
app.post('/api/users', async (req, res) => {
    const { username, password, fullName, role, chiefdomId, email, phone } = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                username,
                password,
                fullName,
                role,
                email,
                phone,
                chiefdomId: chiefdomId ? parseInt(chiefdomId) : undefined,
            },
        });

        // Mock Email Sending removed as per requirement
        // console.log('--- MOCK EMAIL SENT ---');
        // console.log(`To: ${email}`);
        // console.log(`Subject: Welcome to FaultTracker`);
        // console.log(`Body: Hello ${fullName}, your account has been created. Username: ${username}, Password: ${password}`);
        // console.log('-----------------------');

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user. Username or Email might be taken.' });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, fullName, role, chiefdomId, email, phone } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                username,
                password,
                fullName,
                role,
                email,
                phone,
                chiefdomId: chiefdomId ? parseInt(chiefdomId) : null,
            },
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update user.' });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete user. They might have reported faults.' });
    }
});

// Create Chiefdom
app.post('/api/chiefdoms', async (req, res) => {
    const { name } = req.body;
    try {
        const chiefdom = await prisma.chiefdom.create({
            data: { name },
        });
        res.json(chiefdom);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create chiefdom' });
    }
});

// Delete Chiefdom
app.delete('/api/chiefdoms/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.chiefdom.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Chiefdom deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete chiefdom. It might have associated users or faults.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
