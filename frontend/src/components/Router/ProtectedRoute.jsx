import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const toastShown = useRef(false);

    useEffect(() => {
        if (!loading && !isAuthenticated() && !toastShown.current) {
            toastShown.current = true;
            // Only show toast if we are accessing a protected route directly, not when logging out
            // We use a small timeout so that if Navbar redirects before logout, it cancels
            const timer = setTimeout(() => {
                showToast('Debes iniciar sesión para acceder a esta sección', 'warning');
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [loading, isAuthenticated, showToast]);

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    if (!isAuthenticated()) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
