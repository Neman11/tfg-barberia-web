import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="animate-fade-in">
          <h2 className="mt-6 text-center text-4xl font-playfair font-bold text-acento">
            Área de Barberos
          </h2>
          <p className="mt-2 text-center text-sm text-texto-secundario">
            Inicia sesión para acceder al panel de administración
          </p>
        </div>
        
        <form className="mt-8 space-y-6 animate-fade-in-up" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-zinc-900 border border-zinc-700 placeholder-texto-secundario text-texto-principal rounded-t-md focus:outline-none focus:ring-acento focus:border-acento focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-zinc-900 border border-zinc-700 placeholder-texto-secundario text-texto-principal rounded-b-md focus:outline-none focus:ring-acento focus:border-acento focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-fondo bg-acento hover:bg-acento-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-acento disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/" className="text-sm text-acento hover:text-acento-hover transition-colors">
              Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;