import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ContactPage from './pages/ContactPage';
import CancellationPage from './pages/CancellationPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas con Layout (navbar) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="reservar" element={<BookingPage />} />
            <Route path="contacto" element={<ContactPage />} />
            <Route path="/cancelar-cita" element={<CancellationPage/>} />
          </Route>
          
          {/* Ruta de login sin Layout */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;