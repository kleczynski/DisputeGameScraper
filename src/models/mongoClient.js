require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

async function insertTransaction(data) {
    if (data.length === 0) {
        console.log('No documents to insert');
        return;
    }

    try {
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        const result = await collection.insertMany(data);
        console.log('Inserted documents:', result.insertedCount);
    } catch (error) {
        console.error('Error inserting documents:', error);
    }
}

async function closeConnection() {
    try {
        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}

module.exports = {
    connectToMongoDB,
    insertTransaction,
    closeConnection
};
module.exports.client = client;
module.exports.db = client.db(DATABASE_NAME);
