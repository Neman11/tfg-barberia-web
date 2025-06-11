const jwt = require('jsonwebtoken');

// Clave secreta para JWT (en producción debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_desarrollo';

// Middleware para verificar token de barbero
const authenticateBarbero = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.barbero = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Función para generar token
const generateToken = (barbero) => {
  return jwt.sign(
    { 
      id: barbero.id, 
      email: barbero.email,
      nombre: barbero.nombre 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateBarbero,
  generateToken
};