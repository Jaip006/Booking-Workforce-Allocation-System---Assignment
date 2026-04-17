import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BookingForm from './pages/BookingForm';
import BookingsList from './pages/BookingsList';
import ScheduleView from './pages/ScheduleView';
import TeamsView from './pages/TeamsView';

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/new" element={<BookingForm />} />
          <Route path="/bookings/:id" element={<ScheduleView />} />
          <Route path="/teams" element={<TeamsView />} />
        </Routes>
      </main>
    </div>
  );
}
