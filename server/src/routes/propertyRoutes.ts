import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProperties, getProperty, createProperty, updateProperty, uploadImages, deleteImage, updatePropertyStatus, updateContentStatus, getCuratorFeedback, addCuratorFeedback, deleteFeedback, getInternalNotes, addInternalNote, setThumbnail } from '../controllers/propertyController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.use(authenticateToken);

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', requireRole(['agent', 'owner']), createProperty);
router.put('/:id', requireRole(['agent', 'owner']), updateProperty);
router.post('/:id/images', requireRole(['agent', 'owner']), upload.array('images'), uploadImages);
router.delete('/:id/images/:imageId', requireRole(['agent', 'owner']), deleteImage);
router.put('/:id/status', requireRole(['agent', 'owner']), updatePropertyStatus);
router.put('/:id/content-status', requireRole(['agent', 'owner', 'curator']), updateContentStatus);
router.get('/:id/feedback', getCuratorFeedback);
router.post('/:id/feedback', requireRole(['curator', 'owner']), addCuratorFeedback);
router.delete('/:id/feedback', requireRole(['agent', 'owner']), deleteFeedback);
router.get('/:id/notes', requireRole(['agent', 'owner']), getInternalNotes);
router.post('/:id/notes', requireRole(['agent', 'owner']), addInternalNote);
router.put('/:id/thumbnail', requireRole(['curator']), setThumbnail);

export default router;
