import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './models/Team';
import CropTemplate from './models/CropTemplate';
import Booking from './models/Booking';
import ScheduledActivity from './models/ScheduledActivity';
import { allocateTeam, assignTeamToActivity } from './services/allocationEngine';
import { addDays } from './utils/dateUtils';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-erp';

const TEAM_NAMES = ['Alpha Squad', 'Beta Brigade', 'Gamma Force', 'Delta Crew', 'Epsilon Team', 'Zeta Unit', 'Eta Corps'];

const CROP_TEMPLATES = [
  {
    name: 'Rice (Kharif)',
    activities: [
      { stepNumber: 1,  activityName: 'Land Preparation',         gapDays: 0,  efficiency: 0.09, bookingAmountPerAcre: 4500 },
      { stepNumber: 2,  activityName: 'Soil Testing',             gapDays: 1,  efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 3,  activityName: 'Seed Selection',           gapDays: 1,  efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 4,  activityName: 'Nursery Preparation',      gapDays: 1,  efficiency: 0.12, bookingAmountPerAcre: 3500 },
      { stepNumber: 5,  activityName: 'Nursery Management',       gapDays: 21, efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 6,  activityName: 'Field Leveling',           gapDays: 5,  efficiency: 0.09, bookingAmountPerAcre: 4500 },
      { stepNumber: 7,  activityName: 'Irrigation Setup',         gapDays: 2,  efficiency: 0.14, bookingAmountPerAcre: 3500 },
      { stepNumber: 8,  activityName: 'Transplanting',            gapDays: 3,  efficiency: 0.08, bookingAmountPerAcre: 5500 },
      { stepNumber: 9,  activityName: 'Fertilizer Application 1', gapDays: 10, efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 10, activityName: 'Pest Control 1',           gapDays: 15, efficiency: 0.12, bookingAmountPerAcre: 3500 },
      { stepNumber: 11, activityName: 'Weeding 1',                gapDays: 10, efficiency: 0.10, bookingAmountPerAcre: 4000 },
      { stepNumber: 12, activityName: 'Fertilizer Application 2', gapDays: 15, efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 13, activityName: 'Irrigation Management',    gapDays: 7,  efficiency: 0.14, bookingAmountPerAcre: 3000 },
      { stepNumber: 14, activityName: 'Pest Control 2',           gapDays: 15, efficiency: 0.12, bookingAmountPerAcre: 3500 },
      { stepNumber: 15, activityName: 'Weeding 2',                gapDays: 10, efficiency: 0.10, bookingAmountPerAcre: 4000 },
      { stepNumber: 16, activityName: 'Fertilizer Application 3', gapDays: 15, efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 17, activityName: 'Harvest Preparation',      gapDays: 14, efficiency: 0.11, bookingAmountPerAcre: 4000 },
      { stepNumber: 18, activityName: 'Harvesting',               gapDays: 3,  efficiency: 0.08, bookingAmountPerAcre: 6000 },
    ],
  },
  {
    name: 'Wheat (Rabi)',
    activities: [
      { stepNumber: 1,  activityName: 'Deep Ploughing',              gapDays: 0,  efficiency: 0.09, bookingAmountPerAcre: 4500 },
      { stepNumber: 2,  activityName: 'Soil Amendment',              gapDays: 3,  efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 3,  activityName: 'Seed Treatment',              gapDays: 2,  efficiency: 0.14, bookingAmountPerAcre: 3000 },
      { stepNumber: 4,  activityName: 'Sowing',                      gapDays: 1,  efficiency: 0.08, bookingAmountPerAcre: 5000 },
      { stepNumber: 5,  activityName: 'Pre-emergence Weed Control',  gapDays: 3,  efficiency: 0.11, bookingAmountPerAcre: 3500 },
      { stepNumber: 6,  activityName: 'First Irrigation',            gapDays: 18, efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 7,  activityName: 'Fertilizer Crown Root',       gapDays: 5,  efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 8,  activityName: 'Second Irrigation',           gapDays: 21, efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 9,  activityName: 'Post-emergence Weeding',      gapDays: 5,  efficiency: 0.10, bookingAmountPerAcre: 4000 },
      { stepNumber: 10, activityName: 'Tillering Fertilizer',        gapDays: 7,  efficiency: 0.13, bookingAmountPerAcre: 3500 },
      { stepNumber: 11, activityName: 'Third Irrigation',            gapDays: 21, efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 12, activityName: 'Fungicide Application',       gapDays: 5,  efficiency: 0.12, bookingAmountPerAcre: 3500 },
      { stepNumber: 13, activityName: 'Fourth Irrigation',           gapDays: 21, efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 14, activityName: 'Aphid / Pest Control',        gapDays: 5,  efficiency: 0.12, bookingAmountPerAcre: 3500 },
      { stepNumber: 15, activityName: 'Fifth Irrigation',            gapDays: 14, efficiency: 0.15, bookingAmountPerAcre: 3000 },
      { stepNumber: 16, activityName: 'Grain Fill Monitoring',       gapDays: 10, efficiency: 0.13, bookingAmountPerAcre: 3000 },
      { stepNumber: 17, activityName: 'Harvest Preparation',         gapDays: 14, efficiency: 0.11, bookingAmountPerAcre: 4000 },
      { stepNumber: 18, activityName: 'Combine Harvesting',          gapDays: 3,  efficiency: 0.08, bookingAmountPerAcre: 6000 },
    ],
  },
];

const FARMER_NAMES = ['Ramesh Kumar', 'Suresh Patel', 'Anil Singh', 'Vijay Sharma', 'Mahesh Yadav', 'Rajesh Verma', 'Dinesh Gupta', 'Mukesh Tiwari', 'Santosh Mishra', 'Prakash Joshi', 'Devendra Rao', 'Harish Reddy', 'Girish Nair', 'Umesh Pillai', 'Naresh Iyer', 'Sunil Bhat', 'Ajay Mehta', 'Sanjay Jain', 'Vijay Malhotra', 'Ravi Desai'];
const LOCATIONS = ['Pune', 'Nashik', 'Aurangabad', 'Kolhapur', 'Solapur', 'Latur', 'Nagpur', 'Amravati', 'Jalgaon', 'Dhule'];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Team.deleteMany({}),
    CropTemplate.deleteMany({}),
    Booking.deleteMany({}),
    ScheduledActivity.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Seed teams
  const teams = await Team.insertMany(
    TEAM_NAMES.map((name) => ({ name, workerCount: randomBetween(15, 25), schedule: [] }))
  );
  console.log(`Seeded ${teams.length} teams`);

  // Seed crop templates
  const crops = await CropTemplate.insertMany(CROP_TEMPLATES);
  console.log(`Seeded ${crops.length} crop templates`);

  // Seed 100 bookings
  const startRange = new Date('2024-01-01');
  const endRange = new Date('2024-06-30');
  let created = 0;

  for (let i = 0; i < 100; i++) {
    try {
      const farmerName = FARMER_NAMES[i % FARMER_NAMES.length] + ` #${i + 1}`;
      const farmerContact = `98${randomBetween(10000000, 99999999)}`;
      const farmerLocation = LOCATIONS[i % LOCATIONS.length];
      const landSize = randomBetween(5, 50);
      const cropType = crops[i % crops.length];
      const startDate = randomDate(startRange, endRange);

      const booking = await Booking.create({ farmerName, farmerContact, farmerLocation, landSize, cropType: cropType._id, startDate });

      const sortedActivities = [...cropType.activities].sort((a, b) => a.stepNumber - b.stepNumber);
      let currentStart = new Date(startDate);

      for (const tmpl of sortedActivities) {
        if (tmpl.stepNumber > 1) currentStart = addDays(currentStart, tmpl.gapDays);

        const nextTmpl = sortedActivities[sortedActivities.indexOf(tmpl) + 1];
        const maxDays = nextTmpl ? Math.max(nextTmpl.gapDays, 3) : 30;
        const result = await allocateTeam(currentStart, landSize, tmpl.efficiency, tmpl.bookingAmountPerAcre, maxDays);

        const activity = await ScheduledActivity.create({
          bookingId: booking._id,
          stepNumber: tmpl.stepNumber,
          activityName: tmpl.activityName,
          teamId: result.teamId,
          plannedStartDate: currentStart,
          plannedEndDate: result.plannedEndDate,
          status: result.status,
          financials: result.financials,
          nextAvailableSlot: result.nextAvailableSlot,
        });

        if (result.teamId) {
          await assignTeamToActivity(activity._id as any, result.teamId, currentStart, result.plannedEndDate, booking._id as any);
        }

        currentStart = addDays(result.plannedEndDate, 1);
      }

      created++;
      if (created % 10 === 0) console.log(`Created ${created} bookings...`);
    } catch (err) {
      console.error(`Failed booking ${i}:`, err);
    }
  }

  console.log(`\nSeed complete: ${created} bookings with 18 activities each.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
