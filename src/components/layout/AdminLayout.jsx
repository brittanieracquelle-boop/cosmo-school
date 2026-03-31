import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles = {
  '/': 'Overview',
  '/time-clock': 'Time Clock',
  '/attendance': 'Attendance Log',
  '/absences': 'Absences & Tardies',
  '/grades': 'Grades',
  '/distance-ed': 'Distance Education',
  '/students': 'Student Roster',
  '/reports': 'State Reports',
};

export default function AdminLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Overview';

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar title={title} />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
