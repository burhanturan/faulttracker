import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'fault-tracker',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    } as any
});

const upload = multer({ storage: storage });

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

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, fullName, role },
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
// Create Fault
app.post('/api/faults', upload.any(), async (req, res) => {
    const { title, description, reportedById, chiefdomId, status, faultDate, faultTime, reporterName, lineInfo, closureFaultInfo, solution, workingPersonnel, tcddPersonnel } = req.body;
    if (!reportedById) {
        return res.status(400).json({ error: 'Reported By ID is required' });
    }

    try {
        const fault = await prisma.fault.create({
            data: {
                title,
                description,
                reportedById: parseInt(reportedById),
                chiefdomId: chiefdomId ? parseInt(chiefdomId) : undefined,
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

        // Handle Image Records
        if (req.files && Array.isArray(req.files)) {
            const imagePromises = (req.files as Express.Multer.File[]).map(file => {
                return prisma.faultImage.create({
                    data: {
                        url: file.path, // Cloudinary URL
                        faultId: fault.id
                    }
                });
            });
            await Promise.all(imagePromises);
        }

        res.json(fault);
    } catch (error) {
        console.error('Create Fault Error:', error);
        res.status(400).json({ error: 'Failed to create fault' });
    }
});

// Update Fault (Close/Assign) - Supports Image Upload
app.put('/api/faults/:id', (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    const { id } = req.params;
    console.log(`PUT /api/faults/${id} called`);
    // console.log('Content-Type:', req.headers['content-type']);
    // console.log('Files:', req.files);
    // console.log('Body:', req.body);

    const { status, assignedToId, faultDate, faultTime, reporterName, lineInfo, closureFaultInfo, solution, workingPersonnel, tcddPersonnel } = req.body;

    try {
        // Images are already uploaded to Cloudinary by multer-storage-cloudinary
        // No need for manual compression with sharp

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
                        url: file.path, // Cloudinary URL
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

// Delete Fault
app.delete('/api/faults/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // First delete associated images
        await prisma.faultImage.deleteMany({
            where: { faultId: parseInt(id) }
        });

        await prisma.fault.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Fault deleted' });
    } catch (error) {
        console.error('Delete Fault Error:', error);
        res.status(400).json({ error: 'Failed to delete fault' });
    }
});

// Delete Fault Image
app.delete('/api/faults/images/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.faultImage.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Image deleted' });
    } catch (error) {
        console.error('Delete Image Error:', error);
        res.status(400).json({ error: 'Failed to delete image' });
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

// --- Region Routes ---

app.get('/api/regions', async (req, res) => {
    try {
        const regions = await prisma.region.findMany({ include: { projects: true } });
        res.json(regions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
});

app.post('/api/regions', async (req, res) => {
    const { name, description } = req.body;
    try {
        const region = await prisma.region.create({ data: { name, description } });
        res.json(region);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create region' });
    }
});

// --- Project Routes ---

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { chiefdoms: true, region: true }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req, res) => {
    const { name, description, regionId } = req.body;
    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                regionId: regionId ? parseInt(regionId) : undefined
            },
        });
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create project' });
    }
});

// --- Chiefdom Routes ---

app.get('/api/chiefdoms', async (req, res) => {
    try {
        const chiefdoms = await prisma.chiefdom.findMany({
            include: {
                users: true,
                project: true,
                stations: true,
                levelCrossings: true,
                technicalBuildings: true
            }
        });
        res.json(chiefdoms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chiefdoms' });
    }
});

app.post('/api/chiefdoms', async (req, res) => {
    const { name, projectId, startKm, endKm } = req.body;
    try {
        const chiefdom = await prisma.chiefdom.create({
            data: {
                name,
                startKm,
                endKm,
                projectId: projectId ? parseInt(projectId) : undefined
            },
        });
        res.json(chiefdom);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create chiefdom' });
    }
});

app.put('/api/chiefdoms/:id', async (req, res) => {
    const { id } = req.params;
    const { name, startKm, endKm, projectId } = req.body;
    try {
        const chiefdom = await prisma.chiefdom.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startKm,
                endKm,
                projectId: projectId ? parseInt(projectId) : undefined
            },
        });
        res.json(chiefdom);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update chiefdom' });
    }
});

// --- Infrastructure Routes ---

// Stations
app.post('/api/stations', async (req, res) => {
    const { name, km, chiefdomId } = req.body;
    try {
        const station = await prisma.station.create({
            data: { name, km, chiefdomId: parseInt(chiefdomId) }
        });
        res.json(station);
    } catch { res.status(400).json({ error: 'Failed' }); }
});

app.delete('/api/stations/:id', async (req, res) => {
    try {
        await prisma.station.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch { res.status(400).json({ error: 'Failed' }); }
});

// Level Crossings
app.post('/api/level-crossings', async (req, res) => {
    const { name, km, type, chiefdomId } = req.body;
    try {
        const lc = await prisma.levelCrossing.create({
            data: { name, km, type, chiefdomId: parseInt(chiefdomId) }
        });
        res.json(lc);
    } catch { res.status(400).json({ error: 'Failed' }); }
});

app.delete('/api/level-crossings/:id', async (req, res) => {
    try {
        await prisma.levelCrossing.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch { res.status(400).json({ error: 'Failed' }); }
});

// Technical Buildings
app.post('/api/technical-buildings', async (req, res) => {
    const { name, km, type, chiefdomId } = req.body;
    try {
        const tb = await prisma.technicalBuilding.create({
            data: { name, km, type, chiefdomId: parseInt(chiefdomId) }
        });
        res.json(tb);
    } catch { res.status(400).json({ error: 'Failed' }); }
});

app.delete('/api/technical-buildings/:id', async (req, res) => {
    try {
        await prisma.technicalBuilding.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch { res.status(400).json({ error: 'Failed' }); }
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
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
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

        // Hash password if it's being updated
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

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
// app.put('/api/chiefdoms/:id', async (req, res) => { ... }); // Duplicate removed

// Update Region
app.put('/api/regions/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const region = await prisma.region.update({
            where: { id: parseInt(id) },
            data: { name, description },
        });
        res.json(region);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update region' });
    }
});

// Delete Region
app.delete('/api/regions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.region.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Region deleted successfully' });
    } catch (error) {
        console.error('Error deleting region:', error);
        res.status(400).json({ error: 'Failed to delete region' });
    }
});

// Update Project
app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, regionId } = req.body;
    try {
        const project = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                regionId: regionId ? parseInt(regionId) : undefined
            },
        });
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update project' });
    }
});

// Delete Project
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.project.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(400).json({ error: 'Failed to delete project' });
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

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

startServer();
