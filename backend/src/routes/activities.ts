import { Router, Request, Response } from 'express';
import ScheduledActivity from '../models/ScheduledActivity';
import { cascadeReschedule } from '../services/cascadeEngine';
import { confirmActivityById } from '../services/confirmActivity';
import { removeTeamAssignment } from '../services/allocationEngine';
import mongoose from 'mongoose';
import Team from '../models/Team';

const router = Router();

// GET all activities (with optional bookingId filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const filter = req.query.bookingId ? { bookingId: req.query.bookingId } : {};
    const activities = await ScheduledActivity.find(filter).populate('teamId').sort({ stepNumber: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// PATCH confirm an activity — allocates team at runtime and calculates cost
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const result = await confirmActivityById(req.params.id);
    if (!result) return res.status(409).json({ error: 'No team available for this activity slot' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to confirm activity' });
  }
});

// PATCH reject activity → triggers cascade reschedule
router.patch('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { newStartDate } = req.body;
    if (!newStartDate) return res.status(400).json({ error: 'newStartDate is required' });

    const activity = await ScheduledActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    if ((activity.rescheduleCount ?? 0) >= 3) return res.status(400).json({ error: 'This activity has already been rescheduled 3 times' });

    activity.rescheduleCount = (activity.rescheduleCount ?? 0) + 1;
    activity.status = 'Proposed';
    await activity.save();

    // Release the team for this activity
    if (activity.teamId) {
      await removeTeamAssignment(activity._id as mongoose.Types.ObjectId, activity.teamId as mongoose.Types.ObjectId);
      activity.teamId = null;
      await activity.save();
    }

    // Cascade reschedule from this step onward
    await cascadeReschedule(activity.bookingId.toString(), activity.stepNumber, new Date(newStartDate));

    // Auto-confirm on 3rd reschedule
    if (activity.rescheduleCount >= 3) {
      await confirmActivityById(activity._id.toString());
    }

    const updated = await ScheduledActivity.find({ bookingId: activity.bookingId }).populate('teamId').sort({ stepNumber: 1 });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject activity' });
  }
});

// PATCH complete an activity manually
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const activity = await ScheduledActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    if (activity.status !== 'Confirmed') return res.status(400).json({ error: 'Only confirmed activities can be completed' });

    if (activity.teamId) {
      await removeTeamAssignment(activity._id as mongoose.Types.ObjectId, activity.teamId as mongoose.Types.ObjectId);
    }

    activity.status = 'Completed';
    await activity.save();
    res.json(await activity.populate('teamId'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete activity' });
  }
});

// PATCH cancel a single activity
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const activity = await ScheduledActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    if (activity.teamId) {
      await removeTeamAssignment(activity._id as mongoose.Types.ObjectId, activity.teamId as mongoose.Types.ObjectId);
    }
    activity.status = 'Rejected';
    activity.teamId = null;
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel activity' });
  }
});

export default router;
