import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/datepicker-dark.css';

import api from '../services/api';
import Modal from '../components/Modal';

const BookingPage = () => {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerData, setCustomerData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto mejorado para cargar disponibilidad
  useEffect(() => {
    if (selectedBarber && selectedDate && selectedService) {
      cargarDisponibilidad();
    } else {
      // Limpiar slots si faltan datos
      setAvailableSlots([]);
      setSelectedTime(null);
    }
  }, [selectedBarber, selectedDate, selectedService]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [serviciosRes, barberosRes] = await Promise.all([
        api.get('/servicios'),
        api.get('/barberos')
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos iniciales. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const cargarDisponibilidad = async () => {
    if (!selectedBarber || !selectedDate || !selectedService) return;

    setAvailabilityLoading(true);
    setError(null);
    setAvailableSlots([]);
    setSelectedTime(null);

    try {
      // Formatear fecha correctamente
      const fecha = selectedDate.toISOString().split('T')[0];
      
      console.log('Cargando disponibilidad para:', {
        barbero: selectedBarber,
        fecha: fecha,
        duracion: selectedService.duracion_minutos
      });
      
      const response = await api.get(`/barberos/${selectedBarber}/disponibilidad`, {
        params: { 
          fecha: fecha, 
          duracion: selectedService.duracion_minutos 
        }
      });
      
      console.log('Respuesta de disponibilidad:', response.data);
      
      // Manejar diferentes formatos de respuesta
      let slots = [];
      if (response.data.success && response.data.data) {
        slots = response.data.data;
      } else if (Array.isArray(response.data.data)) {
        slots = response.data.data;
      } else if (Array.isArray(response.data)) {
        slots = response.data;
      }
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        console.log('No hay slots disponibles para esta fecha');
      }
      
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
      setError('No se pudo cargar la disponibilidad para la fecha seleccionada.');
      setAvailableSlots([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(new Date());
    setAvailableSlots([]);
    setSelectedTime(null);
    setCustomerData({ nombre: '', email: '', telefono: '' });
    setError(null);
  };

  const handleServiceChange = (serviceId) => {
    const service = servicios.find(s => s.id === parseInt(serviceId));
    setSelectedService(service);
    // Limpiar tiempo seleccionado cuando cambia el servicio
    setSelectedTime(null);
  };

  const handleBarberChange = (barberId) => {
    setSelectedBarber(barberId);
    // Limpiar tiempo seleccionado cuando cambia el barbero
    setSelectedTime(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Limpiar tiempo seleccionado cuando cambia la fecha
    setSelectedTime(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      setError('Por favor, completa todos los campos para continuar.');
      return;
    }

    // Validar teléfono
    if (customerData.telefono.length < 9) {
      setError('El teléfono debe tener al menos 9 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Formatear fecha y hora correctamente
      const anio = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0'); 
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const fechaLocal = `${anio}-${mes}-${dia}`;
      const fechaHoraInicio = `${fechaLocal}T${selectedTime}:00`;

      const citaData = {
        barbero_id: selectedBarber,
        servicio_id: selectedService.id,
        fecha_hora_inicio: fechaHoraInicio,
        cliente_nombre: customerData.nombre,
        cliente_email: customerData.email,
        cliente_telefono: customerData.telefono
      };

      console.log('Enviando datos de cita:', citaData);

      const response = await api.post('/citas', citaData);
      
      console.log('Cita creada exitosamente:', response.data);
      
      setIsModalOpen(true);
      resetForm();

    } catch (error) {
      console.error('Error al crear cita:', error);
      let errorMessage = 'Error al crear la reserva.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'El horario seleccionado ya no está disponible. Por favor, elige otro horario.';
        // Recargar disponibilidad para mostrar horarios actualizados
        cargarDisponibilidad();
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0; // Excluir domingos
  };

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
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Paso 1: Seleccionar servicio */}
          <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up">
            <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">
              1. Elige un servicio
            </h2>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            >
              <option value="" disabled>Selecciona un servicio...</option>
              {servicios.map(servicio => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} - {servicio.duracion_minutos} min - {servicio.precio}€
                </option>
              ))}
            </select>
          </div>

          {/* Paso 2: Seleccionar barbero */}
          {selectedService && (
            <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">
                2. Elige un barbero
              </h2>
              <select
                value={selectedBarber || ''}
                onChange={(e) => handleBarberChange(e.target.value)}
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                required
              >
                <option value="" disabled>Selecciona un barbero...</option>
                {barberos.map(barbero => (
                  <option key={barbero.id} value={barbero.id}>
                    {barbero.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Paso 3: Seleccionar fecha y hora */}
          {selectedBarber && (
            <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">
                3. Elige fecha y hora
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-3 text-texto-principal">
                    Fecha
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    filterDate={isWeekday}
                    dateFormat="dd/MM/yyyy"
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md text-texto-principal"
                    inline
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-texto-principal">
                    Hora disponible
                  </label>
                  {availabilityLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-acento"></div>
                      <p className="text-texto-secundario ml-3">Buscando horarios disponibles...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3 text-sm rounded-md transition-all duration-300 ${
                            selectedTime === slot
                              ? 'bg-acento text-fondo font-bold'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-texto-principal'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-texto-secundario text-center">
                        No hay horarios disponibles para este día. Por favor, elige otra fecha.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Datos del cliente */}
          {selectedTime && (
            <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-playfair font-semibold mb-6 text-acento">
                4. Tus datos
              </h2>
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={customerData.nombre}
                  onChange={(e) => setCustomerData({...customerData, nombre: e.target.value})}
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={customerData.telefono}
                  onChange={(e) => {
                    // Solo permitir números
                    const valor = e.target.value.replace(/\D/g, '');
                    setCustomerData({...customerData, telefono: valor});
                  }}
                  pattern="[0-9]{9,}"
                  minLength="9"
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                  required
                />
              </div>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={!selectedTime || !customerData.nombre || !customerData.email || customerData.telefono.length < 9 || loading}
            className={`w-full py-4 px-6 rounded-md font-semibold text-fondo transition-all duration-300 ${
              !selectedTime || !customerData.nombre || !customerData.email || customerData.telefono.length < 9 || loading
                ? 'bg-zinc-700 cursor-not-allowed'
                : 'bg-acento hover:bg-acento-hover transform hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>

      {/* Modal de confirmación */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CheckCircleIcon className="w-16 h-16 text-acento mx-auto mb-4" />
        <h2 className="text-2xl font-playfair font-bold text-texto-principal mb-2">
          ¡Reserva Confirmada!
        </h2>
        <p className="text-texto-secundario">
          Tu cita ha sido agendada con éxito. Recibirás un email de confirmación en breve.
        </p>
        <button 
          onClick={() => setIsModalOpen(false)}
          className="mt-6 bg-acento text-fondo px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          Cerrar
        </button>
      </Modal>
    </>
  );
};

export default BookingPage;