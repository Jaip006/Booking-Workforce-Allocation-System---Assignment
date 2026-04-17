import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancials {
  duration: number;
  cost: number;
  revenue: number;
  profit: number;
  efficiency: number;
}

export interface IScheduledActivity extends Document {
  bookingId: mongoose.Types.ObjectId;
  stepNumber: number;
  activityName: string;
  teamId: mongoose.Types.ObjectId | null;
  plannedStartDate: Date;
  plannedEndDate: Date;
  status: 'Proposed' | 'Confirmed' | 'Completed' | 'Rejected' | 'ResourceConflict';
  financials: IFinancials;
  nextAvailableSlot: Date | null;
  rescheduleCount: number;
  completedByTeam: string | null;
}

const ScheduledActivitySchema = new Schema<IScheduledActivity>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  stepNumber: { type: Number, required: true },
  activityName: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  plannedStartDate: { type: Date, required: true },
  plannedEndDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Proposed', 'Confirmed', 'Completed', 'Rejected', 'ResourceConflict'],
    default: 'Proposed',
  },
  financials: {
    duration: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
  },
  nextAvailableSlot: { type: Date, default: null },
  rescheduleCount: { type: Number, default: 0 },
  completedByTeam: { type: String, default: null },
});

export default mongoose.model<IScheduledActivity>('ScheduledActivity', ScheduledActivitySchema);
