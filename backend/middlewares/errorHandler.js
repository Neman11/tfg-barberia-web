class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log del error para debugging
  console.error('🚨 Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  let error = {
    success: false,
    message: err.message || 'Error interno del servidor',
    statusCode: err.statusCode || 500
  };

  // Manejo específico de errores de base de datos PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violación de restricción única
        error.message = 'Ya existe un registro con estos datos';
        error.statusCode = 409;
        break;
      case '23503': // Violación de clave foránea
        error.message = 'Referencia a un registro que no existe';
        error.statusCode = 400;
        break;
      case '23502': // Violación de NOT NULL
        error.message = 'Faltan campos obligatorios';
        error.statusCode = 400;
        break;
    }
  }

  // Errores de validación de Joi
  if (err.isJoi) {
    error.message = 'Datos de entrada inválidos';
    error.statusCode = 400;
    error.details = err.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));
  }

  // En producción, no mostrar detalles técnicos
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    error.message = 'Algo salió mal. Por favor, inténtalo más tarde.';
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(error.details && { details: error.details })
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new AppError(`Ruta ${req.originalUrl} no encontrada`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFound
};