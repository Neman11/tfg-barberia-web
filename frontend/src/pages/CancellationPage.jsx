import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function PaginaCancelacion() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('confirming');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMensaje('Token de cancelación no encontrado o inválido.');
      setError(true);
      setStatus('finished');
    }
  }, [token]);

  const handleConfirmarCancelacion = useCallback(async () => {
    if (!token) return;

    setStatus('processing');

    try {
      // La API devuelve el mensaje correcto si la cita ya estaba cancelada o si se cancela ahora
      const response = await api.post(`/citas/cancelar/${token}`); 
      setMensaje(response.data.message); 
      setError(false);
    } catch (err) {
      setMensaje(err.response?.data?.message || 'Ocurrió un error al intentar cancelar la cita.'); 
      setError(true);
    } finally {
      setStatus('finished'); 
    }
  }, [token]);

  return (
    // Se ajusta el contenedor para que ocupe toda la altura y centre el contenido
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full mx-auto bg-zinc-900 shadow-lg rounded-lg p-8 text-center border border-zinc-700">
        
        {status === 'confirming' && (
          <>
            <h3 className="mb-4">Confirmar Cancelación</h3>
            <p className="mb-6">¿Estás seguro de que deseas cancelar tu cita? Esta acción no se puede deshacer.</p>
            <button 
              onClick={handleConfirmarCancelacion}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-zinc-900 transition-colors w-full sm:w-auto"
            >
              Sí, Cancelar mi Cita
            </button>
          </>
        )}

        {status === 'processing' && (
          <>
            <h3 className="mb-4">Procesando...</h3>
            <p>Por favor, espera un momento mientras procesamos tu solicitud.</p>
          </>
        )}

        {status === 'finished' && (
          <>
            <h3 className={`mb-4 ${error ? 'text-red-500' : 'text-texto-principal'}`}>
              {error ? 'Error en la Cancelación' : 'Proceso Finalizado'}
            </h3>
            <p className="mb-6">{mensaje}</p>
            <Link 
              to="/" 
              className="inline-block bg-acento text-fondo px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
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