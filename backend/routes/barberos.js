const { Router } = require('express');
const db = require('../db');
const { authenticateBarbero } = require('../middlewares/auth');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, telefono, foto_url FROM barberos WHERE activo = true ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/perfil', authenticateBarbero, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, telefono, foto_url, creado_en FROM barberos WHERE id = $1',
      [req.barbero.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Barbero no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


/**
 * @route   GET /api/barberos/:id/disponibilidad
 * @desc    Calcula los huecos de citas disponibles para un barbero en una fecha específica
 * @access  Público
 * @query   fecha=YYYY-MM-DD
 * @query   duracion=30 (en minutos)
 */
router.get('/:id/disponibilidad', async (req, res) => {
  const { id } = req.params;
  const { fecha, duracion } = req.query;

  if (!fecha || !duracion) {
    return res.status(400).json({ message: 'Se requiere una fecha y una duración del servicio.' });
  }

  const diaSemana = new Date(fecha).getDay();

  try {
    const horarioResult = await db.query(
      'SELECT hora_inicio, hora_fin FROM horarios_barbero WHERE barbero_id = $1 AND dia_semana = $2 AND activo = true',
      [id, diaSemana]
    );

    if (horarioResult.rows.length === 0) {
      return res.json([]); // Si el barbero no trabaja ese día, devuelve un array vacío.
    }

    const citasResult = await db.query(
      'SELECT fecha_hora_inicio, fecha_hora_fin FROM citas WHERE barbero_id = $1 AND fecha_hora_inicio::date = $2',
      [id, fecha]
    );

    const horario = horarioResult.rows[0];
    const citas = citasResult.rows;
    const duracionServicio = parseInt(duracion, 10);

    const huecosDisponibles = [];
    const fechaSeleccionada = new Date(fecha + 'T00:00:00.000Z');

    const [inicioH, inicioM] = horario.hora_inicio.split(':');
    let slotActual = new Date(fechaSeleccionada.getTime());
    slotActual.setUTCHours(inicioH, inicioM, 0, 0);

    const [finH, finM] = horario.hora_fin.split(':');
    let horaFinTrabajo = new Date(fechaSeleccionada.getTime());
    horaFinTrabajo.setUTCHours(finH, finM, 0, 0);

    while (slotActual < horaFinTrabajo) {
      let slotFin = new Date(slotActual.getTime() + duracionServicio * 60000);

      if (slotFin > horaFinTrabajo) {
        break; 
      }

      let solapaConCita = false;
      for (const cita of citas) {
        const citaInicio = new Date(cita.fecha_hora_inicio);
        const citaFin = new Date(cita.fecha_hora_fin);

        if (slotActual < citaFin && slotFin > citaInicio) {
          solapaConCita = true;
          break;
        }
      }

      if (!solapaConCita) {
        huecosDisponibles.push(slotActual.toISOString().substr(11, 5)); // Formato HH:mm
      }
      
      // Avanzamos al siguiente slot posible, por ejemplo, en intervalos de 15 minutos
      slotActual = new Date(slotActual.getTime() + 15 * 60000);
    }

    res.json(huecosDisponibles);

  } catch (error) {
    console.error("Error al calcular disponibilidad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});


module.exports = router;
