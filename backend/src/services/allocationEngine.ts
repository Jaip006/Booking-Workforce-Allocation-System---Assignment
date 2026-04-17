import Team, { ITeam } from '../models/Team';
import { datesOverlap, addDays } from '../utils/dateUtils';
import mongoose from 'mongoose';

const DAILY_WAGE = Number(process.env.DAILY_WAGE) || 500;

export async function allocateTeam(
  plannedStartDate: Date,
  landSize: number,
  efficiency: number,
  bookingAmountPerAcre: number,
  maxDays: number,
  excludeActivityId?: mongoose.Types.ObjectId,
  excludeTeamId?: mongoose.Types.ObjectId,
) {
  const revenue = landSize * bookingAmountPerAcre;
  const teams = await Team.find().sort({ workerCount: 1 }); // sort ascending — min workers first

  // Filter available teams (not busy during any possible duration window)
  const getEnd = (workerCount: number) => {
    const duration = Math.ceil(landSize / (workerCount * efficiency));
    return { duration, end: addDays(plannedStartDate, duration - 1) };
  };

  const isAvailable = (team: ITeam) => {
    if (excludeTeamId && (team._id as mongoose.Types.ObjectId).equals(excludeTeamId)) return false;
    const { end } = getEnd(team.workerCount);
    return !team.schedule.some((e) => {
      if (excludeActivityId && e.activityId.equals(excludeActivityId)) return false;
      return datesOverlap(plannedStartDate, end, e.startDate, e.endDate);
    });
  };

  const availableTeams = teams.filter(isAvailable);

  if (availableTeams.length > 0) {
    // Pick the team that minimizes total labor cost (duration × workerCount)
    const chosenTeam = availableTeams.reduce((best, t) => {
      const bestCost = getEnd(best.workerCount).duration * best.workerCount;
      const tCost = getEnd(t.workerCount).duration * t.workerCount;
      return tCost < bestCost ? t : best;
    });
    const { duration, end } = getEnd(chosenTeam.workerCount);
    const financials = { duration, cost: 0, revenue, profit: 0, efficiency };
    return {
      teamId: chosenTeam._id as mongoose.Types.ObjectId,
      financials,
      status: 'Proposed' as const,
      nextAvailableSlot: null,
      plannedEndDate: end,
    };
  }

  // No team available — ResourceConflict, use min-worker team for duration estimate
  const next = await findNextSlot(landSize, efficiency, maxDays, plannedStartDate, excludeActivityId);
  const fallbackTeam = teams[0]; // min workers
  const { duration, end } = getEnd(fallbackTeam?.workerCount ?? 20);
  const financials = { duration, cost: 0, revenue, profit: 0, efficiency };
  return {
    teamId: null,
    financials,
    status: 'ResourceConflict' as const,
    nextAvailableSlot: next,
    plannedEndDate: end,
  };
}

async function findNextSlot(
  landSize: number,
  efficiency: number,
  maxDays: number,
  from: Date,
  excludeActivityId?: mongoose.Types.ObjectId,
): Promise<Date> {
  const teams = await Team.find().sort({ workerCount: 1 });
  let d = new Date(from);
  for (let i = 0; i < 90; i++) {
    d = addDays(d, 1);
    for (const t of teams) {
      const duration = Math.ceil(landSize / (t.workerCount * efficiency));
      const end = addDays(d, duration - 1);
      const busy = t.schedule.some((s) => {
        if (excludeActivityId && s.activityId.equals(excludeActivityId)) return false;
        return datesOverlap(d, end, s.startDate, s.endDate);
      });
      if (!busy && duration <= maxDays) return d;
    }
  }
  return addDays(from, 90);
}

export async function assignTeamToActivity(
  activityId: mongoose.Types.ObjectId,
  teamId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  bookingId: mongoose.Types.ObjectId,
) {
  await Team.findByIdAndUpdate(teamId, { $push: { schedule: { startDate, endDate, bookingId, activityId } } });
}

export async function removeTeamAssignment(
  activityId: mongoose.Types.ObjectId,
  teamId: mongoose.Types.ObjectId,
) {
  await Team.findByIdAndUpdate(teamId, { $pull: { schedule: { activityId } } });
}
