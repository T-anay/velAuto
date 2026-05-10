import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PublicAppointment from './pages/PublicAppointment';
import Dashboard from './pages/Dashboard';
import VehicleEntry from './pages/VehicleEntry';
import ActiveJobs from './pages/ActiveJobs';
import JobOrderDetail from './pages/JobOrderDetail';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Profile from './pages/Profile';
import Expenses from './pages/Expenses';
import Staff from './pages/Staff';
import AppointmentsAdmin from './pages/AppointmentsAdmin';
import AIAnalysis from './pages/AIAnalysis';
import AISettings from './pages/AISettings';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Invoices from './pages/Invoices';
import { useService } from './context/ServiceContext';
import ToastHost from './components/ToastHost';

function AppContent() {
  const location = useLocation();
  const { user, isBootstrapping } = useService();
  const publicPages = ['/', '/login', '/public-appointment'];
  const isLoginPage = location.pathname === '/login';
  const isPublicPage = publicPages.includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <div className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full border-4 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
          <p className="text-sm uppercase tracking-[0.4em] text-gray-400">Sistem hazırlanıyor</p>
        </div>
      </div>
    );
  }

  if (!user && !isPublicPage) return <Navigate to="/" replace />;
  if (user && isPublicPage) return <Navigate to="/dashboard" replace />;

  const userRole = String(user?.role || '').toUpperCase();
  const isElevated = userRole.includes('ADMIN') || userRole.includes('SUPERADMIN');

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] font-sans">
      <ToastHost />
      {!isPublicPage && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${isLoginPage ? 'flex items-center justify-center p-6' : isLandingPage ? '' : 'p-6 md:p-8'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public-appointment" element={<PublicAppointment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicle-entry" element={<VehicleEntry />} />
          <Route path="/active-jobs" element={<ActiveJobs />} />
          <Route path="/job-detail/:id" element={<JobOrderDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/customers" element={<Customers />} />

          <Route path="/profil" element={<Profile />} />
          
          {/* Admin Only Routes */}
          <Route path="/giderler" element={isElevated ? <Expenses /> : <Navigate to="/dashboard" replace />} />
          <Route path="/personel" element={isElevated ? <Staff /> : <Navigate to="/dashboard" replace />} />
          <Route path="/randevular" element={isElevated ? <AppointmentsAdmin /> : <Navigate to="/dashboard" replace />} />
          <Route path="/ai-analiz" element={<AIAnalysis />} />
          <Route path="/ai-ayarlari" element={isElevated ? <AISettings /> : <Navigate to="/dashboard" replace />} />
          <Route path="/sistem-kayitlari" element={isElevated ? <AuditLogs /> : <Navigate to="/dashboard" replace />} />
          <Route path="/bildirimler" element={<Notifications />} />
          <Route path="/faturalar" element={isElevated ? <Invoices /> : <Navigate to="/dashboard" replace />} />
          
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
