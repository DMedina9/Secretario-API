import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../Auth/AuthModal';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const nav = document.getElementById('navbar');
            if (nav && !nav.contains(event.target) && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav className="navbar" id="navbar">
                <div className="container navbar-content">
                    <div className="navbar-brand">
                        <img src="/logo.png" alt="Secretario Logo" className="navbar-logo" />
                        <span>Secretario</span>
                    </div>

                    <button
                        className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu();
                        }}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} id="navMenu">
                        <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Inicio</NavLink></li>
                        <li><NavLink to="/publicadores" className={({ isActive }) => isActive ? "active" : ""}>Publicadores</NavLink></li>
                        <li><NavLink to="/asistencias" className={({ isActive }) => isActive ? "active" : ""}>Asistencias</NavLink></li>
                        <li><NavLink to="/informes" className={({ isActive }) => isActive ? "active" : ""}>Informes</NavLink></li>
                        <li><NavLink to="/secretario" className={({ isActive }) => isActive ? "active" : ""}>Servicios</NavLink></li>
                        <li><NavLink to="/fillpdf" className={({ isActive }) => isActive ? "active" : ""}>Reportes</NavLink></li>
                        <li><NavLink to="/territorios" className={({ isActive }) => isActive ? "active" : ""}>Territorios</NavLink></li>
                        <li><NavLink to="/configuracion" className={({ isActive }) => isActive ? "active" : ""}>Configuración</NavLink></li>
                    </ul>

                    <div className="navbar-actions">
                        {isAuthenticated() ? (
                            <>
                                <div className="user-info" id="userInfo">
                                    <div className="user-avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
                                    <span className="hidden-mobile">{user?.username || 'Usuario'}</span>
                                </div>
                                <button className="btn btn-secondary btn-sm" id="logoutBtn" onClick={handleLogout} title="Cerrar Sessión">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" x2="9" y1="12" y2="12" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-primary btn-sm" id="loginBtn" onClick={() => setIsAuthModalOpen(true)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" x2="3" y1="12" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
};

export default Navbar;
