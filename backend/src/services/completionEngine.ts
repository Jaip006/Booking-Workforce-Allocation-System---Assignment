import ScheduledActivity from '../models/ScheduledActivity';
import Team from '../models/Team';
import { removeTeamAssignment } from './allocationEngine';
import mongoose from 'mongoose';

export async function autoCompleteActivities(bookingId: string): Promise<void> {
  const now = new Date();
  const confirmed = await ScheduledActivity.find({
    bookingId,
    status: 'Confirmed',
    plannedEndDate: { $lt: now },
  });

  for (const activity of confirmed) {
    if (activity.teamId) {
      await removeTeamAssignment(
        activity._id as mongoose.Types.ObjectId,
        activity.teamId as mongoose.Types.ObjectId,
      );
      // keep teamId on activity so team name remains visible after completion
    }
    activity.status = 'Completed';
    await activity.save();
  }
}
