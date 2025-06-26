// backend/services/DatabaseService.js
const db = require('../db');

class DatabaseService {
  /**
   * Obtener citas con toda la información en UNA sola consulta
   */
  static async obtenerCitasCompletas(barberoId, fechaInicio = null, fechaFin = null) {
    const query = `
      SELECT 
        c.id,
        c.barbero_id,
        c.servicio_id,
        c.fecha_hora_inicio,
        c.fecha_hora_fin,
        c.cliente_nombre_nr,
        c.cliente_email_nr,
        c.cliente_telefono_nr,
        c.estado,
        c.creado_en,
        s.nombre AS servicio_nombre,
        s.duracion_minutos,
        s.precio,
        b.nombre AS barbero_nombre,
        b.email AS barbero_email
      FROM citas c
      INNER JOIN servicios s ON c.servicio_id = s.id
      INNER JOIN barberos b ON c.barbero_id = b.id
      WHERE c.barbero_id = $1 
        AND c.estado != 'cancelada'
        AND ($2::timestamptz IS NULL OR c.fecha_hora_inicio >= $2)
        AND ($3::timestamptz IS NULL OR c.fecha_hora_inicio <= $3)
      ORDER BY c.fecha_hora_inicio ASC
    `;
    
    const params = [barberoId, fechaInicio, fechaFin];
    const { rows } = await db.query(query, params);
    
    return rows.map(row => ({
      id: row.id,
      title: `${row.servicio_nombre} - ${row.cliente_nombre_nr}`,
      start: row.fecha_hora_inicio,
      end: row.fecha_hora_fin,
      extendedProps: {
        servicioId: row.servicio_id,
        servicioNombre: row.servicio_nombre,
        duracionMinutos: row.duracion_minutos,
        precio: row.precio,
        clienteNombre: row.cliente_nombre_nr,
        clienteEmail: row.cliente_email_nr,
        clienteTelefono: row.cliente_telefono_nr,
        barberoNombre: row.barbero_nombre,
        estado: row.estado
      }
    }));
  }

  /**
   * Verificar disponibilidad de forma eficiente
   */
  static async verificarDisponibilidad(barberoId, fechaInicio, fechaFin, excluirCitaId = null) {
    const query = `
      SELECT NOT EXISTS(
        SELECT 1 FROM citas
        WHERE barbero_id = $1 
          AND estado != 'cancelada'
          AND (fecha_hora_inicio, fecha_hora_fin) OVERLAPS ($2::timestamptz, $3::timestamptz)
          AND ($4::integer IS NULL OR id != $4)
      ) as disponible
    `;
    
    const { rows } = await db.query(query, [barberoId, fechaInicio, fechaFin, excluirCitaId]);
    return rows[0].disponible;
  }

  /**
   * Calcular disponibilidad en la base de datos
   */
static async obtenerDisponibilidadCompleta(barberoId, fecha, duracionMinutos) {
  const diaSemana = new Date(fecha + 'T00:00:00Z').getUTCDay();
  
  const query = `
    WITH horario_trabajo AS (
      SELECT hora_inicio, hora_fin
      FROM horarios_barbero 
      WHERE barbero_id = $1 AND dia_semana = $2 AND activo = true
    ),
    citas_dia AS (
      SELECT fecha_hora_inicio, fecha_hora_fin
      FROM citas 
      WHERE barbero_id = $1 
        AND fecha_hora_inicio::date = $3::date
        AND estado != 'cancelada'
    )
    SELECT 
      h.hora_inicio,
      h.hora_fin,
      COALESCE(
        json_agg(
          json_build_object(
            'inicio', c.fecha_hora_inicio,
            'fin', c.fecha_hora_fin
          )
        ) FILTER (WHERE c.fecha_hora_inicio IS NOT NULL),
        '[]'
      ) as citas_existentes
    FROM horario_trabajo h
    LEFT JOIN citas_dia c ON true
    GROUP BY h.hora_inicio, h.hora_fin
  `;

  const { rows } = await db.query(query, [barberoId, diaSemana, fecha]);
  
  if (rows.length === 0) {
    return [];
  }

  return this.calcularHuecosLibres(rows[0], fecha, duracionMinutos);
}

  /**
   * Calcular huecos libres optimizado
   */
  static calcularHuecosLibres(horarioYCitas, fecha, duracionMinutos) {
    const { hora_inicio, hora_fin, citas_existentes } = horarioYCitas;
    
    if (!hora_inicio || !hora_fin) return [];

    const fechaBase = new Date(fecha + 'T00:00:00.000Z');
    const [inicioH, inicioM] = hora_inicio.split(':').map(Number);
    const [finH, finM] = hora_fin.split(':').map(Number);
    
    const horaInicio = new Date(fechaBase);
    horaInicio.setUTCHours(inicioH, inicioM, 0, 0);
    
    const horaFin = new Date(fechaBase);
    horaFin.setUTCHours(finH, finM, 0, 0);

    const huecos = [];
    let slotActual = new Date(horaInicio);

    while (slotActual < horaFin) {
      const slotFin = new Date(slotActual.getTime() + duracionMinutos * 60000);
      
      if (slotFin > horaFin) break;

      const seSuperpone = citas_existentes.some(cita => {
        const citaInicio = new Date(cita.inicio);
        const citaFin = new Date(cita.fin);
        return slotActual < citaFin && slotFin > citaInicio;
      });

      if (!seSuperpone) {
        huecos.push(slotActual.toISOString().substr(11, 5));
      }

      slotActual = new Date(slotActual.getTime() + 15 * 60000);
    }

    return huecos;
  }

  /**
   * Estadísticas en una sola consulta
   */
  static async obtenerEstadisticasBarbero(barberoId) {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
    
    const inicioSemana = new Date(inicioHoy);
    inicioSemana.setDate(inicioHoy.getDate() - (inicioHoy.getDay() === 0 ? 6 : inicioHoy.getDay() - 1));
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const query = `
      SELECT 
        COUNT(*) FILTER (
          WHERE fecha_hora_inicio >= $2 AND fecha_hora_inicio < $3
        ) as citas_hoy,
        COUNT(*) FILTER (
          WHERE fecha_hora_inicio >= $4
        ) as citas_semana,
        COUNT(*) FILTER (
          WHERE fecha_hora_inicio >= $5
        ) as citas_mes,
        COUNT(*) as total_citas
      FROM citas 
      WHERE barbero_id = $1 AND estado != 'cancelada'
    `;

    const { rows } = await db.query(query, [
      barberoId,
      inicioHoy.toISOString(),
      finHoy.toISOString(),
      inicioSemana.toISOString(),
      inicioMes.toISOString()
    ]);

    return {
      today: parseInt(rows[0].citas_hoy),
      week: parseInt(rows[0].citas_semana),
      month: parseInt(rows[0].citas_mes),
      total: parseInt(rows[0].total_citas)
    };
  }
}

module.exports = DatabaseService;