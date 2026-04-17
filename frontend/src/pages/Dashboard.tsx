import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';
import { DashboardData } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`card p-5 ${accent}`}>
      <p className="label">{label}</p>
      <p className="font-serif text-3xl font-bold text-bark mt-1">{value}</p>
      {sub && <p className="text-xs text-bark/50 mt-1 font-sans">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.error || err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-bark/40 font-serif text-xl">Loading harvest data…</div>;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-red-500 font-sans">{error || 'Failed to load dashboard'}</p>
      <p className="text-bark/40 text-sm font-sans">Make sure the backend server is running on port 5000 and MongoDB is connected.</p>
    </div>
  );

  const { summary, bottleneckAlert, bottleneckTeams, recentBookings, teamUtilization } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-bark">Executive Overview</h1>
          <p className="text-bark/50 font-sans text-sm mt-1">Agricultural Operations Dashboard</p>
        </div>
      </div>

      {bottleneckAlert && (
        <div className="bg-red-50 border border-red-200 rounded-organic p-4 flex items-start gap-3">
          <span className="text-red-500 text-2xl">⚠️</span>
          <div>
            <p className="font-serif font-semibold text-red-800">Bottleneck Alert</p>
            <p className="text-sm text-red-700 mt-0.5">
              {bottleneckTeams.map((t) => t.name).join(', ')} {bottleneckTeams.length === 1 ? 'is' : 'are'} overloaded with {bottleneckTeams.map((t) => t.scheduleCount).join('/')} scheduled jobs.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
          <StatCard label="Total Bookings" value={fmt(summary.totalBookings)} />
          <StatCard label="Active" value={fmt(summary.activeBookings)} accent="border-l-4 border-sage" />
          <StatCard label="Resource Conflicts" value={fmt(summary.resourceConflicts)} accent="border-l-4 border-purple-400" sub="Activities unallocated" />
          <StatCard label="Confirmed Acts." value={fmt(summary.confirmedActivities)} accent="border-l-4 border-green-400" />
          <StatCard label="Proposed Acts." value={fmt(summary.proposedActivities)} accent="border-l-4 border-amber-400" />
        </div>
        <Link to="/bookings/new" className="btn-primary shrink-0">New Booking</Link>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 md:col-span-1">
          <p className="label">Total Projected Revenue</p>
          <p className="font-serif text-3xl font-bold text-sage">₹{fmt(summary.totalRevenue)}</p>
        </div>
        <div className="card p-6">
          <p className="label">Total Operational Cost</p>
          <p className="font-serif text-3xl font-bold text-clay">₹{fmt(summary.totalCost)}</p>
        </div>
        <div className={`card p-6 ${summary.totalProfit >= 0 ? 'bg-sage/5' : 'bg-red-50'}`}>
          <p className="label">Net Projected Profit</p>
          <p className={`font-serif text-3xl font-bold ${summary.totalProfit >= 0 ? 'text-sage-dark' : 'text-red-600'}`}>
            ₹{fmt(summary.totalProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Utilization */}
        <div className="card p-6">
          <h2 className="font-serif text-xl font-semibold text-bark mb-4">Team Utilization</h2>
          <div className="space-y-3">
            {teamUtilization.map((t) => {
              const pct = Math.min((t.scheduledJobs / 20) * 100, 100);
              return (
                <div key={t.teamId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-sans font-medium text-bark">{t.name}</span>
                    <span className="text-xs text-bark/50 font-sans">{t.workerCount} workers · {t.scheduledJobs} jobs</span>
                  </div>
                  <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-clay' : 'bg-sage'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-xl font-semibold text-bark">Recent Bookings</h2>
            <Link to="/bookings" className="text-xs text-sage hover:underline font-sans">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <Link key={b._id} to={`/bookings/${b._id}`} className="flex items-center justify-between py-2 border-b border-cream-dark last:border-0 hover:opacity-80 transition-opacity">
                <div>
                  <p className="text-sm font-medium font-sans text-bark">{b.farmerName}</p>
                  <p className="text-xs text-bark/50 font-sans">{b.farmerLocation} · {b.landSize} acres · {(b.cropType as any)?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold font-sans ${b.projectedProfit >= 0 ? 'text-sage' : 'text-red-500'}`}>
                    ₹{fmt(b.projectedProfit)}
                  </p>
                  <span className={`status-${b.status === 'Active' ? 'proposed' : b.status === 'Cancelled' ? 'rejected' : 'confirmed'}`}>
                    {b.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
