
// Carga las variables de entorno desde el archivo .env
require('dotenv').config(); 
const express = require('express');

//Inicialización
const app = express();


// Lee el puerto desde las variables de entorno, o usa el 3001 como default
const PORT = process.env.PORT || 3001; 


// Creamos una ruta de prueba para la raíz de la API
app.get('/', (req, res) => {
  res.send('¡Hola desde el backend de la barbería!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});