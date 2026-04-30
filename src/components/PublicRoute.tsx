import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component to handle authentication redirection for public pages
 * If user is already authenticated, redirect to dashboard
 * Otherwise, render the children (login/register pages)
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (currentUser) {
    console.log('User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }

  // Otherwise render the login/register page
  return <>{children}</>;
};

export default PublicRoute; 