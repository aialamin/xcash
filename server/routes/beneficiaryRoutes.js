import express from 'express';
import { getBeneficiaries, addBeneficiary, deleteBeneficiary } from '../controllers/beneficiaryController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, getBeneficiaries);
router.post('/', protect, addBeneficiary);
router.delete('/:id', protect, deleteBeneficiary);
export default router;
