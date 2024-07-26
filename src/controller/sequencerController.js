const { findSequencers } = require('../service/sequencerService');
const signMessage = require('../utils/signMessage');

async function getSequencers(req, res) {
    try {
        const sequencers = await findSequencers();

        const privateKey = process.env.PRIVATE_KEY;
        const message = JSON.stringify(sequencers);
        const signature = await signMessage(message, privateKey);

        res.json({ sequencers, signature });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = { getSequencers };
