import express from 'express';
import dotenv from 'dotenv';
import sequencerRoutes from './routes/sequencerRoutes';
import { connectToMongoDB } from './models/mongoClient';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', sequencerRoutes);

const startServer = async () => {
  try {
    await connectToMongoDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
