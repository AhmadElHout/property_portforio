"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientController_1 = require("../controllers/clientController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.get('/', clientController_1.getClients);
router.post('/', (0, auth_1.requireRole)(['agent', 'admin']), clientController_1.createClient);
router.patch('/:id/status', (0, auth_1.requireRole)(['agent', 'admin']), clientController_1.updateClientStatus);
exports.default = router;
