import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

import authService from './api/authService';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ScheduleTable from './components/ScheduleTable';
import SchedulerPage from './components/SchedulerPage';
import UserManagement from './components/UserManagement'; // <-- RENAMED
import ModuleManagement from './components/ModuleManagement';
import CenterManagement from './components/CenterManagement';
import ProgramManagement from './components/ProgramManagement';
import BatchManagement from './components/BatchManagement';
import Reports from './components/Reports'; 
import './App.css';

// The AppLayout component with updated navigation links
const AppLayout = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isScheduler = currentUser && currentUser.role === 'scheduler';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-container">
      <header className="modern-navbar">
        <div className="navbar-container">
          {/* Brand Section */}
          <div className="navbar-brand">
            <img 
              src="/HI_RES_ETASHA_OFFICIAL_LOGO.png" 
              alt="ETASHA Logo" 
              className="brand-logo"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav desktop-nav">
            <Link to="/scheduler" className="nav-link">
              <span className="nav-icon">📅</span>
              <span className="nav-text">Calendar</span>
            </Link>
            <Link to="/published-schedule" className="nav-link">
              <span className="nav-icon">📋</span>
              <span className="nav-text">Schedule</span>
            </Link>
            {isScheduler && (
              <>
                <Link to="/batches" className="nav-link">
                  <span className="nav-icon">📚</span>
                  <span className="nav-text">Batches</span>
                </Link>
                <Link to="/modules" className="nav-link">
                  <span className="nav-icon">🎓</span>
                  <span className="nav-text">Courses</span>
                </Link>
                <Link to="/trainers" className="nav-link">
                  <span className="nav-icon">👩‍🏫</span>
                  <span className="nav-text">Teachers</span>
                </Link>
                <Link to="/centers" className="nav-link">
                  <span className="nav-icon">🏢</span>
                  <span className="nav-text">Centers</span>
                </Link>
                <Link to="/reports" className="nav-link">
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Reports</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="navbar-actions">
            {currentUser && (
              <div className="user-profile">
                <div className="user-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.name || 'User'}</span>
                  <span className="user-role">{currentUser.role}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/scheduler" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="nav-icon">📅</span>
            <span className="nav-text">Calendar View</span>
          </Link>
          <Link to="/published-schedule" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="nav-icon">📋</span>
            <span className="nav-text">Weekly Schedule</span>
          </Link>
          {isScheduler && (
            <>
              <Link to="/batches" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-icon">📚</span>
                <span className="nav-text">Batches</span>
              </Link>
              <Link to="/modules" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-icon">🎓</span>
                <span className="nav-text">Courses</span>
              </Link>
              <Link to="/trainers" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-icon">👩‍🏫</span>
                <span className="nav-text">Teachers</span>
              </Link>
              <Link to="/centers" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-icon">🏢</span>
                <span className="nav-text">Centers</span>
              </Link>
              <Link to="/reports" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">Reports</span>
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-content">
        <Routes>
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/published-schedule" element={<ScheduleTable />} />
          <Route path="/trainers" element={<UserManagement />} /> {/* <-- CORRECTED */}
          <Route path="/batches" element={<BatchManagement />} />
          <Route path="/programs" element={<ProgramManagement />} />
          <Route path="/modules" element={<ModuleManagement />} />
          <Route path="/centers" element={<CenterManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route index element={<SchedulerPage />} /> 
        </Routes>
      </main>
    </div>
  );
};

// Main App component remains the same
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;