import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import ToastContainer from './components/Common/Toast';
import ProtectedRoute from './components/Router/ProtectedRoute';
import Loading from './components/Common/Loading';
import { useAuth } from './contexts/AuthContext';

// Placeholder pages (we'll implement them one by one)
import Dashboard from './pages/Dashboard';
import Publicadores from './pages/Publicadores';
import Asistencias from './pages/Asistencias';
import Informes from './pages/Informes';
import Secretario from './pages/Secretario';
import Reportes from './pages/Reportes';
import Territorios from './pages/Territorios';
import Configuracion from './pages/Configuracion';
import PrecursoresAuxiliares from './pages/PrecursoresAuxiliares';

const AppContent = () => {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container" id="appContent">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/publicadores" element={<Publicadores />} />
              <Route path="/precursores-auxiliares" element={<PrecursoresAuxiliares />} />
              <Route path="/asistencias" element={<Asistencias />} />
              <Route path="/informes" element={<Informes />} />
              <Route path="/secretario" element={<Secretario />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/territorios" element={<Territorios />} />
              {isAdmin && <Route path="/configuracion" element={<Configuracion />} />}
            </Route>
          </Routes>
        </div>
      </main>
      <ToastContainer />
    </>
  );
};

const App = () => {
  return (
    <AppContent />
  );
};

export default App;
