import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityTemplate {
  stepNumber: number;
  activityName: string;
  gapDays: number;
  efficiency: number;
  bookingAmountPerAcre: number;
}

export interface ICropTemplate extends Document {
  name: string;
  activities: IActivityTemplate[];
}

const ActivityTemplateSchema = new Schema<IActivityTemplate>({
  stepNumber: { type: Number, required: true },
  activityName: { type: String, required: true },
  gapDays: { type: Number, required: true, default: 0 },
  efficiency: { type: Number, required: true },
  bookingAmountPerAcre: { type: Number, required: true },
});

const CropTemplateSchema = new Schema<ICropTemplate>({
  name: { type: String, required: true, unique: true },
  activities: [ActivityTemplateSchema],
});

export default mongoose.model<ICropTemplate>('CropTemplate', CropTemplateSchema);
