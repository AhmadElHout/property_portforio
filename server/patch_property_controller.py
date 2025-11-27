import re

# Read the file
with open('c:/Users/Ahmad/Desktop/Uplyft/property_portforio/server/src/controllers/propertyController.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Change 1: Update getProperties to fetch image IDs and use thumbnail_id
old_pattern1 = r"const \[images\] = await pool\.execute<RowDataPacket\[\]>\('SELECT file_path FROM property_images WHERE property_id = \? ORDER BY sort_order LIMIT 5', \[p\.id\]\);\s+return \{ \.\.\.p, images: images\.map\(i => i\.file_path\), thumbnail: images\[0\]\?\.file_path \};"

new_code1 = """const [images] = await pool.execute<RowDataPacket[]>('SELECT id, file_path FROM property_images WHERE property_id = ? ORDER BY sort_order LIMIT 5', [p.id]);

            // Use thumbnail_id if set, otherwise use first image
            let thumbnail = null;
            if (p.thumbnail_id) {
                const thumbnailImage = (images as any[]).find(img => img.id === p.thumbnail_id);
                thumbnail = thumbnailImage?.file_path || (images as any[])[0]?.file_path;
            } else {
                thumbnail = (images as any[])[0]?.file_path;
            }

            return { ...p, images: images.map((i: any) => ({ id: i.id, path: i.file_path })), thumbnail };"""

content = re.sub(old_pattern1, new_code1, content)

# Change 2: Add setThumbnail function at the end
# Find the end of the last export function
last_export_end = content.rfind("};")

# Add new function before final closing
new_function = """

export const setThumbnail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { imageId } = req.body;

    try {
        // Verify the image belongs to this property
        const [images] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM property_images WHERE id = ? AND property_id = ?',
            [imageId, id]
        );

        if ((images as any[]).length === 0) {
            return res.status(400).json({ message: 'Image does not belong to this property' });
        }

        // Update thumbnail_id
        await pool.execute(
            'UPDATE properties SET thumbnail_id = ? WHERE id = ?',
            [imageId, id]
        );

        res.json({ message: 'Thumbnail updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
"""

content = content + new_function

# Write back
with open('c:/Users/Ahmad/Desktop/Uplyft/property_portforio/server/src/controllers/propertyController.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated propertyController.ts successfully")
