import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamScheduleEntry {
  startDate: Date;
  endDate: Date;
  bookingId: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
}

export interface ITeam extends Document {
  name: string;
  workerCount: number;
  schedule: ITeamScheduleEntry[];
}

const TeamScheduleEntrySchema = new Schema<ITeamScheduleEntry>({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  activityId: { type: Schema.Types.ObjectId, ref: 'ScheduledActivity', required: true },
});

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, unique: true },
  workerCount: { type: Number, required: true, min: 15, max: 25 },
  schedule: [TeamScheduleEntrySchema],
});

export default mongoose.model<ITeam>('Team', TeamSchema);
