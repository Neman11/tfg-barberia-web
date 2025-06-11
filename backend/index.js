// 1. Importaciones
require('dotenv').config();
const express = require('express');
const serviciosRouter = require('./routes/servicios');
const authRouter = require('./routes/auth');
const barberosRouter = require('./routes/barberos');

// 2. Inicialización
const app = express();

// 3. Middlewares
app.use(express.json());

// 4. Variables y Configuraciones
const PORT = process.env.PORT || 3001;

// 5. Rutas
app.get('/api', (req, res) => {
    res.send('¡API de la barbería funcionando!');
});

// Rutas de autenticación
app.use('/api/auth', authRouter);

// Rutas de recursos
app.use('/api/servicios', serviciosRouter);
app.use('/api/barberos', barberosRouter);

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});