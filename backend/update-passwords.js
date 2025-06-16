const bcrypt = require('bcryptjs');
const db = require('./db');

async function updatePasswords() {
  try {
    // Generar hash para la contraseña "123456"
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Actualizar todos los barberos con esta contraseña
    await db.query(
      'UPDATE barberos SET password_hash = $1',
      [hashedPassword]
    );
    
    console.log('Contraseñas actualizadas. Todos los barberos ahora tienen la contraseña: 123456');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePasswords();