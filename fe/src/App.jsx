import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleEntry from './pages/VehicleEntry';
import ActiveJobs from './pages/ActiveJobs';
import JobOrderDetail from './pages/JobOrderDetail';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Cashier from './pages/Cashier';
import Profile from './pages/Profile';
import Expenses from './pages/Expenses';
import Staff from './pages/Staff';
import AppointmentsAdmin from './pages/AppointmentsAdmin';
import AIAnalysis from './pages/AIAnalysis';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Invoices from './pages/Invoices';
import { useService } from './context/ServiceContext';
import ToastHost from './components/ToastHost';

function AppContent() {
  const location = useLocation();
  const { user, isBootstrapping } = useService();
  const isLoginPage = location.pathname === '/';

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

  if (!user && !isLoginPage) return <Navigate to="/" replace />;
  if (user && isLoginPage) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] font-sans">
      <ToastHost />
      {!isLoginPage && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${isLoginPage ? 'flex items-center justify-center p-6' : 'p-6 md:p-8'}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicle-entry" element={<VehicleEntry />} />
          <Route path="/active-jobs" element={<ActiveJobs />} />
          <Route path="/job-detail/:id" element={<JobOrderDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/giderler" element={<Expenses />} />
          <Route path="/personel" element={<Staff />} />
          <Route path="/randevular" element={<AppointmentsAdmin />} />
          <Route path="/ai-analiz" element={<AIAnalysis />} />
          <Route path="/sistem-kayitlari" element={<AuditLogs />} />
          <Route path="/bildirimler" element={<Notifications />} />
          <Route path="/faturalar" element={<Invoices />} />
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