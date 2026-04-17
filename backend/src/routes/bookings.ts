import { Router, Request, Response } from 'express';
import Booking from '../models/Booking';
import CropTemplate from '../models/CropTemplate';
import ScheduledActivity from '../models/ScheduledActivity';
import Team from '../models/Team';
import { addDays } from '../utils/dateUtils';

const router = Router();

// GET all bookings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const bookings = await Booking.find().populate('cropType').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET single booking with activities
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('cropType');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const activities = await ScheduledActivity.find({ bookingId: req.params.id })
      .populate('teamId')
      .sort({ stepNumber: 1 });
    res.json({ booking, activities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST create booking + schedule all 18 activities
router.post('/', async (req: Request, res: Response) => {
  try {
    const { farmerName, farmerContact, farmerLocation, landSize, cropTypeId, startDate } = req.body;

    const cropTemplate = await CropTemplate.findById(cropTypeId);
    if (!cropTemplate) return res.status(404).json({ error: 'Crop template not found' });

    const booking = await Booking.create({
      farmerName,
      farmerContact,
      farmerLocation,
      landSize,
      cropType: cropTypeId,
      startDate: new Date(startDate),
    });

    const sortedActivities = [...cropTemplate.activities].sort((a, b) => a.stepNumber - b.stepNumber);
    let currentStart = new Date(startDate);

    for (let i = 0; i < sortedActivities.length; i++) {
      const tmpl = sortedActivities[i];
      const nextTmpl = sortedActivities[i + 1];
      const duration = Math.floor(Math.random() * 6) + 2;
      const plannedEndDate = addDays(currentStart, duration - 1);
      const revenue = landSize * tmpl.bookingAmountPerAcre;

      await ScheduledActivity.create({
        bookingId: booking._id,
        stepNumber: tmpl.stepNumber,
        activityName: tmpl.activityName,
        teamId: null,
        plannedStartDate: currentStart,
        plannedEndDate,
        status: 'Proposed',
        financials: { duration, cost: 0, revenue, profit: 0, efficiency: tmpl.efficiency },
        nextAvailableSlot: null,
      });

      currentStart = addDays(plannedEndDate, 1);
    }

    const activities = await ScheduledActivity.find({ bookingId: booking._id }).populate('teamId').sort({ stepNumber: 1 });
    res.status(201).json({ booking, activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// DELETE booking + activities + free team schedules
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const activities = await ScheduledActivity.find({ bookingId: req.params.id });
    const activityIds = activities.map((a) => a._id);

    await Team.updateMany(
      { 'schedule.bookingId': booking._id },
      { $pull: { schedule: { bookingId: booking._id } } }
    );

    await ScheduledActivity.deleteMany({ bookingId: req.params.id });
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
