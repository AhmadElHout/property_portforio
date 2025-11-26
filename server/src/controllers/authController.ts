import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Hardcoded owner for development/fallback
        if (email === 'owner@example.com' && password === 'owner123') {
            const token = jwt.sign(
                { id: 1, role: 'owner' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1d' }
            );
            return res.json({
                token,
                user: { id: 1, name: 'Owner', email: 'owner@example.com', role: 'owner' }
            });
        }

        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In a real app, use bcrypt.compare. For initial setup/testing with plain text or manually hashed passwords, be careful.
        // Assuming we will seed with hashed passwords or implement registration.
        // For now, let's assume the password in DB is hashed.
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Debug endpoint to check current user
export const getCurrentUser = async (req: Request, res: Response) => {
    const user = req.user!;
    res.json({
        id: user.id,
        role: user.role,
        token_info: user
    });
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['agent', 'curator'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Allowed roles: agent, curator' });
    }

    try {
        // Check if user exists
        const [existingUsers] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const [result] = await pool.execute<any>(
            'INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
            [name, email, passwordHash, role, true]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
