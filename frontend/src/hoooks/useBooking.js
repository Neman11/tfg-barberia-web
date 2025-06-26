import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Hook para cargar servicios y barberos
export const useServiciosYBarberos = () => {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [serviciosRes, barberosRes] = await Promise.all([
          api.get('/servicios'),
          api.get('/barberos')
        ]);
        
        setServicios(serviciosRes.data.data || serviciosRes.data);
        setBarberos(barberosRes.data.data || barberosRes.data);
      } catch (err) {
        setError('Error al cargar los datos iniciales');
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return { servicios, barberos, loading, error };
};

// Hook para manejar la disponibilidad
export const useDisponibilidad = (barberoId, fecha, duracionMinutos) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDisponibilidad = useCallback(async () => {
    if (!barberoId || !fecha || !duracionMinutos) {
      setSlots([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const fechaFormateada = fecha.toISOString().split('T')[0];
      const response = await api.get(`/barberos/${barberoId}/disponibilidad`, {
        params: { 
          fecha: fechaFormateada, 
          duracion: duracionMinutos 
        }
      });
      
      setSlots(response.data.data || response.data || []);
    } catch (err) {
      setError('Error al cargar horarios disponibles');
      console.error('Error cargando disponibilidad:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [barberoId, fecha, duracionMinutos]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  return { slots, loading, error, refetch: cargarDisponibilidad };
};

// Hook para manejar el estado del booking
export const useBookingState = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerData, setCustomerData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const resetBooking = useCallback(() => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerData({ nombre: '', email: '', telefono: '' });
  }, []);

  const updateCustomerData = useCallback((field, value) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Cuando cambia el servicio o barbero, resetear tiempo
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedService, selectedBarber, selectedDate]);

  return {
    selectedService, setSelectedService,
    selectedBarber, setSelectedBarber,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    customerData, updateCustomerData,
    resetBooking
  };
};

// Hook para manejar el envío de la reserva
export const useBookingSubmit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await api.post('/citas', bookingData);
      
      setSuccess(true);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al procesar la reserva';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSubmitState = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    submitBooking,
    resetSubmitState
  };
};