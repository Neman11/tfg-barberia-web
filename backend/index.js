// 1. Importaciones
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const serviciosRouter = require('./routes/servicios');
const authRouter = require('./routes/auth');
const barberosRouter = require('./routes/barberos');
const citasRouter = require('./routes/citas');
const horariosRouter = require('./routes/horarios');
// 2. Inicialización
const app = express();

// 3. Middlewares
app.use(cors()); 
app.use(express.json());

// 4. Variables y Configuraciones
const PORT = process.env.PORT || 3001;

// 5. Rutas
app.get('/api', (req, res) => {
    res.send('¡API de la barbería funcionando!');
});

app.use('/api/auth', authRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/barberos', barberosRouter);
app.use('/api/horarios', horariosRouter);
app.use('/api/citas', citasRouter);

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

