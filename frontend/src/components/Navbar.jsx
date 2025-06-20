import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Barbería Premium
          </Link>
          
          <div className="flex space-x-6">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              Inicio
            </Link>
            <Link to="/reservar" className="hover:text-gray-300 transition-colors">
              Reservar Cita
            </Link>
            {user ? (
              <Link to="/admin" className="hover:text-gray-300 transition-colors">
                Panel Admin ({user.nombre})
              </Link>
            ) : (
              <Link to="/login" className="hover:text-gray-300 transition-colors">
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