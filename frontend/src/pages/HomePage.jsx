import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-gray-800">
          Bienvenido a Barbería Premium
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          El mejor servicio de barbería en la ciudad
        </p>
        <Link 
          to="/reservar"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
        >
          Reservar Cita
        </Link>
      </section>

      {/* Servicios Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-8 text-center text-gray-700">
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
                <span className="text-lg font-bold text-blue-600">
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

      {/* Información Section */}
      <section className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Horario de Atención</h2>
        <p className="text-gray-600">
          Lunes a Viernes: 9:00 - 20:00<br />
          Sábados: 10:00 - 18:00<br />
          Domingos: Cerrado
        </p>
      </section>
    </div>
  );
}

export default HomePage;