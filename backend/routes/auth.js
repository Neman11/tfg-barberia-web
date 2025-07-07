const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken } = require('../middlewares/auth');

const router = Router();

// POST /api/auth/login - Login de barberos
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    // Buscar barbero por email
    const { rows } = await db.query(
      'SELECT * FROM barberos WHERE email = $1 AND activo = true',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const barbero = rows[0];

    // Verificar contraseña usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, barbero.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(barbero);

    // Responder con token y datos del barbero (sin la contraseña)
    const { password_hash, ...barberoData } = barbero;
    
    res.json({
      token,
      barbero: barberoData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/auth/register-barbero - Registro de nuevos barberos (solo para admin o desarrollo)
router.post('/register-barbero', async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  // Validación básica
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
  }

  try {
    // Verificar si el email ya existe
    const existingUser = await db.query('SELECT id FROM barberos WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo barbero
    const result = await db.query(
      'INSERT INTO barberos (nombre, email, password_hash, telefono) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, telefono, creado_en',
      [nombre, email, hashedPassword, telefono]
    );

    res.status(201).json({
      message: 'Barbero registrado exitosamente',
      barbero: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;