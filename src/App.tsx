import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { theme } from './theme/theme';
import { useActivityTracker } from './hooks/useActivityTracker';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/landing/LandingPage';
import { Login } from './components/auth/Login';
import Register from './pages/auth/Register';
import ConsultantSignup from './components/auth/ConsultantSignup';
import ClientSignup from './components/auth/ClientSignup';
import RoleSelection from './components/auth/RoleSelection';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Documents from './pages/Documents';
import Layout from './components/Layout';
import ForgotPassword from './components/auth/ForgotPassword';
import NewLogin from './components/auth/NewLogin';
import LiveStream from './pages/LiveStream';
import SignUp from './pages/auth/SignUp';
import PaymentSetup from './components/consultant/PaymentSetup';
import ConsultantSearch from './components/consultant/ConsultantSearch';
import ConsultantProfilePage from './components/consultant/ConsultantProfilePage';
import { SubscriptionPlans } from './components/subscription/SubscriptionPlans';

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
      <Provider store={store}>
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
        </ThemeProvider>
      </Provider>
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
