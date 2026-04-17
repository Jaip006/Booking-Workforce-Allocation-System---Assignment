import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBooking, confirmActivity, rejectActivity, completeActivity } from '../api';
import { Booking, ScheduledActivity } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function statusClass(s: string) {
  if (s === 'Confirmed' || s === 'Completed') return 'status-confirmed activity-confirmed';
  if (s === 'Rejected') return 'status-rejected activity-rejected';
  if (s === 'ResourceConflict') return 'status-conflict activity-conflict';
  return 'status-proposed activity-proposed';
}

export default function ScheduleView() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ actId: string; open: boolean; minDate: string }>({ actId: '', open: false, minDate: '' });
  const [newDate, setNewDate] = useState('');
  const [processing, setProcessing] = useState('');

  const load = () => {
    if (!id) return;
    getBooking(id).then((d) => { setBooking(d.booking); setActivities(d.activities); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleConfirm = async (actId: string) => {
    setProcessing(actId);
    try {
      const updated = await confirmActivity(actId);
      setActivities((prev) => prev.map((a) => (a._id === actId ? updated : a)));
    } finally { setProcessing(''); }
  };

  const handleComplete = async (actId: string) => {
    setProcessing(actId);
    try {
      const updated = await completeActivity(actId);
      setActivities((prev) => prev.map((a) => (a._id === actId ? updated : a)));
    } finally { setProcessing(''); }
  };

  const handleReject = async () => {
    if (!newDate) return alert('Please select a new date');
    setProcessing(rejectModal.actId);
    try {
      await rejectActivity(rejectModal.actId, newDate);
      setRejectModal({ actId: '', open: false, minDate: '' });
      setNewDate('');
      load();
    } finally { setProcessing(''); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-bark/40 font-serif text-xl">Loading schedule…</div>;
  if (!booking) return <div className="text-red-500">Booking not found</div>;

  const confirmed = activities.filter((a) => a.status === 'Confirmed' || a.status === 'Completed');
  const totalRevenue = confirmed.reduce((s, a) => s + a.financials.revenue, 0);
  const totalCost = confirmed.reduce((s, a) => s + a.financials.cost, 0);
  const totalProfit = confirmed.reduce((s, a) => s + a.financials.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/bookings" className="text-xs text-sage font-sans hover:underline">← Back to Bookings</Link>
          <h1 className="font-serif text-3xl font-bold text-bark mt-1">{booking.farmerName}</h1>
          <p className="text-bark/50 text-sm font-sans">{booking.farmerLocation} · {booking.landSize} acres · {(booking.cropType as any)?.name}</p>
        </div>
        <span className={`status-${booking.status === 'Active' ? 'proposed' : booking.status === 'Cancelled' ? 'rejected' : 'confirmed'} text-sm`}>
          {booking.status}
        </span>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="label">Revenue</p>
          <p className="font-serif text-2xl font-bold text-sage">₹{fmt(totalRevenue)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="label">Cost</p>
          <p className="font-serif text-2xl font-bold text-clay">₹{fmt(totalCost)}</p>
        </div>
        <div className={`card p-4 text-center ${totalProfit >= 0 ? '' : 'bg-red-50'}`}>
          <p className="label">Profit</p>
          <p className={`font-serif text-2xl font-bold ${totalProfit >= 0 ? 'text-sage-dark' : 'text-red-600'}`}>₹{fmt(Math.abs(totalProfit))}</p>
          <p className={`text-xs font-sans font-semibold mt-1 ${totalProfit >= 0 ? 'text-sage-dark' : 'text-red-600'}`}>{totalProfit >= 0 ? 'Profit' : 'Loss'}</p>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-bark mb-4">Activity Timeline</h2>
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act._id} className={`card activity-card relative p-5 ${statusClass(act.status).split(' ')[1]}`}>
              <div className="flex items-center gap-4">
                {/* Step badge */}
                <div className="shrink-0 w-9 h-9 rounded-full bg-bark text-cream font-serif font-bold text-sm flex items-center justify-center">
                  {act.stepNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-sans text-base font-semibold text-bark">{act.activityName}</h3>
                    <span className="text-xs text-bark/40 font-sans">₹{fmt(act.financials.revenue / (booking.landSize || 1))}/acre</span>
                    {(act.financials.efficiency ?? 0) > 0 && (
                      <span className="text-xs text-bark/40 font-sans">| {act.financials.efficiency} acre/worker/day</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans text-bark/60 mt-2">
                    <div>
                      <span className="block uppercase tracking-wide text-bark/40">Revenue</span>
                      <span className="font-medium text-sage">₹{fmt(act.financials.revenue)}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wide text-bark/40">Start</span>
                      <span className="font-medium text-bark">{new Date(act.plannedStartDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wide text-bark/40">End</span>
                      <span className="font-medium text-bark">{new Date(act.plannedEndDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wide text-bark/40">{act.status === 'Completed' ? 'Completed In' : 'Duration'}</span>
                      <span className="font-medium text-bark">{act.financials.duration} days</span>
                    </div>

                    {(act.status === 'Confirmed' || act.status === 'Completed') ? (
                      <>
                        <div>
                          <span className="block uppercase tracking-wide text-bark/40">Cost</span>
                          <span className="font-medium text-clay">₹{fmt(act.financials.cost)}</span>
                        </div>
                        <div>
                          <span className="block uppercase tracking-wide text-bark/40">{act.financials.profit >= 0 ? 'Profit' : 'Loss'}</span>
                          <span className={`font-medium ${act.financials.profit >= 0 ? 'text-sage-dark' : 'text-red-500'}`}>₹{fmt(Math.abs(act.financials.profit))}</span>
                        </div>
                      </>
                    ) : null}
                    {act.status === 'ResourceConflict' && act.nextAvailableSlot && (
                      <div>
                        <span className="block uppercase tracking-wide text-bark/40">Next Slot</span>
                        <span className="font-medium text-purple-600">{new Date(act.nextAvailableSlot).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'Active' && (
                  <div className="flex gap-2 shrink-0 items-center">
                    {act.status === 'Completed' ? (
                      <>
                        <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 font-sans font-medium rounded">✓ Completed</span>
                        <span className="text-xs px-3 py-1.5 border border-bark/20 text-bark/60 font-sans rounded">Team {act.teamId?.name ?? '—'}</span>
                      </>
                    ) : act.status === 'Confirmed' ? (
                      <div className="flex flex-col gap-1.5 items-end">
                        <div className="flex gap-2">
                          <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 font-sans font-medium rounded">✓ Confirmed</span>
                          <span className="text-xs px-3 py-1.5 border border-bark/20 text-bark/60 font-sans rounded">Team {act.teamId?.name ?? '—'}</span>
                        </div>
                        <button
                          onClick={() => handleComplete(act._id)}
                          disabled={processing === act._id}
                          className="text-xs px-3 py-1.5 bg-blue-500 text-white font-sans hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 rounded w-full"
                        >Mark Complete</button>
                      </div>
                    ) : act.status === 'Proposed' ? (
                      <>
                        <button
                          onClick={() => handleConfirm(act._id)}
                          disabled={processing === act._id}
                          className="text-xs px-3 py-1.5 bg-sage text-white font-sans transition-all hover:bg-sage-dark active:scale-95 disabled:opacity-50"
                          style={{ borderRadius: '6px 2px 8px 2px' }}
                        >
                          ✓ Accept
                        </button>
                        {(act.rescheduleCount ?? 0) < 3 ? (
                          <button
                            onClick={() => { const minDate = new Date(act.plannedStartDate); minDate.setUTCDate(minDate.getUTCDate() + 1); setRejectModal({ actId: act._id, open: true, minDate: minDate.toISOString().split('T')[0] }); setNewDate(''); }}
                            disabled={processing === act._id}
                            className="text-xs px-3 py-1.5 border border-sage text-sage font-sans hover:bg-sage/10 transition-all active:scale-95 disabled:opacity-50"
                            style={{ borderRadius: '6px 2px 8px 2px' }}
                          >
                            ↺ {act.rescheduleCount === 2 ? 'Last Reschedule (auto-accepts)' : `Reschedule${act.rescheduleCount ? ` (${3 - act.rescheduleCount} left)` : ''}`}
                          </button>
                        ) : (
                          <span className="text-xs px-3 py-1.5 text-red-400 font-sans border border-red-200 rounded">Max reschedules reached</span>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-bark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-md w-full space-y-5">
            <h2 className="font-sans text-2xl font-bold text-bark">Reschedule Activity</h2>
            <p className="text-sm text-bark/60 font-sans">All subsequent activities will be rescheduled automatically from this new date.</p>
            <div>
              <label className="label">New Start Date</label>
              <input type="date" className="input" value={newDate} min={rejectModal.minDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={!!processing} className="btn-secondary flex-1">
                {processing ? 'Rescheduling…' : 'Reschedule'}
              </button>
              <button onClick={() => setRejectModal({ actId: '', open: false, minDate: '' })} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
