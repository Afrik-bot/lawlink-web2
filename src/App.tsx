import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import { useActivityTracker } from './hooks/useActivityTracker';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

// Lazy load components
const LandingPage = React.lazy(() => import('./pages/landing/LandingPage'));
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ConsultantSignup = React.lazy(() => import('./components/auth/ConsultantSignup'));
const ClientSignup = React.lazy(() => import('./components/auth/ClientSignup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Documents = React.lazy(() => import('./pages/Documents'));
const Layout = React.lazy(() => import('./components/Layout'));
const ForgotPassword = React.lazy(() => import('./components/auth/ForgotPassword'));
const NewLogin = React.lazy(() => import('./components/auth/NewLogin'));
const LiveStream = React.lazy(() => import('./pages/LiveStream'));
const SignUp = React.lazy(() => import('./pages/auth/SignUp'));
const PaymentSetup = React.lazy(() => import('./components/consultant/PaymentSetup'));
const ConsultantSearch = React.lazy(() => import('./components/consultant/ConsultantSearch'));
const ConsultantProfilePage = React.lazy(() => import('./components/consultant/ConsultantProfilePage'));
const SubscriptionPlans = React.lazy(() => import('./components/subscription/SubscriptionPlans'));

// Placeholder components
const Profile = () => <div>Profile page coming soon!</div>;
const Appointments = () => <div>Appointments page coming soon!</div>;
const Schedule = () => <div>Schedule page coming soon!</div>;
const Consultations = () => <div>Consultations page coming soon!</div>;
const Availability = () => <div>Availability page coming soon!</div>;
const SearchConsultants = () => <div>Search Consultants page coming soon!</div>;

// AppContent component to use hooks that require AuthProvider
const AppContent = () => {
  useActivityTracker();
  
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <React.Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading...
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<NewLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/client-signup" element={<ClientSignup />} />
            <Route path="/consultant-signup" element={<ConsultantSignup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/subscription" element={<SubscriptionPlans />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><Layout><Documents /></Layout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
            <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
            <Route path="/schedule" element={<PrivateRoute><Layout><Schedule /></Layout></PrivateRoute>} />
            <Route path="/consultations" element={<PrivateRoute><Layout><Consultations /></Layout></PrivateRoute>} />
            <Route path="/availability" element={<PrivateRoute><Layout><Availability /></Layout></PrivateRoute>} />
            <Route path="/search-consultants" element={<PrivateRoute><Layout><SearchConsultants /></Layout></PrivateRoute>} />
            <Route path="/live-stream" element={<PrivateRoute><Layout><LiveStream /></Layout></PrivateRoute>} />
            <Route path="/live-stream/room/:roomId" element={<PrivateRoute><Layout><LiveStream /></Layout></PrivateRoute>} />
            <Route path="/find-consultants" element={<PrivateRoute><Layout><ConsultantSearch /></Layout></PrivateRoute>} />
            <Route path="/consultants/:consultantId" element={<PrivateRoute><Layout><ConsultantProfilePage /></Layout></PrivateRoute>} />
            <Route path="/consultant/payment-setup" element={<PrivateRoute><PaymentSetup consultantId={new URLSearchParams(window.location.search).get('consultantId') || ''} planId={new URLSearchParams(window.location.search).get('planId') || ''} /></PrivateRoute>} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </React.Suspense>
      </ThemeProvider>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
