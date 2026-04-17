import { Router } from 'express';
import CropTemplate from '../models/CropTemplate';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const crops = await CropTemplate.find();
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crop templates' });
  }
});

export default router;
