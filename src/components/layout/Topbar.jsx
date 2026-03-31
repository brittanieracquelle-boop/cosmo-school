import { useLiveClock } from '../../hooks/useLiveClock';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title }) {
  const now = useLiveClock();
  const { profile, isAdmin } = useAuth();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const displayName = profile?.display_name || (isAdmin ? 'Admin' : 'Student');
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="topbar-time">{timeStr}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{displayName}</span>
        </div>
      </div>
    </div>
  );
}
