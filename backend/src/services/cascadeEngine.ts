import ScheduledActivity from '../models/ScheduledActivity';
import CropTemplate from '../models/CropTemplate';
import Booking from '../models/Booking';
import { removeTeamAssignment } from './allocationEngine';
import { addDays } from '../utils/dateUtils';
import mongoose from 'mongoose';

export async function cascadeReschedule(bookingId: string, fromStep: number, newStartDate: Date): Promise<void> {
  const booking = await Booking.findById(bookingId).populate('cropType');
  if (!booking) throw new Error('Booking not found');

  const cropTemplate = await CropTemplate.findById((booking.cropType as any)._id ?? booking.cropType);
  const templates = (cropTemplate?.activities ?? []).sort((a, b) => a.stepNumber - b.stepNumber);

  const activities = await ScheduledActivity.find({ bookingId }).sort({ stepNumber: 1 });

  let currentStart = new Date(newStartDate);

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    if (activity.stepNumber < fromStep) continue;

    const duration = activity.financials.duration;
    const plannedEndDate = addDays(currentStart, duration - 1);

    // Release team if confirmed — must be re-accepted
    if (activity.teamId) {
      await removeTeamAssignment(
        activity._id as mongoose.Types.ObjectId,
        activity.teamId as mongoose.Types.ObjectId,
      );
      activity.teamId = null;
      activity.status = 'Proposed';
    }

    activity.plannedStartDate = currentStart;
    activity.plannedEndDate = plannedEndDate;
    activity.markModified('financials');
    await activity.save();

    currentStart = addDays(plannedEndDate, 1);
  }
}
