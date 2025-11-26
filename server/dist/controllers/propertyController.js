"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImages = exports.updateProperty = exports.createProperty = exports.getProperty = exports.getProperties = void 0;
const database_1 = __importDefault(require("../config/database"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Helper to process image
const processImage = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const processedPath = filePath.replace(/\.(\w+)$/, '_processed.jpg');
    // In a real app, we would overlay a logo here.
    // For now, just resize and convert to jpeg.
    yield (0, sharp_1.default)(filePath)
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(processedPath);
    // Remove original
    fs_1.default.unlinkSync(filePath);
    return processedPath;
});
const getProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        let query = 'SELECT p.*, u.name as agent_name FROM properties p JOIN users u ON p.agent_id = u.id';
        const params = [];
        if (user.role === 'agent') {
            query += ' WHERE p.agent_id = ?';
            params.push(user.id);
        }
        else if (user.role === 'curator') {
            // Curators might want to see everything or filter by status, but default to all for now or specific content statuses
        }
        // Add filters based on query params (status, type, etc.) - Simplified for now
        const [properties] = yield database_1.default.execute(query, params);
        res.json(properties);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProperties = getProperties;
const getProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const [rows] = yield database_1.default.execute('SELECT * FROM properties WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ message: 'Property not found' });
        const [images] = yield database_1.default.execute('SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order', [id]);
        res.json(Object.assign(Object.assign({}, rows[0]), { images }));
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProperty = getProperty;
const createProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const data = req.body;
    try {
        const [result] = yield database_1.default.execute(`INSERT INTO properties (
        agent_id, property_type, purpose, furnished, city, area, ownership_type, 
        ownership_notes, built_up_area, land_area, bedrooms, bathrooms, floor_level,
        has_24_7_electricity, has_generator, has_elevator, has_parking, price_usd, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            user.id, data.property_type, data.purpose, data.furnished, data.city, data.area, data.ownership_type,
            data.ownership_notes, data.built_up_area, data.land_area, data.bedrooms, data.bathrooms, data.floor_level,
            data.has_24_7_electricity, data.has_generator, data.has_elevator, data.has_parking, data.price_usd, data.notes
        ]);
        res.status(201).json({ id: result.insertId, message: 'Property created' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createProperty = createProperty;
const updateProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement update logic similar to create
    // Ensure agent owns the property or is admin
    res.status(501).json({ message: 'Not implemented yet' });
});
exports.updateProperty = updateProperty;
const uploadImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ message: 'No files uploaded' });
    try {
        const imagePromises = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const processedPath = yield processImage(file.path);
            // Store relative path
            const relativePath = path_1.default.relative(path_1.default.join(__dirname, '../../'), processedPath).replace(/\\/g, '/');
            yield database_1.default.execute('INSERT INTO property_images (property_id, file_path, sort_order) VALUES (?, ?, ?)', [id, relativePath, index]);
            return { id: 0, file_path: relativePath }; // Return simplified object
        }));
        yield Promise.all(imagePromises);
        res.json({ message: 'Images uploaded' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.uploadImages = uploadImages;
