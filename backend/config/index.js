// backend/config/index.js
require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  // Configuración de base de datos
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'barberia',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    // Pool de conexiones
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },

  // Configuración de email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'Barbería Premium <noreply@barberia.com>'
  },

  // URLs del frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    cancelationPath: process.env.FRONTEND_CANCELATION_PATH || '/cancelar-cita'
  }
};

// Validación de variables de entorno críticas
const validateConfig = () => {
  const requiredVars = [
    'DB_PASSWORD',
    'JWT_SECRET'
  ];

  // En producción, requerir más variables
  if (config.server.nodeEnv === 'production') {
    requiredVars.push(
      'EMAIL_USER',
      'EMAIL_PASS',
      'FRONTEND_URL'
    );
  }

  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });

  if (missingVars.length > 0) {
    console.error('❌ ERROR: Variables de entorno faltantes o vacías:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    
    if (config.server.nodeEnv === 'production') {
      console.error('🚫 No se puede iniciar en producción sin estas variables');
      process.exit(1);
    } else {
      console.warn('⚠️  Algunas funcionalidades pueden no funcionar correctamente');
    }
  }

  // Validar formato de variables específicas
  if (config.jwt.secret && config.jwt.secret.length < 32) {
    console.warn('⚠️  JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }

  if (config.email.user && !config.email.user.includes('@')) {
    console.error('❌ EMAIL_USER debe ser una dirección de email válida');
    process.exit(1);
  }
};

// Ejecutar validación
validateConfig();

module.exports = config;