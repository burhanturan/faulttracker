import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

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

// Get Faults (with filters)
app.get('/api/faults', async (req, res) => {
    const { chiefdomId, reportedById } = req.query;
    const where: any = {};

    if (chiefdomId) where.chiefdomId = parseInt(chiefdomId as string);
    if (reportedById) where.reportedById = parseInt(reportedById as string);

    try {
        const faults = await prisma.fault.findMany({
            where,
            include: {
                chiefdom: true,
                reportedBy: true,
                assignedTo: true,
                images: true // Include images
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(faults);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faults' });
    }
});

// Create Fault
app.post('/api/faults', async (req, res) => {
    const { title, description, reportedById, chiefdomId, status, faultDate, faultTime, reporterName, lineInfo, closureFaultInfo, solution, workingPersonnel, tcddPersonnel } = req.body;
    try {
        const fault = await prisma.fault.create({
            data: {
                title,
                description,
                reportedById,
                chiefdomId,
                status: status || 'open',
                // Optional closure fields
                faultDate,
                faultTime,
                reporterName,
                lineInfo,
                closureFaultInfo,
                solution,
                workingPersonnel,
                tcddPersonnel
            },
        });
        res.json(fault);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create fault' });
    }
});

// Update Fault (Close/Assign) - Supports Image Upload
app.put('/api/faults/:id', upload.any(), async (req, res) => {
    const { id } = req.params;
    console.log(`PUT /api/faults/${id} called`);
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const { status, assignedToId, faultDate, faultTime, reporterName, lineInfo, closureFaultInfo, solution, workingPersonnel, tcddPersonnel } = req.body;

    try {
        // Compress Images
        if (req.files && Array.isArray(req.files)) {
            await Promise.all(req.files.map(async (file) => {
                const filePath = file.path;
                const tempPath = filePath + '.tmp';

                await sharp(filePath)
                    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }) // Max 1024x1024
                    .jpeg({ quality: 80 }) // Compress to 80% quality
                    .toFile(tempPath);

                fs.unlinkSync(filePath); // Delete original
                fs.renameSync(tempPath, filePath); // Rename compressed to original
            }));
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (assignedToId) updateData.assignedToId = assignedToId;

        // Closure fields
        if (faultDate) updateData.faultDate = faultDate;
        if (faultTime) updateData.faultTime = faultTime;
        if (reporterName) updateData.reporterName = reporterName;
        if (lineInfo) updateData.lineInfo = lineInfo;
        if (closureFaultInfo) updateData.closureFaultInfo = closureFaultInfo;
        if (solution) updateData.solution = solution;
        if (workingPersonnel) updateData.workingPersonnel = workingPersonnel;
        if (tcddPersonnel) updateData.tcddPersonnel = tcddPersonnel;

        const fault = await prisma.fault.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Handle Image Records
        if (req.files && Array.isArray(req.files)) {
            const imagePromises = (req.files as Express.Multer.File[]).map(file => {
                return prisma.faultImage.create({
                    data: {
                        url: `/uploads/${file.filename}`,
                        faultId: fault.id
                    }
                });
            });
            await Promise.all(imagePromises);
        }

        res.json(fault);
    } catch (error) {
        console.error('Update Error:', error);
        res.status(400).json({ error: 'Failed to update fault' });
    }
});

// Close Fault (Specific route if needed, but PUT /api/faults/:id handles it)
// Keeping this for backward compatibility if used, but updating logic to match
app.put('/api/faults/:id/close', async (req, res) => {
    const { id } = req.params;
    const {
        faultDate, faultTime, reporterName, lineInfo, closureFaultInfo, solution, workingPersonnel, tcddPersonnel
    } = req.body;

    try {
        const fault = await prisma.fault.update({
            where: { id: parseInt(id) },
            data: {
                status: 'closed',
                faultDate,
                faultTime,
                reporterName,
                lineInfo,
                closureFaultInfo,
                solution,
                workingPersonnel,
                tcddPersonnel
            },
        });
        res.json(fault);
    } catch (error) {
        res.status(400).json({ error: 'Failed to close fault' });
    }
});

// --- Chiefdom Routes ---

// Get All Chiefdoms
app.get('/api/chiefdoms', async (req, res) => {
    try {
        const chiefdoms = await prisma.chiefdom.findMany({
            include: {
                users: true // Include workers
            }
        });
        res.json(chiefdoms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chiefdoms' });
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

// Update Chiefdom
app.put('/api/chiefdoms/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const chiefdom = await prisma.chiefdom.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(chiefdom);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update chiefdom' });
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
        res.status(400).json({ error: 'Failed to delete chiefdom' });
    }
});

// --- User Routes ---

// Get Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { chiefdom: true }
        });
        const safeUsers = users.map(user => {
            const { password, ...rest } = user;
            return rest;
        });
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

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
                chiefdomId: chiefdomId ? parseInt(chiefdomId) : null,
                email,
                phone
            },
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user' });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, fullName, role, chiefdomId, email, phone } = req.body;
    try {
        const updateData: any = { username, fullName, role, email, phone };
        if (password) updateData.password = password;
        if (chiefdomId) updateData.chiefdomId = parseInt(chiefdomId);
        else if (chiefdomId === '') updateData.chiefdomId = null;

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update user' });
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

// Update Chiefdom
app.put('/api/chiefdoms/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const chiefdom = await prisma.chiefdom.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(chiefdom);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update chiefdom' });
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
// Start Server
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};

startServer();
