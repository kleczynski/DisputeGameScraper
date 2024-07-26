require('dotenv').config({ path: '../../.env' });
const { getDb } = require('../models/mongoClient');

async function findSequencers() {
    try {
        const db = getDb();
        const collection = db.collection(process.env.COLLECTION_NAME);

        const query = {
            honestProposer: true 
        };

        const sequencers = await collection.find(query).toArray();

        if (sequencers.length === 0) {
            return { message: 'No honest sequencers found' };
        }

        const response = {
            sequencers: sequencers.map(sequencer => sequencer.proposer),
            timestamp: Date.now()
        };

        return response;
    } catch (error) {
        console.error('Error finding sequencers:', error);
        throw error;
    }
}

module.exports = { findSequencers };
