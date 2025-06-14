import { useState, useEffect } from 'react';
import api from '../services/api';

function HomePage() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Barbería Premium
        </h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Nuestros Servicios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <div
                key={servicio.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  {servicio.nombre}
                </h3>
                <p className="text-gray-600 mb-4">
                  {servicio.descripcion || 'Servicio profesional de barbería'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-barberia-600">
                    €{servicio.precio}
                  </span>
                  <span className="text-sm text-gray-500">
                    {servicio.duracion_minutos} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;