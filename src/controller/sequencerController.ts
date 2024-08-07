import { Request, Response } from 'express';
import { findSequencers } from '../service/sequencerService';
import { signMessage } from '../utils/signMessage';

async function getSequencers(req: Request, res: Response): Promise<void> {
    try {
        const sequencers = await findSequencers();

        const privateKey = process.env.PRIVATE_KEY as string;
        const message = JSON.stringify(sequencers);
        const signature = await signMessage(message, privateKey);

        res.json({ sequencers, signature });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

export { getSequencers };
