import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import TimeClock from './pages/admin/TimeClock';
import AttendanceLog from './pages/admin/AttendanceLog';
import Absences from './pages/admin/Absences';
import Grades from './pages/admin/Grades';
import DistanceEd from './pages/admin/DistanceEd';
import StudentRoster from './pages/admin/StudentRoster';
import StateReports from './pages/admin/StateReports';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentGrades from './pages/student/StudentGrades';
import KioskPage from './pages/kiosk/KioskPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#8A8A8E' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/student" replace />;
  return children;
}

function RequireStudent({ children }) {
  const { isStudent, loading } = useAuth();
  if (loading) return null;
  if (!isStudent) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kiosk" element={<KioskPage />} />

      {/* Admin routes */}
      <Route element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/time-clock" element={<TimeClock />} />
        <Route path="/attendance" element={<AttendanceLog />} />
        <Route path="/absences" element={<Absences />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/distance-ed" element={<DistanceEd />} />
        <Route path="/students" element={<StudentRoster />} />
        <Route path="/reports" element={<StateReports />} />
      </Route>

      {/* Student routes */}
      <Route element={<RequireAuth><RequireStudent><StudentLayout /></RequireStudent></RequireAuth>}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/grades" element={<StudentGrades />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: 'white',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
