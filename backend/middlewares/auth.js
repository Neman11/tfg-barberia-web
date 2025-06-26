const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticateBarbero = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Acceso denegado. Token no proporcionado.' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.barbero = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado' 
    });
  }
};
const generateToken = (barbero) => {
  return jwt.sign(
    { 
      id: barbero.id, 
      email: barbero.email,
      nombre: barbero.nombre 
    },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    }
  );
};

module.exports = {
  authenticateBarbero,
  generateToken
};