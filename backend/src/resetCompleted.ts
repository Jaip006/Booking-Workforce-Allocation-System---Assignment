import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduledActivity from './models/ScheduledActivity';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-erp';

async function resetCompleted() {
  await mongoose.connect(MONGODB_URI);

  const result = await ScheduledActivity.updateMany(
    { status: 'Completed', teamId: null },
    { $set: { status: 'Proposed' } }
  );

  console.log(`Reset ${result.modifiedCount} completed activities back to Proposed.`);
  await mongoose.disconnect();
}

resetCompleted().catch((err) => { console.error(err); process.exit(1); });
