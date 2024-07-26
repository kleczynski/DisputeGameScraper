require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

if (!MONGO_URI || !DATABASE_NAME) {
    console.error('Missing required environment variables. Please ensure MONGO_URI and DATABASE_NAME are set in .env file.');
    process.exit(1);
}

const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db(DATABASE_NAME);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

async function insertTransaction(data) {
    if (!db) {
        throw new Error('Database not connected. Please call connectToMongoDB first.');
    }
    
    try {
        const collection = db.collection(process.env.COLLECTION_NAME);
        const result = await collection.insertMany(data);
        console.log('Inserted documents:', result.insertedCount);
    } catch (error) {
        console.error('Error inserting documents:', error);
        throw error;
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

function getDb() {
    if (!db) {
        throw new Error('Database not connected. Please call connectToMongoDB first.');
    }
    return db;
}

module.exports = {
    connectToMongoDB,
    insertTransaction,
    closeConnection,
    getDb
};
