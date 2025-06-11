const { Router } = require('express');
const db = require('../db');
const { validateServicio } = require('../middlewares/validation');

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

// GET /api/servicios/:id - Obtener un servicio por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validar que el ID sea un número
  if (isNaN(id)) {
    return res.status(400).json({ message: 'El ID debe ser un número' });
  }
  
  try {
    const { rows } = await db.query('SELECT * FROM servicios WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/servicios - Crear un nuevo servicio
router.post('/', validateServicio, async (req, res) => {
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

// PUT /api/servicios/:id - Actualizar un servicio
router.put('/:id', validateServicio, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, duracion_minutos, precio } = req.body;
  
  // Validar que el ID sea un número
  if (isNaN(id)) {
    return res.status(400).json({ message: 'El ID debe ser un número' });
  }
  
  try {
    const result = await db.query(
      'UPDATE servicios SET nombre = $1, descripcion = $2, duracion_minutos = $3, precio = $4 WHERE id = $5 RETURNING *',
      [nombre, descripcion, duracion_minutos, precio, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/servicios/:id - Eliminar un servicio
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validar que el ID sea un número
  if (isNaN(id)) {
    return res.status(400).json({ message: 'El ID debe ser un número' });
  }
  
  try {
    // Primero verificar si el servicio existe
    const checkResult = await db.query('SELECT * FROM servicios WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Si existe, eliminarlo
    const deleteResult = await db.query('DELETE FROM servicios WHERE id = $1 RETURNING *', [id]);
    
    res.json({ 
      message: 'Servicio eliminado correctamente', 
      servicio: deleteResult.rows[0] 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;