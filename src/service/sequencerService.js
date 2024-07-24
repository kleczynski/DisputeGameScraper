const { db } = require('../models/mongoClient');

async function findSequencers() {
    try {
        const collection = db.collection(process.env.COLLECTION_NAME);

        const query = {
            challengedTransactionHashes: { $size: 2 },
            'transactions.functionName': { 
                $in: ['resolve()', 'resolveClaim(uint256 _claimIndex,uint256 _numToResolve)']
            }
        };

        const sequencers = await collection.find(query).toArray();
        return sequencers;
    } catch (error) {
        console.error('Error finding sequencers:', error);
        throw error;
    }
}

module.exports = { findSequencers };
