import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPlatformDb, getAgencyDb } from '../config/multiDb';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = user;

        try {
            if (user.role === 'super_admin') {
                req.isSuperAdmin = true;
                req.agencyId = null;
                req.db = await getPlatformDb();
            } else {
                // For standard agents/owners, connect to their agency DB
                // Default to agency ID 1 if not present (for backward compatibility)
                const agencyId = user.agency_id || 1;
                req.agencyId = agencyId;
                req.db = await getAgencyDb(agencyId);
            }
            next();
        } catch (dbError) {
            console.error('Database connection failed in auth middleware:', dbError);
            res.status(500).json({ message: 'Database connection error' });
        }
    });
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super Admin access required' });
    }
    next();
};
