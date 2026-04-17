import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking';
import ScheduledActivity from './models/ScheduledActivity';
import Team from './models/Team';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-erp';

async function clear() {
  await mongoose.connect(MONGODB_URI);
  await Booking.deleteMany({});
  await ScheduledActivity.deleteMany({});
  await Team.updateMany({}, { $set: { schedule: [] } });
  console.log('Cleared all bookings, activities, and team schedules.');
  await mongoose.disconnect();
}

clear().catch((err) => { console.error(err); process.exit(1); });
