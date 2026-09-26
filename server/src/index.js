import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);

app.use(errorHandler);

const port = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
