import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const [users] = await pool.execute('SELECT id, name, email, role, active, created_at FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    try {
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Get a connection to use escape()
        const connection = await pool.getConnection();
        try {
            // Manually escape values to ensure correct SQL generation and bypass prepared statement issues with ENUMs
            const sql = `INSERT INTO users (name, email, password_hash, role) VALUES (${connection.escape(name)}, ${connection.escape(email)}, ${connection.escape(passwordHash)}, ${connection.escape(role)})`;

            await connection.query(sql);
            connection.release();
            res.status(201).json({ message: 'User created successfully' });
        } catch (err) {
            connection.release();
            throw err;
        }
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { active } = req.body;
    try {
        await pool.execute('UPDATE users SET active = ? WHERE id = ?', [active, id]);
        res.json({ message: 'User status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    try {
        const connection = await pool.getConnection();
        try {
            const sql = `UPDATE users SET name = ${connection.escape(name)}, email = ${connection.escape(email)}, role = ${connection.escape(role)} WHERE id = ${connection.escape(id)}`;
            await connection.query(sql);
            connection.release();
            res.json({ message: 'User updated successfully' });
        } catch (err) {
            connection.release();
            throw err;
        }
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
