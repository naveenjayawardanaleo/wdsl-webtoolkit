import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import { Spinner } from './components/ReportWidgets';
import Landing from './pages/Landing';
import HowItWorks from './pages/HowItWorks';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import DeveloperDashboard from './pages/DeveloperDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ReportView from './pages/ReportView';
import AdminPanel from './pages/AdminPanel';

const ROLE_HOME = { developer: '/developer', client: '/client', admin: '/admin' };

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main id="main-content" className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/developer"
              element={
                <ProtectedRoute roles={['developer']}>
                  <DeveloperDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client"
              element={
                <ProtectedRoute roles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:reportId"
              element={
                <ProtectedRoute roles={['developer', 'client', 'admin']}>
                  <ReportView />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
