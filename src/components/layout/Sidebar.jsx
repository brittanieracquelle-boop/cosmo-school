import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminNav = [
  { section: 'Dashboard' },
  { to: '/', icon: '⊞', label: 'Overview' },
  { section: 'Attendance' },
  { to: '/time-clock', icon: '⏱', label: 'Time Clock' },
  { to: '/attendance', icon: '\uD83D\uDCC5', label: 'Attendance Log' },
  { to: '/absences', icon: '⚠️', label: 'Absences' },
  { section: 'Academics' },
  { to: '/grades', icon: '✦', label: 'Grades' },
  { to: '/distance-ed', icon: '\uD83D\uDCBB', label: 'Distance Ed' },
  { to: '/students', icon: '\uD83D\uDC65', label: 'Students' },
  { section: 'Reporting' },
  { to: '/reports', icon: '\uD83D\uDCC4', label: 'State Reports' },
  { section: 'Tools' },
  { to: '/kiosk', icon: '\uD83D\uDDA5', label: 'Kiosk Mode' },
];

const studentNav = [
  { section: 'My Portal' },
  { to: '/student', icon: '⊞', label: 'My Dashboard', end: true },
  { to: '/student/attendance', icon: '\uD83D\uDCC5', label: 'My Attendance' },
  { to: '/student/grades', icon: '✦', label: 'My Grades' },
];

export default function Sidebar() {
  const { isAdmin, signOut } = useAuth();
  const nav = isAdmin ? adminNav : studentNav;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="school-name">Bennett School<br />of Cosmetology</div>
        <div className="school-sub">Management System</div>
      </div>

      <div className="sidebar-nav">
        {nav.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
            </NavLink>
          )
        )}
      </div>

      <div className="sidebar-footer">
        <button
          onClick={signOut}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '12px'
          }}
        >
          Sign Out
        </button>
        <div style={{ marginTop: 4 }}>BSC &bull; Decatur, AL &bull; v2.0</div>
      </div>
    </nav>
  );
}
