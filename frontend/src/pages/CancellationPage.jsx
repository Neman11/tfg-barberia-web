import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function PaginaCancelacion() {
  const [searchParams] = useSearchParams();
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMensaje('Token de cancelación no encontrado.');
      setError(true);
      setLoading(false);
      return;
    }

    const cancelarCita = async () => {
      try {
        const response = await api.post(`/citas/cancelar/${token}`);
        setMensaje(response.data.message);
        setError(false);
      } catch (err) {
        setMensaje(err.response?.data?.message || 'Ocurrió un error al intentar cancelar la cita.');
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    cancelarCita();
  }, [searchParams]);

  // El return ahora es mucho más simple
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
        {loading ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Procesando...</h1>
            <p className="text-gray-700">Por favor, espera un momento mientras procesamos tu solicitud.</p>
          </>
        ) : (
          <>
            <h1 className={`text-2xl font-bold mb-4 ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'Error en la Cancelación' : 'Proceso Finalizado'}
            </h1>
            <p className="text-gray-700 mb-6">{mensaje}</p>
            <Link 
              to="/" 
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver a la Página Principal
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PaginaCancelacion;