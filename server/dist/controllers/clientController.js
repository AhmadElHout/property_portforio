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
exports.updateClientStatus = exports.createClient = exports.getClients = void 0;
const database_1 = __importDefault(require("../config/database"));
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        let query = 'SELECT * FROM clients';
        const params = [];
        if (user.role === 'agent') {
            query += ' WHERE agent_id = ?';
            params.push(user.id);
        }
        const [clients] = yield database_1.default.execute(query, params);
        res.json(clients);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getClients = getClients;
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { name, type, phone, email, whatsapp, notes } = req.body;
    try {
        const [result] = yield database_1.default.execute('INSERT INTO clients (agent_id, name, type, phone, email, whatsapp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [user.id, name, type, phone, email, whatsapp, notes]);
        res.status(201).json({ id: result.insertId, message: 'Client created' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createClient = createClient;
const updateClientStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement status update
    res.status(501).json({ message: 'Not implemented yet' });
});
exports.updateClientStatus = updateClientStatus;
