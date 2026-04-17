import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/bookings/new', label: '+ New Booking' },
  { to: '/teams', label: 'Teams' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-bark text-cream shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
        <Link to="/dashboard" className="font-serif text-xl font-bold text-clay tracking-wide shrink-0">
          🌾 AgriERP
        </Link>
        <div className="flex gap-2 flex-wrap">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-1.5 text-sm font-sans transition-all duration-150 ${
                pathname === l.to
                  ? 'bg-sage text-white'
                  : 'text-cream/70 hover:text-cream hover:bg-white/10'
              }`}
              style={{ borderRadius: '6px 2px 8px 2px' }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
