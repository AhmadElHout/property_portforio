import express from 'express';
import { getClients, createClient, updateClient, deleteClient, getClientsWithProperties } from '../controllers/clientController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getClients);
router.get('/with-properties', getClientsWithProperties);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
