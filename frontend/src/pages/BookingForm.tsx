import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createBooking } from '../api';
import { CropTemplate } from '../types';

export default function BookingForm() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<CropTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    farmerName: '',
    farmerContact: '',
    farmerLocation: '',
    landSize: '',
    cropTypeId: '',
    startDate: '',
  });

  useEffect(() => {
    axios.get('/api/crops').then((r) => setCrops(r.data));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBooking({ ...form, landSize: Number(form.landSize) });
      navigate(`/bookings/${res.booking._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-bold text-bark">New Booking</h1>
        <p className="text-bark/50 text-sm font-sans mt-1">Register a farmer and schedule the full crop cycle</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <input required className="input" placeholder="Farmer Name" value={form.farmerName} onChange={set('farmerName')} />
          </div>
          <div>
            <input required className="input" placeholder="Contact Number" value={form.farmerContact} onChange={set('farmerContact')} />
          </div>
          <div>
            <input required className="input" placeholder="Location / Village" value={form.farmerLocation} onChange={set('farmerLocation')} />
          </div>
          <div>
            <input required type="number" min="1" className="input" placeholder="Land Size (acres)" value={form.landSize} onChange={set('landSize')} />
          </div>
          <div>
            <label className="label">Crop Type</label>
            <select required className="input" value={form.cropTypeId} onChange={set('cropTypeId')}>
              <option value="">— Select crop —</option>
              {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input required type="date" className="input" value={form.startDate} onChange={set('startDate')} />
          </div>
        </div>

        {form.cropTypeId && (
          <div className="bg-sage/5 border border-sage/20 rounded-organic p-4">
            <p className="text-xs font-sans font-medium text-sage-dark uppercase tracking-wide mb-2">Crop Cycle Preview</p>
            <p className="text-sm text-bark/70 font-sans">
              {crops.find((c) => c._id === form.cropTypeId)?.activities.length} activities will be automatically scheduled.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Scheduling activities…' : 'Create Booking & Schedule'}
          </button>
          <button type="button" onClick={() => navigate('/bookings')} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
