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
    
    // Manejar tanto el formato nuevo como el anterior
    let slots = [];
    
    if (response.data.success) {
      slots = response.data.data || [];
    } else {
      slots = Array.isArray(response.data) ? response.data : [];
    }
    
    setAvailableSlots(slots);
    setSelectedTime(null);
    
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
        fecha_hora_inicio: `${selectedDate.toISOString().split('T')[0]} ${selectedTime}`,        
        cliente_nombre: customerData.nombre,
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
      <div className="max-w-4xl mx-auto p-6 pt-28">
        <h1 className="text-5xl font-playfair font-bold mb-12 text-center text-acento animate-fade-in">
          Reservar Cita
        </h1>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up">
            <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">1. Selecciona el servicio</h2>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
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

          <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">2. Selecciona el barbero</h2>
            <select
              value={selectedBarber || ''}
              onChange={(e) => handleBarberChange(e.target.value)}
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
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
            <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">3. Selecciona fecha y hora</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-3 text-texto-principal">Fecha</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    filterDate={isWeekday}
                    dateFormat="dd/MM/yyyy"
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md text-texto-principal"
                    placeholderText="Selecciona una fecha"
                    inline
                    required
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium mb-3 text-texto-principal">Hora disponible</label>
                    {loading ? (
                      <p className="text-texto-secundario">Cargando horarios...</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`p-3 text-sm rounded-md transition-all duration-300 ${
                              selectedTime === slot
                                ? 'bg-acento text-fondo'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-texto-principal'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-texto-secundario">No hay horarios disponibles para esta fecha</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTime && (
            <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">4. Tus datos</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-texto-principal">Nombre completo</label>
                  <input
                    type="text"
                    value={customerData.nombre}
                    onChange={(e) => setCustomerData({...customerData, nombre: e.target.value})}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-texto-principal">Email</label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-texto-principal">Teléfono</label>
                  <input
                    type="tel"
                    value={customerData.telefono}
                    onChange={(e) => setCustomerData({...customerData, telefono: e.target.value})}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedTime || !customerData.nombre || loading}
            className={`w-full py-4 px-6 rounded-md font-semibold text-fondo transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed bg-acento hover:bg-acento-hover transform hover:scale-[1.02]`}
          >
            {loading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CheckCircleIcon className="w-16 h-16 text-acento mx-auto mb-4" />
        <h2 className="text-2xl font-playfair font-bold text-texto-principal mb-2">¡Reserva Confirmada!</h2>
        <p className="text-texto-secundario">
          Tu cita ha sido reservada con éxito. Recibirás un email de confirmación en breve.
        </p>
      </Modal>
    </>
  );
};

export default BookingPage;