import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CropTemplate from './models/CropTemplate';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-erp';

const RICE_UPDATES: Record<number, { rate: number; gapDays: number; efficiency: number }> = {
  1:  { rate: 4500, gapDays: 0,  efficiency: 0.09 },
  2:  { rate: 3000, gapDays: 1,  efficiency: 0.15 },
  3:  { rate: 3000, gapDays: 1,  efficiency: 0.15 },
  4:  { rate: 3500, gapDays: 1,  efficiency: 0.12 },
  5:  { rate: 3500, gapDays: 21, efficiency: 0.13 },
  6:  { rate: 4500, gapDays: 5,  efficiency: 0.09 },
  7:  { rate: 3500, gapDays: 2,  efficiency: 0.14 },
  8:  { rate: 5500, gapDays: 3,  efficiency: 0.08 },
  9:  { rate: 3500, gapDays: 10, efficiency: 0.13 },
  10: { rate: 3500, gapDays: 15, efficiency: 0.12 },
  11: { rate: 4000, gapDays: 10, efficiency: 0.10 },
  12: { rate: 3500, gapDays: 15, efficiency: 0.13 },
  13: { rate: 3000, gapDays: 7,  efficiency: 0.14 },
  14: { rate: 3500, gapDays: 15, efficiency: 0.12 },
  15: { rate: 4000, gapDays: 10, efficiency: 0.10 },
  16: { rate: 3500, gapDays: 15, efficiency: 0.13 },
  17: { rate: 4000, gapDays: 14, efficiency: 0.11 },
  18: { rate: 6000, gapDays: 3,  efficiency: 0.08 },
};

const WHEAT_UPDATES: Record<number, { rate: number; gapDays: number; efficiency: number }> = {
  1:  { rate: 4500, gapDays: 0,  efficiency: 0.09 },
  2:  { rate: 3000, gapDays: 3,  efficiency: 0.15 },
  3:  { rate: 3000, gapDays: 2,  efficiency: 0.14 },
  4:  { rate: 5000, gapDays: 1,  efficiency: 0.08 },
  5:  { rate: 3500, gapDays: 3,  efficiency: 0.11 },
  6:  { rate: 3000, gapDays: 18, efficiency: 0.15 },
  7:  { rate: 3500, gapDays: 5,  efficiency: 0.13 },
  8:  { rate: 3000, gapDays: 21, efficiency: 0.15 },
  9:  { rate: 4000, gapDays: 5,  efficiency: 0.10 },
  10: { rate: 3500, gapDays: 7,  efficiency: 0.13 },
  11: { rate: 3000, gapDays: 21, efficiency: 0.15 },
  12: { rate: 3500, gapDays: 5,  efficiency: 0.12 },
  13: { rate: 3000, gapDays: 21, efficiency: 0.15 },
  14: { rate: 3500, gapDays: 5,  efficiency: 0.12 },
  15: { rate: 3000, gapDays: 14, efficiency: 0.15 },
  16: { rate: 3000, gapDays: 10, efficiency: 0.13 },
  17: { rate: 4000, gapDays: 14, efficiency: 0.11 },
  18: { rate: 6000, gapDays: 3,  efficiency: 0.08 },
};

async function updateRates() {
  await mongoose.connect(MONGODB_URI);
  const crops = await CropTemplate.find();
  for (const crop of crops) {
    const updates = crop.name.includes('Rice') ? RICE_UPDATES : WHEAT_UPDATES;
    for (const act of crop.activities) {
      if (updates[act.stepNumber]) {
        act.bookingAmountPerAcre = updates[act.stepNumber].rate;
        act.gapDays = updates[act.stepNumber].gapDays;
        act.efficiency = updates[act.stepNumber].efficiency;
      }
    }
    crop.markModified('activities');
    await crop.save();
    console.log(`Updated ${crop.name}`);
  }
  console.log('Done.');
  await mongoose.disconnect();
}

updateRates().catch((err) => { console.error(err); process.exit(1); });
