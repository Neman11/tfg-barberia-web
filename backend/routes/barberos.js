const { Router } = require('express');
const db = require('../db');
const { authenticateBarbero } = require('../middlewares/auth');
const DatabaseService = require('../services/DatabaseService');

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
 * GET /api/barberos/:id/disponibilidad - Calcular disponibilidad optimizada
 * Optimización: Una consulta con subconsultas en lugar de consultas separadas
 */
router.get('/:id/disponibilidad', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha, duracion } = req.query;

    // Validaciones
    if (!fecha || !duracion) {
      return next(new AppError('Se requiere fecha y duración del servicio', 400));
    }

    if (isNaN(id)) {
      return next(new AppError('ID de barbero inválido', 400));
    }

    const duracionMinutos = parseInt(duracion, 10);
    if (isNaN(duracionMinutos) || duracionMinutos < 5 || duracionMinutos > 240) {
      return next(new AppError('Duración debe ser entre 5 y 240 minutos', 400));
    }

    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return next(new AppError('Formato de fecha inválido', 400));
    }

    // Usar consulta optimizada
    const disponibilidad = await DatabaseService.obtenerDisponibilidadCompleta(
      parseInt(id, 10),
      fecha,
      duracionMinutos
    );

    res.json({
      success: true,
      fecha,
      duracion_minutos: duracionMinutos,
      slots_disponibles: disponibilidad.length,
      data: disponibilidad
    });

  } catch (error) {
    next(error);
  }
});


module.exports = router;
