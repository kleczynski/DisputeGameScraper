import 'dotenv/config';
import { MongoClient, Db, Collection } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI as string;
const DATABASE_NAME = process.env.DATABASE_NAME as string;
const COLLECTION_NAME = process.env.COLLECTION_NAME as string;

if (!MONGO_URI || !DATABASE_NAME) {
    console.error('Missing required environment variables. Please ensure MONGO_URI and DATABASE_NAME are set in .env file.');
    process.exit(1);
}

const client = new MongoClient(MONGO_URI);

let db: Db;

async function connectToMongoDB(): Promise<void> {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db(DATABASE_NAME);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

async function insertTransaction(data: any[]): Promise<void> {
    if (!db) {
        throw new Error('Database not connected. Please call connectToMongoDB first.');
    }
    
    try {
        const collection: Collection = db.collection(COLLECTION_NAME);
        const result = await collection.insertMany(data);
        console.log('Inserted documents:', result.insertedCount);
    } catch (error) {
        console.error('Error inserting documents:', error);
        throw error;
    }
}

async function closeConnection(): Promise<void> {
    try {
        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}

function getDb(): Db {
    if (!db) {
        throw new Error('Database not connected. Please call connectToMongoDB first.');
    }
    return db;
}

export {
    connectToMongoDB,
    insertTransaction,
    closeConnection,
    getDb
};
