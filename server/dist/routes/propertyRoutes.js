"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const propertyController_1 = require("../controllers/propertyController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, '../../uploads/') });
router.use(auth_1.authenticateToken);
router.get('/', propertyController_1.getProperties);
router.get('/:id', propertyController_1.getProperty);
router.post('/', (0, auth_1.requireRole)(['agent', 'admin']), propertyController_1.createProperty);
router.post('/:id/images', (0, auth_1.requireRole)(['agent', 'admin']), upload.array('images'), propertyController_1.uploadImages);
exports.default = router;
