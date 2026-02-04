import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    if (!isAuthenticated()) {
        showToast('Debes iniciar sesión para acceder a esta sección', 'warning');
        return <Navigate to="/" state={{ from: location }} replace />;
        // Note: We might want to trigger the auth modal instead of redirecting to home,
        // but for now redirecting to home (where we can trigger modal) is safer.
        // Actually, let's just render the Outlet but trigger the modal via a side effect?
        // No, standard pattern is redirect or show login page.
        // Given our design has a modal login, maybe we just redirect to home
    }

    return <Outlet />;
};

export default ProtectedRoute;
