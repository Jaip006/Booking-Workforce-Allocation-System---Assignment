import { useEffect, useState } from 'react';
import { getTeams, createTeam, updateTeam } from '../api';
import { Team } from '../types';

type FormState = { name: string; workerCount: string };

const emptyForm: FormState = { name: '', workerCount: '' };

export default function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getTeams().then(setTeams).finally(() => setLoading(false)); }, []);

  const openAdd = () => { setEditingTeam(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (team: Team) => { setEditingTeam(team); setForm({ name: team.name, workerCount: String(team.workerCount) }); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingTeam(null); setForm(emptyForm); setError(''); };

  const handleSave = async () => {
    const workerCount = Number(form.workerCount);
    if (!form.name.trim()) return setError('Team name is required');
    if (!workerCount || workerCount < 1) return setError('Worker count must be at least 1');
    setSaving(true);
    setError('');
    try {
      if (editingTeam) {
        const updated = await updateTeam(editingTeam._id, { name: form.name.trim(), workerCount });
        setTeams((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      } else {
        const created = await createTeam({ name: form.name.trim(), workerCount });
        setTeams((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-bark/40 font-serif text-xl">Loading teams…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-bark">Workforce Teams</h1>
          <p className="text-bark/50 text-sm font-sans mt-1">{teams.length} teams · Fixed pool</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Team</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
          const isUnavailable = team.schedule.some(
            (s) => new Date(s.startDate) <= todayEnd && new Date(s.endDate) >= todayStart
          );
          const activeSchedule = team.schedule
            .filter((s) => new Date(s.endDate) >= todayStart)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 3)
            .map((s) => ({ ...s, isOngoing: new Date(s.startDate) <= todayEnd }));

          return (
            <div key={team._id} className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sage text-white rounded-full flex items-center justify-center font-serif text-lg font-bold">
                  {team.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-bark">{team.name}</h3>
                  </div>
                  <p className="text-xs text-bark/50 font-sans">{team.workerCount} workers · Daily wage ₹500/worker</p>
                </div>
                <button onClick={() => openEdit(team)} className="text-xs text-sage hover:text-sage-dark font-sans underline">Edit</button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div className="bg-cream-dark rounded-lg p-3 text-center">
                  <p className="text-bark/50 text-xs">Total Jobs</p>
                  <p className="font-bold font-serif text-xl text-bark">{team.schedule.length}</p>
                </div>
                <div className="bg-cream-dark rounded-lg p-3 text-center">
                  <p className="text-bark/50 text-xs">Total Team Wage</p>
                  <p className="font-bold font-serif text-xl text-sage">
                    ₹
                    {team.workerCount * 500}/day</p>
                </div>
                
              </div>

              {activeSchedule.length > 0 && (
                <div>
                  <div className="space-y-1.5">
                    {activeSchedule.map((s, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-sans bg-cream rounded px-2 py-1.5">
                        <span className="text-bark/60">{new Date(s.startDate).toLocaleDateString('en-IN')}</span>
                        <span className="text-bark/40">→</span>
                        <span className="text-bark/60">{new Date(s.endDate).toLocaleDateString('en-IN')}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.isOngoing ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {s.isOngoing ? 'Ongoing' : 'Upcoming'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
               
              <div className="text-center text-bark/30 text-sm font-sans py-2">
              {isUnavailable ? (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 font-sans font-medium rounded-full">Unavailable</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 font-sans font-medium rounded-full">Available</span>
                    )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-8 w-full max-w-md space-y-5">
            <h2 className="font-serif text-2xl font-bold text-bark">{editingTeam ? 'Edit Team' : 'Add Team'}</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Team Name</label>
                <input
                  className="input"
                  placeholder="e.g. Alpha Squad"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Worker Count</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={form.workerCount}
                  onChange={(e) => setForm((f) => ({ ...f, workerCount: e.target.value }))}
                />
              </div>
              {error && <p className="text-red-500 text-sm font-sans">{error}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editingTeam ? 'Save Changes' : 'Add Team'}
              </button>
              <button onClick={closeModal} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
