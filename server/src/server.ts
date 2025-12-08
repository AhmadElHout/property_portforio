import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import express from 'express'; // Server entry point
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import clientRoutes from './routes/clientRoutes';
import requestRoutes from './routes/requestRoutes';
import ownerRoutes from "./routes/ownerRoutes";
import superAdminRoutes from './routes/superAdminRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

import { getPlatformDb } from './config/multiDb';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic route
app.get('/', (req, res) => {
    res.send('Property Portforio API is running');
});

// Initialize Platform DB
getPlatformDb().catch(err => console.error('Failed to initialize Platform DB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/requests', requestRoutes);
app.use("/api/owner", ownerRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/analytics', analyticsRoutes);


// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
