const { Router } = require('express');
const db = require('../db');
const { authenticateBarbero } = require('../middlewares/auth');

const router = Router();

// GET /api/barberos - Obtener todos los barberos activos (público)
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

// GET /api/barberos/perfil - Obtener perfil del barbero autenticado
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

// GET /api/barberos/:id/horarios - Obtener horarios de un barbero
router.get('/:id/horarios', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT dia_semana, hora_inicio, hora_fin FROM horarios_barbero WHERE barbero_id = $1 AND activo = true ORDER BY dia_semana',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;