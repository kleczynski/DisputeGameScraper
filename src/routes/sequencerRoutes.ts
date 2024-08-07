import { Router } from 'express';
import { getSequencers } from '../controller/sequencerController';

const router = Router();

router.get('/sequencers', getSequencers);

export default router;
