import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { StreakProvider } from '@/contexts/StreakContext.jsx';
import { GamificationProvider } from '@/contexts/GamificationContext.jsx';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';

// Eager-loaded (critical path)
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage.jsx';
import PasswordResetPage from '@/pages/PasswordResetPage.jsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage.jsx';
import WelcomePage from '@/pages/WelcomePage.jsx';

// Lazy-loaded (route splitting)
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const ModeSelectionPage = lazy(() => import('@/pages/ModeSelectionPage.jsx'));
const AnalyzerPage = lazy(() => import('@/pages/AnalyzerPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage.jsx'));
const SwitchModePage = lazy(() => import('@/pages/SwitchModePage.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
const AdminPage = lazy(() => import('@/pages/AdminPage.jsx'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage.jsx'));
const InterviewPage = lazy(() => import('@/pages/InterviewPage.jsx'));
const CodeBreakPage = lazy(() => import('@/pages/CodeBreakPage.jsx'));

// ScrollToTop Component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout for protected routes
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-animated">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isMobileMenuOpen={isSidebarOpen} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 lg:pl-72 overflow-x-hidden transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

// Animated Route Wrapper
const AnimatedRoute = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-full"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedRoute><LoginPage /></AnimatedRoute>} />
        <Route path="/signup" element={<AnimatedRoute><SignupPage /></AnimatedRoute>} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/password-reset" element={<AnimatedRoute><PasswordResetPage /></AnimatedRoute>} />
        <Route path="/reset-password/:token" element={<AnimatedRoute><ResetPasswordPage /></AnimatedRoute>} />
        <Route path="/welcome" element={<ProtectedRoute><AnimatedRoute><WelcomePage /></AnimatedRoute></ProtectedRoute>} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout><AnimatedRoute><HomePage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/mode-selection" element={<ProtectedRoute><AppLayout><AnimatedRoute><ModeSelectionPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/analyzer" element={<ProtectedRoute><AppLayout><AnimatedRoute><AnalyzerPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><AnimatedRoute><DashboardPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AppLayout><AnimatedRoute><HistoryPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/switch-mode" element={<ProtectedRoute><AppLayout><AnimatedRoute><SwitchModePage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><AnimatedRoute><SettingsPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><AnimatedRoute><ProfilePage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AppLayout><AnimatedRoute><AdminPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><AppLayout><AnimatedRoute><InterviewPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><AnimatedRoute><LeaderboardPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        <Route path="/code-break" element={<ProtectedRoute><AppLayout><AnimatedRoute><CodeBreakPage /></AnimatedRoute></AppLayout></ProtectedRoute>} />
        
        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-glass max-w-md"
            >
              <h1 className="text-4xl font-bold mb-4 text-gradient">404</h1>
              <p className="text-muted-foreground mb-6">Page not found</p>
              <a href="/" className="btn-primary inline-block">Return Home</a>
            </motion.div>
          </div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// Page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StreakProvider>
            <GamificationProvider>
            <Router>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
              </Suspense>
              <Toaster position="top-right" richColors />
            </Router>
            </GamificationProvider>
          </StreakProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;