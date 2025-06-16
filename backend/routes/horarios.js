const { Router } = require('express');
const db = require('../db');
const { authenticateBarbero } = require('../middlewares/auth');

const router = Router();

/**
 * @route   GET /api/horarios/:barberoId
 * @desc    Obtener todos los bloques de horario de un barbero específico
 * @access  Público
 */
router.get('/:barberoId', async (req, res) => {
  const { barberoId } = req.params;

  if (isNaN(barberoId)) {
    return res.status(400).json({ message: 'El ID del barbero debe ser un número.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT id, dia_semana, hora_inicio, hora_fin FROM horarios_barbero WHERE barbero_id = $1 AND activo = true ORDER BY dia_semana, hora_inicio',
      [barberoId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

/**
 * @route   POST /api/horarios
 * @desc    Un barbero autenticado añade un nuevo bloque de horario a su propio perfil
 * @access  Privado (Solo para el barbero logueado)
 */
router.post('/', authenticateBarbero, async (req, res) => {
  const barberoId = req.barbero.id;
  const { dia_semana, hora_inicio, hora_fin } = req.body;

  if (dia_semana === undefined || !hora_inicio || !hora_fin) {
    return res.status(400).json({ message: 'Los campos dia_semana, hora_inicio y hora_fin son obligatorios.' });
  }
  if (dia_semana < 0 || dia_semana > 6) {
    return res.status(400).json({ message: 'El campo dia_semana debe ser un número entre 0 (Domingo) y 6 (Sábado).' });
  }

  try {
    const query = `
      INSERT INTO horarios_barbero (barbero_id, dia_semana, hora_inicio, hora_fin)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [barberoId, dia_semana, hora_inicio, hora_fin]);

    res.status(201).json({
      message: 'Bloque de horario creado con éxito.',
      horario: rows[0]
    });
  } catch (error) {
    console.error('Error al crear horario:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un horario para este barbero en el día de la semana especificado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
