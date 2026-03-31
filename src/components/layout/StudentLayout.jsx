import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles = {
  '/student': 'My Dashboard',
  '/student/attendance': 'My Attendance',
  '/student/grades': 'My Grades',
};

export default function StudentLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || 'My Dashboard';

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
