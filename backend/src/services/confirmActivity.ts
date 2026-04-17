import ScheduledActivity from '../models/ScheduledActivity';
import Booking from '../models/Booking';
import CropTemplate from '../models/CropTemplate';
import Team from '../models/Team';
import { allocateTeam, assignTeamToActivity } from './allocationEngine';
import mongoose from 'mongoose';

const DAILY_WAGE = Number(process.env.DAILY_WAGE) || 500;

export async function confirmActivityById(activityId: string): Promise<InstanceType<typeof ScheduledActivity> | null> {
  const activity = await ScheduledActivity.findById(activityId);
  if (!activity) return null;

  const booking = await Booking.findById(activity.bookingId).populate('cropType');
  if (!booking) return null;

  const cropTemplate = await CropTemplate.findById((booking.cropType as any)._id ?? booking.cropType);
  const templates = (cropTemplate?.activities ?? []).sort((a, b) => a.stepNumber - b.stepNumber);
  const tmplIdx = templates.findIndex((t) => t.stepNumber === activity.stepNumber);
  const nextTmpl = templates[tmplIdx + 1];
  const maxDays = nextTmpl ? Math.max(nextTmpl.gapDays, 3) : 30;

  const prevActivity = await ScheduledActivity.findOne({
    bookingId: activity.bookingId,
    stepNumber: activity.stepNumber - 1,
    status: 'Confirmed',
  });
  const excludeTeamId = prevActivity?.teamId as mongoose.Types.ObjectId | undefined;

  const efficiency = activity.financials.efficiency || 0.1;
  const bookingAmountPerAcre = templates[tmplIdx]?.bookingAmountPerAcre ?? 0;

  const result = await allocateTeam(
    activity.plannedStartDate,
    booking.landSize,
    efficiency,
    bookingAmountPerAcre,
    maxDays,
    undefined,
    excludeTeamId,
  );

  if (!result.teamId) return null;

  const team = await Team.findById(result.teamId);
  if (!team) return null;

  const duration = Math.ceil(booking.landSize / (efficiency * team.workerCount));
  const plannedEndDate = new Date(activity.plannedStartDate);
  plannedEndDate.setDate(plannedEndDate.getDate() + duration - 1);

  const cost = duration * team.workerCount * DAILY_WAGE;
  const profit = activity.financials.revenue - cost;

  activity.teamId = result.teamId;
  activity.status = 'Confirmed';
  activity.plannedEndDate = plannedEndDate;
  activity.financials = { ...activity.financials, duration, cost, profit };
  activity.markModified('financials');
  await activity.save();

  await assignTeamToActivity(
    activity._id as mongoose.Types.ObjectId,
    result.teamId,
    activity.plannedStartDate,
    plannedEndDate,
    booking._id as mongoose.Types.ObjectId,
  );

  return activity.populate('teamId');
}
