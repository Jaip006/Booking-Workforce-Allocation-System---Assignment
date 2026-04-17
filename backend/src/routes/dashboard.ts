import { Router, Request, Response } from 'express';
import Booking from '../models/Booking';
import ScheduledActivity from '../models/ScheduledActivity';
import Team from '../models/Team';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [bookings, activities, teams] = await Promise.all([
      Booking.find().populate('cropType'),
      ScheduledActivity.find().populate('teamId'),
      Team.find(),
    ]);

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => b.status === 'Active').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled').length;

    const totalRevenue = activities.reduce((s, a) => s + (a.financials?.revenue || 0), 0);
    const totalCost = activities.reduce((s, a) => s + (a.financials?.cost || 0), 0);
    const totalProfit = activities.reduce((s, a) => s + (a.financials?.profit || 0), 0);

    const resourceConflicts = activities.filter((a) => a.status === 'ResourceConflict').length;
    const confirmedActivities = activities.filter((a) => a.status === 'Confirmed').length;
    const proposedActivities = activities.filter((a) => a.status === 'Proposed').length;

    // Bottleneck: teams with more than 5 overlapping schedule entries in any 30-day window
    const bottleneckTeams = teams
      .map((team) => {
        const overlapCount = team.schedule.length;
        return { teamId: team._id, name: team.name, scheduleCount: overlapCount, isBottleneck: overlapCount > 10 };
      })
      .filter((t) => t.isBottleneck);

    // Top 5 bookings by profit
    const bookingProfitMap: Record<string, number> = {};
    for (const a of activities) {
      const bid = a.bookingId.toString();
      bookingProfitMap[bid] = (bookingProfitMap[bid] || 0) + (a.financials?.profit || 0);
    }

    const recentBookings = bookings.slice(0, 10).map((b) => ({
      ...b.toObject(),
      projectedProfit: bookingProfitMap[b._id.toString()] || 0,
    }));

    res.json({
      summary: { totalBookings, activeBookings, cancelledBookings, totalRevenue, totalCost, totalProfit, resourceConflicts, confirmedActivities, proposedActivities },
      bottleneckAlert: bottleneckTeams.length > 0,
      bottleneckTeams,
      recentBookings,
      teamUtilization: teams.map((t) => ({ teamId: t._id, name: t.name, workerCount: t.workerCount, scheduledJobs: t.schedule.length })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Dashboard fetch failed' });
  }
});

export default router;
