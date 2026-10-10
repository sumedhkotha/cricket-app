import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminPlayers } from './pages/admin/AdminPlayers';
import { AdminCoaches } from './pages/admin/AdminCoaches';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminEbooks } from './pages/admin/AdminEbooks';

// Coach Pages
import { CoachOverview } from './pages/coach/CoachOverview';
import { CoachPending } from './pages/coach/CoachPending';
import { CoachReviewDetail } from './pages/coach/CoachReviewDetail';
import { CoachCompleted } from './pages/coach/CoachCompleted';
import { CoachEarnings } from './pages/coach/CoachEarnings';
import { CoachRatings } from './pages/coach/CoachRatings';
import { CoachMessages } from './pages/coach/CoachMessages';
import { CoachProfile } from './pages/coach/CoachProfile';

// Player Pages
import { PlayerOverview } from './pages/player/PlayerOverview';
import { PlayerReviews } from './pages/player/PlayerReviews';
import { PlayerSubmit } from './pages/player/PlayerSubmit';
import { PlayerSubscription } from './pages/player/PlayerSubscription';
import { PlayerPlans } from './pages/player/PlayerPlans';
import { PlayerEbooks } from './pages/player/PlayerEbooks';
import { PlayerCheckout } from './pages/player/PlayerCheckout';
import { PlayerLibrary } from './pages/player/PlayerLibrary';
import { PlayerMessages } from './pages/player/PlayerMessages';
import { PlayerProfile } from './pages/player/PlayerProfile';
import { PlayerCricketHub } from './pages/player/PlayerCricketHub';

// Coaches Directory & Announcements
import { CoachDirectory } from './pages/coaches/CoachDirectory';
import { CoachAnnouncements } from './pages/coach/CoachAnnouncements';
import { PlayerAnnouncements } from './pages/player/PlayerAnnouncements';

const RootRedirect = () => {
  const { user, isAuthenticated, loading, role } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]">
        <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated && role) {
    return <Navigate to={`/${role}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/coaches-directory"
            element={
              <ProtectedRoute allowedRole="admin">
                <CoachDirectory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminPlayers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coaches"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminCoaches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminSubscriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ebooks"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminEbooks />
              </ProtectedRoute>
            }
          />

          {/* Coach Routes */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/announcements"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/coaches"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachDirectory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/pending"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachPending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/review/:id"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachReviewDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/completed"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachCompleted />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/earnings"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/ratings"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachRatings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/messages"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/profile"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachProfile />
              </ProtectedRoute>
            }
          />

          {/* Player Routes */}
          <Route
            path="/player"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/coaches"
            element={
              <ProtectedRoute allowedRole="player">
                <CoachDirectory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/announcements"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/reviews"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/submit"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerSubmit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/subscription"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerSubscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/cricket"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerCricketHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/plans"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/ebooks"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerEbooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/checkout"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerCheckout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/library"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/messages"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/profile"
            element={
              <ProtectedRoute allowedRole="player">
                <PlayerProfile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
