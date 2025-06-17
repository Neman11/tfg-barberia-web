import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import api from '../services/api';
import Modal from '../components/Modal';

const BookingPage = () => {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerData, setCustomerData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carga inicial de servicios y barberos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recarga disponibilidad cuando cambia barbero, fecha o servicio
  useEffect(() => {
    if (selectedBarber && selectedDate && selectedService) {
      cargarDisponibilidad();
    }
  }, [selectedBarber, selectedDate, selectedService]);

  const cargarDatos = async () => {
    try {
      const [serviciosRes, barberosRes] = await Promise.all([
        api.get('/servicios'),
        api.get('/barberos')
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
    } catch (error) {
      setError('Error al cargar los datos');
    }
  };

  const cargarDisponibilidad = async () => {
    if (!selectedBarber || !selectedDate || !selectedService) return;

    try {
      setLoading(true);
      const anio = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0'); 
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const fecha = `${anio}-${mes}-${dia}`;
      const response = await api.get(`/barberos/${selectedBarber}/disponibilidad`, {
        params: { fecha, duracion: selectedService.duracion_minutos }
      });
    setAvailableSlots(response.data || []);      setSelectedTime(null);
    } catch (error) {
      setError('Error al cargar la disponibilidad');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedTime(null);
    setCustomerData({ nombre: '', email: '', telefono: '' });
    setError(null);
  };

  const handleServiceChange = (serviceId) => {
    const service = servicios.find(s => s.id === parseInt(serviceId));
    setSelectedService(service);
    setSelectedTime(null);
  };

  const handleBarberChange = (barberId) => {
    setSelectedBarber(barberId);
    setSelectedTime(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      setError('Por favor, completa todos los campos de la reserva');
      return;
    }

    try {
      setLoading(true);
      const citaData = {
        barbero_id: selectedBarber,
        servicio_id: selectedService.id,
        fecha_hora_inicio: `${selectedDate.toISOString().split('T')[0]} ${selectedTime}`,        cliente_nombre: customerData.nombre,
        cliente_email: customerData.email,
        cliente_telefono: customerData.telefono
      };

      await api.post('/citas', citaData);
      
      setIsModalOpen(true);
      resetForm();

    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  // Filtra para mostrar solo días laborables (L-S)
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0; // 0 = Domingo
  };

  // Límites de fechas para el calendario
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Reservar Cita</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">1. Selecciona el servicio</h2>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Elige un servicio...</option>
              {servicios.map(servicio => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} - {servicio.duracion_minutos} min - {servicio.precio}€
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">2. Selecciona el barbero</h2>
            <select
              value={selectedBarber || ''}
              onChange={(e) => handleBarberChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Elige un barbero...</option>
              {barberos.map(barbero => (
                <option key={barbero.id} value={barbero.id}>
                  {barbero.nombre}
                </option>
              ))}
            </select>
          </div>

          {selectedService && selectedBarber && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">3. Selecciona fecha y hora</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    filterDate={isWeekday}
                    dateFormat="dd/MM/yyyy"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholderText="Selecciona una fecha"
                    inline
                    required
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora disponible</label>
                    {loading ? (
                      <p className="text-gray-500">Cargando horarios...</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`p-2 text-sm rounded-md transition-colors ${
                              selectedTime === slot
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No hay horarios disponibles para esta fecha</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTime && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">4. Tus datos</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo</label>
                  <input
                    type="text"
                    value={customerData.nombre}
                    onChange={(e) => setCustomerData({...customerData, nombre: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={customerData.telefono}
                    onChange={(e) => setCustomerData({...customerData, telefono: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedTime || !customerData.nombre || loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700`}
          >
            {loading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
        <p className="text-gray-600">
          Tu cita ha sido reservada con éxito. Recibirás un email de confirmación en breve.
        </p>
      </Modal>
    </>
  );
};

export default BookingPage;