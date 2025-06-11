const Joi = require('joi');

// Esquema de validación para servicios
const servicioSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),
  descripcion: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'La descripción no puede tener más de 500 caracteres'
    }),
  duracion_minutos: Joi.number().integer().min(5).max(240).required()
    .messages({
      'number.base': 'La duración debe ser un número',
      'number.integer': 'La duración debe ser un número entero',
      'number.min': 'La duración mínima es de 5 minutos',
      'number.max': 'La duración máxima es de 240 minutos',
      'any.required': 'La duración es obligatoria'
    }),
  precio: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'El precio debe ser un número',
      'number.positive': 'El precio debe ser mayor a 0',
      'any.required': 'El precio es obligatorio'
    })
});

// Middleware genérico de validación
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

module.exports = {
  validateServicio: validate(servicioSchema)
};