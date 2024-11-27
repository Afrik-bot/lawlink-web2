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
import { useAuth } from './hooks/useAuth';

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

// Placeholder components
const Profile = () => <div>Profile page coming soon!</div>;
const Appointments = () => <div>Appointments page coming soon!</div>;
const Schedule = () => <div>Schedule page coming soon!</div>;
const Consultations = () => <div>Consultations page coming soon!</div>;
const Availability = () => <div>Availability page coming soon!</div>;
const SearchConsultants = () => <div>Search Consultants page coming soon!</div>;

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  useActivityTracker(); // Add activity tracking
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

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/consultations" element={<Consultations />} />
                <Route path="/availability" element={<Availability />} />
                <Route path="/search-consultants" element={<SearchConsultants />} />
                <Route path="/live-stream" element={<LiveStream />} />
                <Route path="/live-stream/room/:roomId" element={<LiveStream />} />
              </Route>
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </Provider>
    </div>
  );
}

export default App;
