// backend/routes/citas.js (REEMPLAZAR EL CONTENIDO ACTUAL)
const { Router } = require('express');
const { authenticateBarbero } = require('../middlewares/auth');
const { AppError } = require('../middlewares/errorHandler');
const DatabaseService = require('../services/DatabaseService');
const { enviarEmailConfirmacion } = require('./emailService');
const db = require('../db');
const crypto = require('crypto');

const router = Router();

/**
 * GET /api/citas - Obtener citas con información completa
 * Optimización: Una sola consulta con JOINs en lugar de múltiples consultas
 */
router.get('/', authenticateBarbero, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const barberoId = req.barbero.id;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (start && end) {
      try {
        // Arreglar el formato de fecha: reemplazar espacio por +
        const startFixed = start.replace(/ (\d{2}):(\d{2})$/, '+$1:$2');
        const endFixed = end.replace(/ (\d{2}):(\d{2})$/, '+$1:$2');
        
        // Parsear las fechas corregidas
        fechaInicio = new Date(startFixed);
        fechaFin = new Date(endFixed);
        
        // Verificar que son fechas válidas
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
          return next(new AppError('Formato de fecha inválido', 400));
        }
            
      } catch (error) {
        console.log('Error parseando fechas:', error.message);
        return next(new AppError('Error al procesar las fechas: ' + error.message, 400));
      }
    }
    
    // Usar consulta optimizada con JOINs
    const citas = await DatabaseService.obtenerCitasCompletas(
      barberoId, 
      fechaInicio?.toISOString(), 
      fechaFin?.toISOString()
    );
    
    res.json({
      success: true,
      count: citas.length,
      data: citas
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/citas/estadisticas - Obtener estadísticas del barbero
 * Optimización: Una consulta con COUNT FILTER en lugar de consultas separadas
 */
router.get('/estadisticas', authenticateBarbero, async (req, res, next) => {
  try {
    const barberoId = req.barbero.id;
    
    const stats = await DatabaseService.obtenerEstadisticasBarbero(barberoId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/citas - Crear nueva cita
 * Optimización: Verificación de disponibilidad con EXISTS en lugar de COUNT
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      barbero_id,
      servicio_id,
      fecha_hora_inicio,
      cliente_nombre,
      cliente_email,
      cliente_telefono
    } = req.body;
    
    // Validaciones básicas
    if (!barbero_id || !servicio_id || !fecha_hora_inicio || !cliente_nombre || !cliente_email || !cliente_telefono) {
      return next(new AppError('Todos los campos son obligatorios', 400));
    }
    
    // Validar formato de hora
    const fechaInicio = new Date(fecha_hora_inicio);
    if (fechaInicio.getMinutes() % 15 !== 0) {
      return next(new AppError('La hora debe ser en intervalos de 15 minutos', 400));
    }
    
    const crypto = require('crypto');
    const db = require('../db');
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Obtener información del servicio
      const servicioResult = await client.query(
        'SELECT duracion_minutos, nombre FROM servicios WHERE id = $1', 
        [servicio_id]
      );
      
      if (servicioResult.rows.length === 0) {
        throw new AppError('Servicio no encontrado', 404);
      }

      const servicio = servicioResult.rows[0];
      const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion_minutos * 60000);

      // Verificación optimizada de disponibilidad
      const disponible = await DatabaseService.verificarDisponibilidad(
        barbero_id,
        fechaInicio.toISOString(),
        fechaFin.toISOString()
      );

      if (!disponible) {
        throw new AppError('El horario seleccionado no está disponible', 409);
      }

      // Crear la cita
      const tokenCancelacion = crypto.randomBytes(32).toString('hex');
      
      const citaQuery = `
        INSERT INTO citas (
          barbero_id, servicio_id, fecha_hora_inicio, fecha_hora_fin,
          cliente_nombre_nr, cliente_email_nr, cliente_telefono_nr,
          token_cancelacion, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmada')
        RETURNING *
      `;
      
      const citaValues = [
        barbero_id,
        servicio_id,
        fechaInicio.toISOString(),
        fechaFin.toISOString(),
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        tokenCancelacion
      ];

      const citaResult = await client.query(citaQuery, citaValues);
      await client.query('COMMIT');

      const nuevaCita = citaResult.rows[0];
      
      // Obtener nombre del barbero para el email
      const barberoResult = await client.query(
        'SELECT nombre FROM barberos WHERE id = $1', 
        [barbero_id]
      );
      const barberoNombre = barberoResult.rows[0]?.nombre || 'Barbero';
      
      // Preparar datos para el email
      const datosEmail = {
        ...nuevaCita,
        servicio_nombre: servicio.nombre,
        barbero_nombre: barberoNombre
      };
      
      // Enviar email de forma asíncrona para no bloquear la respuesta
      setImmediate(() => {
        enviarEmailConfirmacion(datosEmail);
      });
      
      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          id: nuevaCita.id,
          fecha_hora_inicio: nuevaCita.fecha_hora_inicio,
          servicio_nombre: servicio.nombre,
          cliente_nombre: nuevaCita.cliente_nombre_nr
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/citas/cancelar/:token - Cancelar cita por token
 */
router.post('/cancelar/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    // Buscar la cita por token
    const citaExistenteResult = await db.query(
      "SELECT id, estado FROM citas WHERE token_cancelacion = $1",
      [token]
    );

    if (citaExistenteResult.rows.length === 0) {
      return next(new AppError('El enlace de cancelación es inválido', 404));
    }

    const cita = citaExistenteResult.rows[0];

    if (cita.estado === 'cancelada') {
      return res.json({ 
        success: true,
        message: 'Esta cita ya había sido cancelada anteriormente.' 
      });
    }
    
    if (cita.estado !== 'confirmada') {
      return next(new AppError(`No se puede cancelar una cita con estado '${cita.estado}'`, 400));
    }

    // Cancelar la cita
    await db.query(
      "UPDATE citas SET estado = 'cancelada' WHERE id = $1",
      [cita.id]
    );

    res.json({ 
      success: true,
      message: 'Tu cita ha sido cancelada con éxito.' 
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/citas/:id - Actualizar cita existente
 */
router.put('/:id', authenticateBarbero, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      servicio_id,
      fecha_hora_inicio,
      cliente_nombre,
      cliente_email,
      cliente_telefono
    } = req.body;
    
    const barberoId = req.barbero.id;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Verificar que la cita pertenece al barbero autenticado
      const citaExistente = await client.query(
        'SELECT * FROM citas WHERE id = $1 AND barbero_id = $2',
        [id, barberoId]
      );
      
      if (citaExistente.rows.length === 0) {
        throw new AppError('Cita no encontrada o no autorizada', 404);
      }

      // Construir la query de actualización dinámicamente
      const campos = [];
      const valores = [];
      let contador = 1;

      if (servicio_id) {
        campos.push(`servicio_id = $${contador}`);
        valores.push(servicio_id);
        contador++;
      }

      if (fecha_hora_inicio) {
        // Recalcular fecha_fin si cambia el servicio o la fecha
        const servicioIdFinal = servicio_id || citaExistente.rows[0].servicio_id;
        const servicioResult = await client.query(
          'SELECT duracion_minutos FROM servicios WHERE id = $1',
          [servicioIdFinal]
        );
        
        const duracionMinutos = servicioResult.rows[0].duracion_minutos;
        const fechaFin = new Date(new Date(fecha_hora_inicio).getTime() + duracionMinutos * 60000);
        
        campos.push(`fecha_hora_inicio = $${contador}`);
        valores.push(fecha_hora_inicio);
        contador++;
        
        campos.push(`fecha_hora_fin = $${contador}`);
        valores.push(fechaFin.toISOString());
        contador++;
      }

      if (cliente_nombre) {
        campos.push(`cliente_nombre_nr = $${contador}`);
        valores.push(cliente_nombre);
        contador++;
      }

      if (cliente_email) {
        campos.push(`cliente_email_nr = $${contador}`);
        valores.push(cliente_email);
        contador++;
      }

      if (cliente_telefono) {
        campos.push(`cliente_telefono_nr = $${contador}`);
        valores.push(cliente_telefono);
        contador++;
      }

      if (campos.length === 0) {
        throw new AppError('No se proporcionaron campos para actualizar', 400);
      }

      valores.push(id);

      const updateQuery = `
        UPDATE citas 
        SET ${campos.join(', ')}
        WHERE id = $${contador}
        RETURNING *
      `;

      const result = await client.query(updateQuery, valores);
      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Cita actualizada con éxito',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/citas/:id - Cancelar cita (cambiar estado)
 */
router.delete('/:id', authenticateBarbero, async (req, res, next) => {
  try {
    const { id } = req.params;
    const barberoId = req.barbero.id;

    const result = await db.query(
      "UPDATE citas SET estado = 'cancelada' WHERE id = $1 AND barbero_id = $2 RETURNING *",
      [id, barberoId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Cita no encontrada o no autorizada', 404);
    }

    res.json({ 
      success: true,
      message: 'Cita cancelada con éxito', 
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;