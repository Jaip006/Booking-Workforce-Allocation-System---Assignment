import { Router, Request, Response } from 'express';
import Team from '../models/Team';
import ScheduledActivity from '../models/ScheduledActivity';

const router = Router();

// GET all teams
router.get('/', async (_req: Request, res: Response) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET single team with schedule
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// GET team availability for a date range
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const busy = team.schedule.some((e) => start <= e.endDate && end >= e.startDate);
    res.json({ teamId: team._id, available: !busy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// POST create team
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, workerCount } = req.body;
    if (!name || !workerCount) return res.status(400).json({ error: 'name and workerCount required' });
    const team = await Team.create({ name, workerCount, schedule: [] });
    res.status(201).json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create team' });
  }
});

// PUT update team
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, workerCount } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, { name, workerCount }, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update team' });
  }
});

export default router;
