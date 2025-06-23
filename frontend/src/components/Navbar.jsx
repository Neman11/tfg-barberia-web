import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled || !isHomePage ? 'bg-fondo shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="text-2xl font-playfair font-bold text-acento">
            Barbería Premium
          </Link>
          
          <div className="flex space-x-8">
            <Link 
              to="/" 
              className="text-texto-principal hover:text-acento transition-colors duration-300"
            >
              Inicio
            </Link>
            <Link 
              to="/reservar" 
              className="text-texto-principal hover:text-acento transition-colors duration-300"
            >
              Reservar Cita
            </Link>
            <Link 
              to="/contacto" 
              className="text-texto-principal hover:text-acento transition-colors duration-300"
            >
              Contacto
            </Link>
            {user ? (
              <Link 
                to="/admin" 
                className="text-texto-principal hover:text-acento transition-colors duration-300"
              >
                Panel Admin ({user.nombre})
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="text-texto-principal hover:text-acento transition-colors duration-300"
              >
                Área Barberos
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;