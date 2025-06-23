import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import '../styles/datepicker-dark.css';

function CitaModal({ isOpen, onClose, citaSeleccionada, fechaPreseleccionada, onCitaGuardada, onCitaEliminada }) {
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    servicio_id: '',
    fecha_hora_inicio: '',
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: ''
  });
  
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar servicios al montar el componente
  useEffect(() => {
    cargarServicios();
  }, []);

  // Rellenar el formulario cuando se selecciona una cita para editar o fecha para nueva cita
  useEffect(() => {
    if (citaSeleccionada) {
      // Formatear la fecha para el input datetime-local
      const fechaFormateada = new Date(citaSeleccionada.start).toISOString().slice(0, 16);
      
      setFormData({
        servicio_id: citaSeleccionada.extendedProps?.servicioId || '',
        fecha_hora_inicio: fechaFormateada,
        cliente_nombre: citaSeleccionada.extendedProps?.clienteNombre || '',
        cliente_email: citaSeleccionada.extendedProps?.clienteEmail || '',
        cliente_telefono: citaSeleccionada.extendedProps?.clienteTelefono || ''
      });
    } else if (fechaPreseleccionada) {
      // Nueva cita con fecha preseleccionada
      const fecha = new Date(fechaPreseleccionada);
      const fechaFormateada = fecha.toISOString().slice(0, 16);
      
      setFormData({
        servicio_id: '',
        fecha_hora_inicio: fechaFormateada,
        cliente_nombre: '',
        cliente_email: '',
        cliente_telefono: ''
      });
    } else {
      // Limpiar el formulario
      setFormData({
        servicio_id: '',
        fecha_hora_inicio: '',
        cliente_nombre: '',
        cliente_email: '',
        cliente_telefono: ''
      });
    }
    setError(''); // Limpiar errores anteriores
  }, [citaSeleccionada, fechaPreseleccionada]);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setError('Error al cargar los servicios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (citaSeleccionada?.id) {
        // Actualizar cita existente
        await api.put(`/citas/${citaSeleccionada.id}`, formData);
      } else {
        // Crear nueva cita
        // Para nueva cita, necesitamos el barbero_id (lo tomamos del usuario autenticado)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await api.post('/citas', {
          ...formData,
          barbero_id: user.id
        });
      }

      // Llamar al callback para recargar las citas
      onCitaGuardada();
      onClose();
    } catch (error) {
      console.error('Error al guardar cita:', error);
      setError(error.response?.data?.message || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!citaSeleccionada?.id) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/citas/${citaSeleccionada.id}`);
      onCitaEliminada();
      onClose();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      setError(error.response?.data?.message || 'Error al eliminar la cita');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-playfair font-bold mb-4 text-left text-acento">
          {citaSeleccionada ? 'Editar Cita' : 'Nueva Cita'}
        </h2>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Selector de servicio */}
          <div>
            <label className="block text-sm font-medium text-texto-principal mb-1">
              Servicio
            </label>
            <select
              name="servicio_id"
              value={formData.servicio_id}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map(servicio => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} - {servicio.duracion_minutos} min - €{servicio.precio}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-texto-principal mb-1">
              Fecha y Hora
            </label>
            <DatePicker
              selected={formData.fecha_hora_inicio ? new Date(formData.fecha_hora_inicio) : null}
              onChange={(date) => {
                if (date) {
                  const fechaFormateada = date.toISOString().slice(0, 16);
                  handleChange({ target: { name: 'fecha_hora_inicio', value: fechaFormateada } });
                }
              }}
              showTimeSelect
              minTime={new Date(0, 0, 0, 9, 0)}
              maxTime={new Date(0, 0, 0, 20, 45)}
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              timeFormat="HH:mm"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            />
          </div>

          {/* Datos del cliente */}
          <div>
            <label className="block text-sm font-medium text-texto-principal mb-1">
              Nombre del Cliente
            </label>
            <input
              type="text"
              name="cliente_nombre"
              value={formData.cliente_nombre}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto-principal mb-1">
              Email del Cliente
            </label>
            <input
              type="email"
              name="cliente_email"
              value={formData.cliente_email}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto-principal mb-1">
              Teléfono del Cliente
            </label>
            <input
              type="tel"
              name="cliente_telefono"
              value={formData.cliente_telefono}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between pt-4">
            <div>
              {citaSeleccionada && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
            
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-zinc-700 text-texto-principal px-4 py-2 rounded hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-acento text-fondo px-4 py-2 rounded hover:bg-acento-hover disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default CitaModal;