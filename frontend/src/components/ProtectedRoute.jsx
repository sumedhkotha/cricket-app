import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]">
        <div className="w-12 h-12 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redirect to their respective home dashboard
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
};
