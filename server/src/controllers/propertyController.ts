import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Helper to process image
const processImage = async (filePath: string) => {
    const processedPath = filePath + '_processed.jpg';
    // In a real app, we would overlay a logo here.
    // For now, just resize and convert to jpeg.
    await sharp(filePath)
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(processedPath);

    // Remove original
    fs.unlinkSync(filePath);
    return processedPath;
};

export const getProperties = async (req: Request, res: Response) => {
    const user = req.user!;
    const { agent_id, property_type, status, content_status, city, keyword } = req.query;

    try {
        let query = `
            SELECT p.*, u.name as agent_name, 
                   c.name as owner_name, c.phone as owner_phone
            FROM properties p 
            JOIN users u ON p.agent_id = u.id 
            LEFT JOIN clients c ON p.owner_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        // Role-based base filtering
        if (user.role === 'agent') {
            query += ' AND p.agent_id = ?';
            params.push(user.id);
        }
        // Admin and Curator see all by default

        // Dynamic filters
        if (agent_id) {
            query += ' AND p.agent_id = ?';
            params.push(agent_id);
        }
        if (property_type) {
            query += ' AND p.property_type = ?';
            params.push(property_type);
        }
        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }
        if (content_status) {
            query += ' AND p.content_status = ?';
            params.push(content_status);
        }
        if (city) {
            query += ' AND p.city LIKE ?';
            params.push(`%${city}%`);
        }

        // Keyword search
        if (keyword) {
            query += ` AND (
                p.reference_number LIKE ? OR
                CAST(p.price_usd AS CHAR) LIKE ? OR
                c.name LIKE ? OR
                RIGHT(c.phone, 4) = ?
            )`;
            const keywordParam = `%${keyword}%`;
            params.push(keywordParam, keywordParam, keywordParam, keyword);
        }

        query += ' ORDER BY p.created_at DESC';

        const [properties] = await pool.execute<RowDataPacket[]>(query, params);

        // Fetch one image for each property (inefficient but simple for now)
        // Better approach: Join with property_images or use a subquery
        const propertiesWithImages = await Promise.all(properties.map(async (p) => {
            const [images] = await pool.execute<RowDataPacket[]>('SELECT file_path FROM property_images WHERE property_id = ? ORDER BY sort_order LIMIT 5', [p.id]);
            return { ...p, images: images.map(i => i.file_path), thumbnail: images[0]?.file_path };
        }));

        res.json(propertiesWithImages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProperty = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM properties WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Property not found' });

        const [images] = await pool.execute<RowDataPacket[]>('SELECT id, file_path, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order', [id]);
        const [feedback] = await pool.execute<RowDataPacket[]>(
            `SELECT cf.*, u.name as curator_name 
             FROM curator_feedback cf 
             JOIN users u ON cf.curator_id = u.id 
             WHERE cf.property_id = ? 
             ORDER BY cf.created_at DESC`,
            [id]
        );
        const [internalNotes] = await pool.execute<RowDataPacket[]>(
            `SELECT pin.*, u.name as author_name 
             FROM property_internal_notes pin 
             JOIN users u ON pin.agent_id = u.id 
             WHERE pin.property_id = ? 
             ORDER BY pin.created_at DESC`,
            [id]
        );



        // Fetch Owner
        let owner = null;
        if (rows[0].owner_id) {
            const [ownerRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM clients WHERE id = ?', [rows[0].owner_id]);
            owner = ownerRows[0] || null;
        }

        // Fetch Leads
        const [leads] = await pool.execute<RowDataPacket[]>(
            'SELECT c.* FROM clients c JOIN property_leads pl ON c.id = pl.client_id WHERE pl.property_id = ?',
            [id]
        );

        res.json({ ...rows[0], images, feedback, internalNotes, owner, leads });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createProperty = async (req: Request, res: Response) => {
    const user = req.user!;
    const data = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO properties (
        agent_id, property_type, purpose, furnished, city, area, ownership_type, 
        ownership_notes, built_up_area, land_area, bedrooms, bathrooms, floor_level,
        has_24_7_electricity, has_generator, has_elevator, has_parking, price_usd, notes,
        maid_room, balcony, terrace, heating_system, ac_system, water_tank,
        concierge, security, gym, pool, zoning, occupancy_status, payment_method, commission,
        owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.id, data.property_type, data.purpose, data.furnished, data.city, data.area, data.ownership_type,
                data.ownership_notes,
                data.built_up_area === '' ? null : data.built_up_area,
                data.land_area === '' ? null : data.land_area,
                data.bedrooms === '' ? null : data.bedrooms,
                data.bathrooms === '' ? null : data.bathrooms,
                data.floor_level === '' ? null : data.floor_level,
                data.has_24_7_electricity, data.has_generator, data.has_elevator, data.has_parking, data.price_usd, data.notes,
                data.maid_room || false, data.balcony || false, data.terrace || false, data.heating_system || null, data.ac_system || null, data.water_tank || false,
                data.concierge || false, data.security || false, data.gym || false, data.pool || false, data.zoning || null, data.occupancy_status || null, data.payment_method || null, data.commission || null,
                data.owner_id || null
            ]
        );

        const propertyId = result.insertId;

        // Insert Leads
        if (data.lead_ids && Array.isArray(data.lead_ids) && data.lead_ids.length > 0) {
            const leadValues = data.lead_ids.map((leadId: number) => [propertyId, leadId]);
            await connection.query(
                'INSERT INTO property_leads (property_id, client_id) VALUES ?',
                [leadValues]
            );
        }

        await connection.commit();
        res.status(201).json({ id: propertyId, message: 'Property created' });
    } catch (error: any) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
};

export const updateProperty = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check ownership
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT agent_id FROM properties WHERE id = ?', [id]);
        if (rows.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Property not found' });
        }

        if (user.role !== 'owner' && rows[0].agent_id !== user.id) {
            connection.release();
            return res.status(403).json({ message: 'Forbidden' });
        }

        await connection.execute(
            `UPDATE properties SET 
            property_type=?, purpose=?, furnished=?, city=?, area=?, ownership_type=?, 
            ownership_notes=?, built_up_area=?, land_area=?, bedrooms=?, bathrooms=?, floor_level=?,
            has_24_7_electricity=?, has_generator=?, has_elevator=?, has_parking=?, price_usd=?, notes=?,
            maid_room=?, balcony=?, terrace=?, heating_system=?, ac_system=?, water_tank=?,
            concierge=?, security=?, gym=?, pool=?, zoning=?, occupancy_status=?, payment_method=?, commission=?,
            owner_id=?
            WHERE id = ?`,
            [
                data.property_type, data.purpose, data.furnished, data.city, data.area, data.ownership_type,
                data.ownership_notes,
                data.built_up_area === '' ? null : data.built_up_area,
                data.land_area === '' ? null : data.land_area,
                data.bedrooms === '' ? null : data.bedrooms,
                data.bathrooms === '' ? null : data.bathrooms,
                data.floor_level === '' ? null : data.floor_level,
                data.has_24_7_electricity, data.has_generator, data.has_elevator, data.has_parking, data.price_usd, data.notes,
                data.maid_room || false, data.balcony || false, data.terrace || false, data.heating_system || null, data.ac_system || null, data.water_tank || false,
                data.concierge || false, data.security || false, data.gym || false, data.pool || false, data.zoning || null, data.occupancy_status || null, data.payment_method || null, data.commission || null,
                data.owner_id || null,
                id
            ]
        );

        // Update Leads (Delete all and re-insert)
        await connection.execute('DELETE FROM property_leads WHERE property_id = ?', [id]);

        if (data.lead_ids && Array.isArray(data.lead_ids) && data.lead_ids.length > 0) {
            const leadValues = data.lead_ids.map((leadId: number) => [id, leadId]);
            await connection.query(
                'INSERT INTO property_leads (property_id, client_id) VALUES ?',
                [leadValues]
            );
        }

        await connection.commit();
        res.json({ message: 'Property updated' });
    } catch (error: any) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
};

export const uploadImages = async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    try {
        const imagePromises = files.map(async (file, index) => {
            const processedPath = await processImage(file.path);
            // Store relative path
            const relativePath = path.relative(path.join(__dirname, '../../'), processedPath).replace(/\\/g, '/');

            await pool.execute(
                'INSERT INTO property_images (property_id, file_path, sort_order) VALUES (?, ?, ?)',
                [id, relativePath, index]
            );
            return { id: 0, file_path: relativePath }; // Return simplified object
        });

        await Promise.all(imagePromises);
        res.json({ message: 'Images uploaded' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteImage = async (req: Request, res: Response) => {
    const { id, imageId } = req.params;
    const user = req.user!;

    try {
        // Check ownership
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (user.role !== 'owner' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Get image path
        const [images] = await pool.execute<RowDataPacket[]>('SELECT file_path FROM property_images WHERE id = ? AND property_id = ?', [imageId, id]);
        if (images.length === 0) return res.status(404).json({ message: 'Image not found' });

        const filePath = path.join(__dirname, '../../uploads', images[0].file_path);

        // Delete from DB
        await pool.execute('DELETE FROM property_images WHERE id = ?', [imageId]);

        // Delete from disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Image deleted' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update property operational status
export const updatePropertyStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    try {
        // Check ownership
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id, status FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (user.role !== 'owner' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const oldStatus = props[0].status;

        // Update status
        await pool.execute('UPDATE properties SET status = ? WHERE id = ?', [status, id]);

        // Record history
        await pool.execute(
            'INSERT INTO property_status_history (property_id, user_id, old_status, new_status, status_type) VALUES (?, ?, ?, ?, ?)',
            [id, user.id, oldStatus, status, 'operational']
        );

        res.json({ message: 'Status updated', status });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update property content workflow status
export const updateContentStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content_status } = req.body;
    const user = req.user!;

    try {
        // Check ownership or curator role
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id, content_status FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        // Agents can update their own properties, curators can update any
        if (user.role === 'agent' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const oldStatus = props[0].content_status;

        // Update content status
        await pool.execute('UPDATE properties SET content_status = ? WHERE id = ?', [content_status, id]);

        // Record history
        await pool.execute(
            'INSERT INTO property_status_history (property_id, user_id, old_status, new_status, status_type) VALUES (?, ?, ?, ?, ?)',
            [id, user.id, oldStatus, content_status, 'content']
        );

        res.json({ message: 'Content status updated', content_status });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get curator feedback for a property
export const getCuratorFeedback = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const [feedback] = await pool.execute<RowDataPacket[]>(
            `SELECT cf.*, u.name as curator_name 
             FROM curator_feedback cf 
             JOIN users u ON cf.curator_id = u.id 
             WHERE cf.property_id = ? 
             ORDER BY cf.created_at DESC`,
            [id]
        );

        res.json(feedback);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add curator feedback (curator only)
export const addCuratorFeedback = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { comments, requested_changes } = req.body;
    const user = req.user!;

    if (user.role !== 'curator' && user.role !== 'owner') {
        return res.status(403).json({ message: 'Only curators can add feedback' });
    }

    try {
        await pool.execute(
            'INSERT INTO curator_feedback (property_id, curator_id, comments, requested_changes) VALUES (?, ?, ?, ?)',
            [id, user.id, comments, requested_changes]
        );

        res.json({ message: 'Feedback added successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete/clear curator feedback (agent/owner only)
export const deleteFeedback = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    try {
        // Check ownership
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (user.role !== 'owner' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Delete all feedback for this property
        await pool.execute('DELETE FROM curator_feedback WHERE property_id = ?', [id]);

        res.json({ message: 'Feedback cleared' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get internal notes for a property (agent/owner only)
export const getInternalNotes = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    try {
        // Check ownership
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (user.role !== 'owner' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const [notes] = await pool.execute<RowDataPacket[]>(
            `SELECT pin.*, u.name as author_name 
             FROM property_internal_notes pin 
             JOIN users u ON pin.agent_id = u.id 
             WHERE pin.property_id = ? 
             ORDER BY pin.created_at DESC`,
            [id]
        );

        res.json(notes);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add internal note (agent/owner only)
export const addInternalNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body;
    const user = req.user!;

    if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Note content is required' });
    }

    try {
        // Check ownership
        const [props] = await pool.execute<RowDataPacket[]>('SELECT agent_id FROM properties WHERE id = ?', [id]);
        if (props.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (user.role !== 'owner' && props[0].agent_id !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await pool.execute(
            'INSERT INTO property_internal_notes (property_id, agent_id, note) VALUES (?, ?, ?)',
            [id, user.id, note.trim()]
        );

        res.json({ message: 'Note added successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
