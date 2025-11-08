import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../api/authService';

const ProtectedRoute = () => {
    const user = authService.getCurrentUser();

    if (!user) {
        // If no user is logged in, redirect to the login page
        return <Navigate to="/login" />;
    }

    // If user is logged in, render the child components (the main app layout)
    return <Outlet />;
};

export default ProtectedRoute;