import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // This is a basic loading state. You might want to implement a more
    // sophisticated global loading spinner or skeleton screen.
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If children are provided (e.g. for wrapping specific routes like Layout), render children.
  // Otherwise, render Outlet for nested routes.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
