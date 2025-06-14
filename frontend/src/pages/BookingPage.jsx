import { useState, useEffect } from 'react';
import api from '../services/api';

function BookingPage() {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState('');
  const [selectedBarbero, setSelectedBarbero] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serviciosRes, barberosRes] = await Promise.all([
        api.get('/servicios'),
        api.get('/barberos')
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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
      <h1 className="text-3xl font-bold mb-8 text-center">Reservar Cita</h1>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        {/* Paso 1: Seleccionar Servicio */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Selecciona un servicio</h2>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedServicio}
            onChange={(e) => setSelectedServicio(e.target.value)}
          >
            <option value="">-- Selecciona un servicio --</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre} - €{servicio.precio} ({servicio.duracion_minutos} min)
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2: Seleccionar Barbero */}
        {selectedServicio && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Selecciona un barbero</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barberos.map((barbero) => (
                <div
                  key={barbero.id}
                  onClick={() => setSelectedBarbero(barbero.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedBarbero === barbero.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <h3 className="font-semibold">{barbero.nombre}</h3>
                  <p className="text-sm text-gray-600">{barbero.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Próximamente - Selección de fecha y hora */}
        {selectedServicio && selectedBarbero && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">3. Selecciona fecha y hora</h2>
            <div className="p-8 bg-gray-100 rounded-lg text-center text-gray-600">
              <p>Próximamente: Sistema de calendario para selección de fecha y hora</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;