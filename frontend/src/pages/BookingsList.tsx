import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, deleteBooking } from '../api';
import { Booking } from '../types';

export default function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getBookings().then(setBookings).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this booking? This will remove all scheduled activities and free up team schedules.')) return;
    await deleteBooking(id);
    setBookings((prev) => prev.filter((b) => b._id !== id));
  };

  const filtered = bookings.filter(
    (b) =>
      b.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      b.farmerLocation.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-bark/40 font-sans text-xl">Loading bookings…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-sans text-4xl font-bold text-bark">All Bookings</h1>
          <p className="text-bark/50 text-sm font-sans mt-1">{bookings.length} total bookings</p>
        </div>
        <Link to="/bookings/new" className="btn-primary">+ New Booking</Link>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by farmer or location…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b) => (
          <div key={b._id} className="card p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-sans text-lg font-semibold text-bark">{b.farmerName}</h3>
                <p className="text-xs text-bark/50 font-sans">{b.farmerLocation} · 📞 {b.farmerContact}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm font-sans">
              <div>
                <span className="text-bark/50 text-xs">Crop</span>
                <p className="font-medium">{(b.cropType as any)?.name || '—'}</p>
              </div>
              <div>
                <span className="text-bark/50 text-xs">Land Size</span>
                <p className="font-medium">{b.landSize} acres</p>
              </div>
              <div>
                <span className="text-bark/50 text-xs">Start Date</span>
                <p className="font-medium">{new Date(b.startDate).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Link to={`/bookings/${b._id}`} className="btn-ghost text-xs px-3 py-1.5 flex-1 text-center">
                View Schedule
              </Link>
              <button
                onClick={() => handleDelete(b._id)}
                className="text-xs text-red-500 hover:text-red-700 font-sans px-3 py-1.5 border border-red-200 hover:bg-red-50 transition-colors"
                style={{ borderRadius: '6px 2px 8px 2px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-bark/30 font-sans text-xl">No bookings found.</div>
      )}
    </div>
  );
}
