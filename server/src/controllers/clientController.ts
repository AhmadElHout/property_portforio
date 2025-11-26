import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getClients = async (req: Request, res: Response) => {
    const user = req.user!;
    try {
        const [clients] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM clients WHERE agent_id = ? ORDER BY created_at DESC',
            [user.id]
        );
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    const user = req.user!;
    const { name, type, phone, email, whatsapp, notes } = req.body;

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO clients (agent_id, name, type, phone, email, whatsapp, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, name, type, phone, email, whatsapp, notes, type === 'owner' ? 'in_progress' : 'request_contact_info']
        );
        res.status(201).json({ id: result.insertId, message: 'Client created' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const { name, type, phone, email, whatsapp, status, notes } = req.body;

    try {
        // Verify ownership
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT id FROM clients WHERE id = ? AND agent_id = ?', [id, user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Client not found' });

        await pool.execute(
            'UPDATE clients SET name=?, type=?, phone=?, email=?, whatsapp=?, status=?, notes=? WHERE id=?',
            [name, type, phone, email, whatsapp, status, notes, id]
        );
        res.json({ message: 'Client updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    try {
        // Verify ownership
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT id FROM clients WHERE id = ? AND agent_id = ?', [id, user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Client not found' });

        await pool.execute('DELETE FROM clients WHERE id = ?', [id]);
        res.json({ message: 'Client deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get clients with property relationship counts
export const getClientsWithProperties = async (req: Request, res: Response) => {
    const user = req.user!;
    try {
        // Fetch clients for the agent
        const [clients] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM clients WHERE agent_id = ? ORDER BY created_at DESC',
            [user.id]
        );
        // Gather client IDs
        const clientIds = (clients as any[]).map(c => c.id);
        let counts: any = {};
        if (clientIds.length > 0) {
            const placeholders = clientIds.map(() => '?').join(',');
            const [rows] = await pool.execute<RowDataPacket[]>(
                `SELECT client_id, relationship, COUNT(*) as cnt FROM client_properties WHERE client_id IN (${placeholders}) GROUP BY client_id, relationship`,
                clientIds
            );
            counts = (rows as any[]).reduce((acc, row) => {
                const cid = row.client_id;
                if (!acc[cid]) acc[cid] = { viewed: 0, interested: 0, will_view: 0 };
                acc[cid][row.relationship] = row.cnt;
                return acc;
            }, {});
        }
        const result = (clients as any[]).map(c => ({
            ...c,
            properties: counts[c.id] || { viewed: 0, interested: 0, will_view: 0 }
        }));
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
