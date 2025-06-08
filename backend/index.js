// 1. Importaciones
require('dotenv').config();
const express = require('express');
const serviciosRouter = require('./routes/servicios'); // ¡Importamos el router!

// 2. Inicialización
const app = express();

// 3. Middlewares
app.use(express.json()); // ¡MUY IMPORTANTE! Para que Express entienda peticiones con cuerpo JSON

// 4. Variables y Configuraciones
const PORT = process.env.PORT || 3001;

// 5. Rutas
app.get('/api', (req, res) => {
    res.send('¡API de la barbería funcionando!');
});

// Le decimos a la app que use el router de servicios para todas las rutas que empiecen con /api/servicios
app.use('/api/servicios', serviciosRouter);

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});