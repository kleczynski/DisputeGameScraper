require('dotenv').config();
const express = require('express');
const { connectToMongoDB } = require('../src/models/mongoClient');
const { getSequencers } = require('../src/controller/sequencerController'); 

const app = express();
const port = process.env.PORT || 3003;

(async () => {
    try {
        await connectToMongoDB();
        console.log('Database connected');

        app.get('/find-sequencer', getSequencers);

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
})();

module.exports = app;
