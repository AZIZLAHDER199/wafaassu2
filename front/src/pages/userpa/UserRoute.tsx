import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A protected route component that only checks if a user is logged in.
 * It allows access to both regular users and admins.
 * If not logged in, it redirects to the /login page.
 */
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');

  // If there is no token, the user is not logged in. Redirect them.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If a token exists, allow access to the page for ANY user (admin or not).
  return <>{children}</>;
};

export default UserRoute;