import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import bookingRoutes from './routes/bookings';
import activityRoutes from './routes/activities';
import teamRoutes from './routes/teams';
import dashboardRoutes from './routes/dashboard';
import cropRoutes from './routes/crops';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-erp';

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/crops', cropRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
