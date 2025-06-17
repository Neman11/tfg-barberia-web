const { Router } = require('express');
const db = require('../db');
const router = Router();
const { enviarEmailConfirmacion } = require('./emailService');
const { authenticateBarbero } = require('../middlewares/auth');

/**
 * @route   GET /api/citas
 * @desc    Obtener citas con filtros de fecha
 * @access  Privado - Solo barberos autenticados
 * @query   start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get('/', authenticateBarbero, async (req, res) => {
  const { start, end } = req.query;
  const barberoId = req.barbero.id; // ID del barbero autenticado

  try {
    // Query base para obtener citas con información relacionada
    let query = `
      SELECT 
        c.id,
        c.barbero_id,
        c.servicio_id,
        c.fecha_hora_inicio,
        c.fecha_hora_fin,
        c.cliente_nombre_nr,
        c.cliente_email_nr,
        c.cliente_telefono_nr,
        c.creado_en,
        s.nombre AS servicio_nombre,
        s.duracion_minutos,
        s.precio,
        b.nombre AS barbero_nombre
      FROM citas c
      INNER JOIN servicios s ON c.servicio_id = s.id
      INNER JOIN barberos b ON c.barbero_id = b.id
      WHERE c.barbero_id = $1
    `;
    
    const queryParams = [barberoId];
    
    // Agregar filtros de fecha si se proporcionan
    if (start && end) {
      query += ` AND c.fecha_hora_inicio >= $2 AND c.fecha_hora_inicio <= $3`;
      queryParams.push(start, end);
    }
    
    query += ` ORDER BY c.fecha_hora_inicio ASC`;
    
    const { rows } = await db.query(query, queryParams);
    
    // Formatear las citas para FullCalendar
    const citasFormateadas = rows.map(cita => ({
      id: cita.id,
      title: `${cita.servicio_nombre} - ${cita.cliente_nombre_nr}`,
      start: cita.fecha_hora_inicio,
      end: cita.fecha_hora_fin,
      extendedProps: {
        servicioId: cita.servicio_id,
        servicioNombre: cita.servicio_nombre,
        duracionMinutos: cita.duracion_minutos,
        precio: cita.precio,
        clienteNombre: cita.cliente_nombre_nr,
        clienteEmail: cita.cliente_email_nr,
        clienteTelefono: cita.cliente_telefono_nr,
        barberoNombre: cita.barbero_nombre
      }
    }));
    
    res.json(citasFormateadas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * @route   POST /api/citas
 * @desc    Crear una nueva cita
 * @access  Público
 */
router.post('/', async (req, res) => {
  const {
    barbero_id,
    servicio_id,
    fecha_hora_inicio,
    cliente_nombre,
    cliente_email,
    cliente_telefono
  } = req.body;

  if (!barbero_id || !servicio_id || !fecha_hora_inicio || !cliente_nombre || !cliente_email || !cliente_telefono) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }
  
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const servicioResult = await client.query('SELECT duracion_minutos FROM servicios WHERE id = $1', [servicio_id]);
    if (servicioResult.rows.length === 0) {
      throw new Error('El servicio seleccionado no existe.');
    }
    const duracionServicio = servicioResult.rows[0].duracion_minutos;
    const fechaInicio = new Date(fecha_hora_inicio);
    const fechaFin = new Date(fechaInicio.getTime() + duracionServicio * 60000);

    const conflictoQuery = `
      SELECT id FROM citas
      WHERE barbero_id = $1 AND (
        (fecha_hora_inicio, fecha_hora_fin) OVERLAPS (CAST($2 AS TIMESTAMPTZ), CAST($3 AS TIMESTAMPTZ))
      )
    `;
    const conflictoResult = await client.query(conflictoQuery, [barbero_id, fechaInicio.toISOString(), fechaFin.toISOString()]);
    if (conflictoResult.rows.length > 0) {
      return res.status(409).json({ message: 'El horario seleccionado ya no está disponible. Por favor, elija otro.' });
    }

    const citaQuery = `
      INSERT INTO citas (barbero_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, cliente_nombre_nr, cliente_email_nr, cliente_telefono_nr)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const citaValues = [barbero_id, servicio_id, fechaInicio.toISOString(), fechaFin.toISOString(), cliente_nombre, cliente_email, cliente_telefono];
    const nuevaCitaResult = await client.query(citaQuery, citaValues);
    const nuevaCita = nuevaCitaResult.rows[0];

    await client.query('COMMIT');

    // Enviar email de confirmación
    enviarEmailConfirmacion(nuevaCita);

    res.status(201).json({
      message: 'Cita reservada con éxito.',
      cita: nuevaCitaResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

/**
 * @route   PUT /api/citas/:id
 * @desc    Actualizar una cita existente
 * @access  Privado - Solo barberos autenticados
 */
router.put('/:id', authenticateBarbero, async (req, res) => {
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
      return res.status(404).json({ message: 'Cita no encontrada o no autorizada' });
    }

    // Si se está cambiando el servicio o la fecha, recalcular fecha_hora_fin
    let fechaFin = citaExistente.rows[0].fecha_hora_fin;
    
    if (servicio_id || fecha_hora_inicio) {
      // Obtener el servicio (usar el nuevo si se proporciona, si no, el existente)
      const servicioIdFinal = servicio_id || citaExistente.rows[0].servicio_id;
      const servicioResult = await client.query(
        'SELECT duracion_minutos FROM servicios WHERE id = $1',
        [servicioIdFinal]
      );
      
      if (servicioResult.rows.length === 0) {
        throw new Error('Servicio no encontrado');
      }

      const duracionMinutos = servicioResult.rows[0].duracion_minutos;
      const fechaInicioFinal = fecha_hora_inicio ? new Date(fecha_hora_inicio) : new Date(citaExistente.rows[0].fecha_hora_inicio);
      fechaFin = new Date(fechaInicioFinal.getTime() + duracionMinutos * 60000);
    }

    // Verificar conflictos de horario (excepto con la misma cita)
    if (fecha_hora_inicio) {
      const conflictoQuery = `
        SELECT id FROM citas
        WHERE barbero_id = $1 
        AND id != $2
        AND (
          (fecha_hora_inicio, fecha_hora_fin) OVERLAPS (CAST($3 AS TIMESTAMPTZ), CAST($4 AS TIMESTAMPTZ))
        )
      `;
      const conflictoResult = await client.query(
        conflictoQuery, 
        [barberoId, id, fecha_hora_inicio, fechaFin.toISOString()]
      );
      
      if (conflictoResult.rows.length > 0) {
        return res.status(409).json({ 
          message: 'El horario seleccionado entra en conflicto con otra cita' 
        });
      }
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
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    // Añadir el ID al final de los valores
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
      message: 'Cita actualizada con éxito',
      cita: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

/**
 * @route   DELETE /api/citas/:id
 * @desc    Eliminar una cita
 * @access  Privado - Solo barberos autenticados
 */
router.delete('/:id', authenticateBarbero, async (req, res) => {
  const { id } = req.params;
  const barberoId = req.barbero.id;

  try {
    // Verificar que la cita pertenece al barbero autenticado antes de eliminar
    const result = await db.query(
      'DELETE FROM citas WHERE id = $1 AND barbero_id = $2 RETURNING *',
      [id, barberoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Cita no encontrada o no autorizada para eliminar' 
      });
    }

    res.json({ 
      message: 'Cita eliminada con éxito',
      cita: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;