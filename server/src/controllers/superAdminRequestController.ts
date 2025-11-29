import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';

// Create Super Admin handling request
export const createSuperAdminRequest = async (req: Request, res: Response) => {
    const { property_ids } = req.body;
    const user = req.user!;

    try {
        // Validate that user is an owner
        if (user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owners can create Super Admin requests' });
        }

        // Validate property_ids
        if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
            return res.status(400).json({ message: 'At least one property ID is required' });
        }

        // Create super admin request
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO super_admin_requests (owner_id, status) VALUES (?, ?)',
            [user.id, 'pending']
        );

        const requestId = result.insertId;

        // Add all property IDs to request items
        const values = property_ids.map(propertyId => [requestId, propertyId]);
        await pool.query(
            'INSERT INTO super_admin_request_items (request_id, property_id) VALUES ?',
            [values]
        );

        res.status(201).json({
            message: 'Super Admin handling request created successfully',
            request_id: requestId,
            property_count: property_ids.length
        });
    } catch (error: any) {
        console.error('Error creating Super Admin request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Super Admin requests for current owner
export const getOwnerRequests = async (req: Request, res: Response) => {
    const user = req.user!;

    try {
        // Validate that user is an owner
        if (user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owners can view their requests' });
        }

        // Get all requests for this owner
        const [requests] = await pool.execute(
            `SELECT sar.*, 
                    (SELECT COUNT(*) FROM super_admin_request_items WHERE request_id = sar.id) as property_count
             FROM super_admin_requests sar
             WHERE owner_id = ?
             ORDER BY created_at DESC`,
            [user.id]
        );

        res.json(requests);
    } catch (error: any) {
        console.error('Error fetching owner requests:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
