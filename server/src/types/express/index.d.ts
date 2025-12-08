import { Pool } from 'mysql2/promise';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number | string;
                role: string;
                agency_id?: number; // For multi-tenant support
                [key: string]: any;
            };
            db?: Pool; // The database connection for the current context
            isSuperAdmin?: boolean;
            agencyId?: number | null;
        }
    }
}
