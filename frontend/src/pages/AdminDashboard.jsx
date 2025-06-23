import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import CitaModal from '../components/CitaModal';
import api from '../services/api';
import '../styles/fullcalendar-dark.css';

/**
 * Función de ayuda para obtener el primer día de la semana (Lunes).
 * @param {Date} date - La fecha a partir de la cual calcular el inicio de la semana.
 * @returns {Date} El objeto Date correspondiente al Lunes de esa semana.
 */
const getStartOfWeek = (date) => {
  const dt = new Date(date);
  const day = dt.getDay(); 
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(dt.setDate(diff));
};


// --- 2. Componente Principal ---
function AdminDashboard() {
  // --- Hooks y Estado ---
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  const [calendarRef, setCalendarRef] = useState(null); 

  // Estado para almacenar las estadísticas del panel.
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
  });

  // Estado para controlar el modal de citas.
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null); 
  const [preselectedDate, setPreselectedDate] = useState(null); 

  /**
   * Carga las estadísticas (citas de hoy, semana, mes) desde la API.
   * Se usa `useCallback` para evitar que la función se recree en cada render,
   * optimizando el rendimiento.
   */
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      // Definimos los rangos de fechas para las consultas
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      
      const startOfWeek = getStartOfWeek(new Date()).toISOString();
      const endOfWeekDate = new Date(startOfWeek);
      endOfWeekDate.setDate(endOfWeekDate.getDate() + 6);
      const endOfWeek = endOfWeekDate.toISOString();

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      // Realizamos las 3 llamadas a la API en paralelo para mayor eficiencia.
      const [todayRes, weekRes, monthRes] = await Promise.all([
        api.get(`/citas?start=${startOfToday}&end=${endOfToday}`),
        api.get(`/citas?start=${startOfWeek}&end=${endOfWeek}`),
        api.get(`/citas?start=${startOfMonth}&end=${endOfMonth}`)
      ]);
      
      // Actualizamos el estado con la cantidad de citas recibidas en cada llamada.
      setStats({
        today: todayRes.data.length,
        week: weekRes.data.length,
        month: monthRes.data.length,
      });

    } catch (error) {
      console.error("Error al cargar las estadísticas:", error);
    }
  }, []);

  // Hook `useEffect` para cargar las estadísticas iniciales cuando el componente se monta.
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // --- Manejadores de Eventos ---

  // Cierra la sesión del usuario y lo redirige a la página de inicio.
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Se activa cuando el usuario selecciona un rango de fechas en el calendario.
  const handleDateSelect = (selectInfo) => {
    setPreselectedDate(selectInfo.startStr); // Guardamos la fecha/hora de inicio
    setSelectedCita(null); // Nos aseguramos de que no hay ninguna cita seleccionada para editar
    setModalIsOpen(true); // Abrimos el modal
  };

  // Se activa cuando el usuario hace clic en un evento (cita) existente.
  const handleEventClick = (clickInfo) => {
    setSelectedCita(clickInfo.event); 
    setPreselectedDate(null); 
    setModalIsOpen(true); 
  };
  
  // Obtiene la referencia a la API interna de FullCalendar para poder invocar métodos como `refetchEvents`.
  const getCalendarApi = (ref) => {
      if (ref) {
          setCalendarRef(ref.getApi());
      }
  }

  // Cierra el modal y resetea los estados relacionados.
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedCita(null);
    setPreselectedDate(null);
  };

  // Se llama cuando una cita se guarda (creada o actualizada) correctamente.
  const handleCitaSaved = () => {
    closeModal();
    fetchStats(); 
    if(calendarRef) {
      calendarRef.refetchEvents(); 
    }
  };

  // Se llama cuando una cita se elimina.
  const handleCitaDeleted = () => {
    closeModal();
    fetchStats(); 
    if(calendarRef) {
      calendarRef.refetchEvents(); 
    }
  };

  /**
   * Función que FullCalendar usa para obtener los eventos de forma dinámica.
   * Se ejecuta cada vez que el usuario cambia de vista o de fecha.
   * @param {object} fetchInfo 
   * @param {function} successCallback 
   * @param {function} failureCallback 
   */
  const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
    try {
      const response = await api.get(`/citas?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`);
      successCallback(response.data);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
      failureCallback(error);
    }
  };

  // --- 3. Renderizado del Componente ---
  return (
    <>
      <div className="min-h-screen bg-fondo text-texto-principal">
        <div className="container mx-auto px-4 py-8">
          {/* Encabezado del panel */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-playfair font-bold text-acento">Panel de Administración</h1>
            <button
              onClick={handleLogout}
              className="bg-red-700 text-white px-6 py-2 rounded-md hover:bg-red-800 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Saludo al usuario */}
          <div className="bg-zinc-900 rounded-lg shadow-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-texto-principal">Bienvenido, {user?.nombre}</h2>
            <p className="text-texto-secundario">Email: {user?.email}</p>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 rounded-lg shadow-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-texto-secundario">Citas de Hoy</h3>
              <p className="text-4xl font-bold text-acento">{stats.today}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg shadow-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-texto-secundario">Esta Semana</h3>
              <p className="text-4xl font-bold text-acento">{stats.week}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg shadow-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-texto-secundario">Este Mes</h3>
              <p className="text-4xl font-bold text-acento">{stats.month}</p>
            </div>
          </div>

          {/* Calendario de FullCalendar */}
          <div className="bg-zinc-900 rounded-lg shadow-xl p-6">
            <FullCalendar
              ref={getCalendarApi}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="timeGridWeek"
              events={fetchEvents}
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              locale='es'
              buttonText={{
                  today: 'Hoy',
                  month: 'Mes',
                  week:  'Semana',
                  day:   'Día'
              }}
              allDaySlot={false}
              slotMinTime="09:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:15:00"
              slotLabelInterval="00:15"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
                }}
              expandRows={true}
              height="auto"
              eventDisplay="block"
              displayEventTime={true}
              displayEventEnd={true}
              eventTextColor="#111111"
              eventBackgroundColor="#bfa88b"
              eventBorderColor="#bfa88b"
            />
          </div>
        </div>
      </div>

      {/* Modal para crear/editar citas */}
      <CitaModal
        isOpen={modalIsOpen}
        onClose={closeModal}
        citaSeleccionada={selectedCita}
        fechaPreseleccionada={preselectedDate}
        onCitaGuardada={handleCitaSaved}
        onCitaEliminada={handleCitaDeleted}
      />
    </>
  );
}

export default AdminDashboard;