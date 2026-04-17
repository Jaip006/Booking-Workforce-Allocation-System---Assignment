import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  farmerName: string;
  farmerContact: string;
  farmerLocation: string;
  landSize: number;
  cropType: mongoose.Types.ObjectId;
  startDate: Date;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    farmerName: { type: String, required: true },
    farmerContact: { type: String, required: true },
    farmerLocation: { type: String, required: true },
    landSize: { type: Number, required: true, min: 1 },
    cropType: { type: Schema.Types.ObjectId, ref: 'CropTemplate', required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
