const { Router } = require('express');
const db = require('../db');
const router = Router();
const { enviarEmailConfirmacion } = require('./emailService');

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
    
    // Aquí llamaremos a la función para enviar el email de confirmación en el siguiente paso.

    await client.query('COMMIT');

    
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


module.exports = router;
