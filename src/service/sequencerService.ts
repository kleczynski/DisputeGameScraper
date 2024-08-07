import 'dotenv/config';
import { Db } from 'mongodb';
import { getDb } from '../models/mongoClient';

interface SequencerResponse {
    sequencers?: string[];
    timestamp?: number;
    message?: string;
}

async function findSequencers(): Promise<SequencerResponse> {
    try {
        const db: Db = getDb();
        const collection = db.collection(process.env.COLLECTION_NAME as string);

        const query = {
            honestProposer: true
        };

        const sequencers = await collection.find(query).toArray();

        if (sequencers.length === 0) {
            return { message: 'No honest sequencers found' };
        }

        const response: SequencerResponse = {
            sequencers: sequencers.map(sequencer => sequencer.proposer),
            timestamp: Date.now()
        };

        return response;
    } catch (error) {
        console.error('Error finding sequencers:', error);
        throw error;
    }
}

export { findSequencers };
