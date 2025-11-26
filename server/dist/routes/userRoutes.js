"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
router.get('/', userController_1.getUsers);
router.post('/', userController_1.createUser);
router.patch('/:id/status', userController_1.updateUserStatus);
exports.default = router;
