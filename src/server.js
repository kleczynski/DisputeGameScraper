require('dotenv').config();
const express = require('express');
const connectToMongoDB = require('./models/mongoClient');
const sequencerRoutes = require('./routes/sequencerRoutes');

const app = express();

// Connect to MongoDB
connectToMongoDB();

// Use Routes
app.use('/sequencer', sequencerRoutes);

module.exports = app;
