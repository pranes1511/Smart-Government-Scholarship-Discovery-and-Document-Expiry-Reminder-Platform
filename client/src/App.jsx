import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import SchemeDiscovery from './pages/SchemeDiscovery';
import SchemeDetails from './pages/SchemeDetails';
import EligibilityAnalysis from './pages/EligibilityAnalysis';
import DocumentTracker from './pages/DocumentTracker';
import DocumentReadiness from './pages/DocumentReadiness';
import SchemeComparison from './pages/SchemeComparison';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';


function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <div className="main-content flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/schemes" element={<SchemeDiscovery />} />
              <Route path="/schemes/:id" element={<SchemeDetails />} />
              <Route path="/compare" element={<SchemeComparison />} />

              {/* Protected Student Portal Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/eligibility-analysis"
                element={
                  <ProtectedRoute requiredRole="student">
                    <EligibilityAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/eligibility-analysis/:schemeId"
                element={
                  <ProtectedRoute requiredRole="student">
                    <EligibilityAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute requiredRole="student">
                    <DocumentTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/readiness"
                element={
                  <ProtectedRoute requiredRole="student">
                    <DocumentReadiness />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/readiness/:schemeId"
                element={
                  <ProtectedRoute requiredRole="student">
                    <DocumentReadiness />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Protected Administrator Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
