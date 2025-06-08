const { Router } = require('express');
const db = require('../db'); // Importamos nuestro módulo de conexión a BD

const router = Router();

// GET /api/servicios - Obtener todos los servicios
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM servicios ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/servicios - Crear un nuevo servicio
router.post('/', async (req, res) => {
    // Obtenemos los datos del cuerpo de la petición
    const { nombre, descripcion, duracion_minutos, precio } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO servicios (nombre, descripcion, duracion_minutos, precio) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, descripcion, duracion_minutos, precio]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// ... (Aquí irían las rutas para GET por ID, PUT y DELETE) ...

module.exports = router;