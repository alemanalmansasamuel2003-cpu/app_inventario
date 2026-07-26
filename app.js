const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/**
 * ============================================
 * IMPORTACIÓN DE RUTAS
 * ============================================
 */

const productosRoutes = require('./routes/productos.routes');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const donantesRoutes = require('./routes/donantes.routes');

/**
 * ============================================
 * MIDDLEWARES
 * ============================================
 */

app.use(cors());
app.use(express.json());

/**
 * ============================================
 * RUTA PRINCIPAL
 * ============================================
 */

app.get('/', (req, res) => {

    res.json({

        success: true,

        mensaje: 'API Inventario funcionando correctamente'

    });

});

/**
 * ============================================
 * RUTAS DEL SISTEMA
 * ============================================
 */

app.use('/api/productos', productosRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', usuariosRoutes);

/**
 * Módulo de movimientos del inventario.
 */

app.use('/api/movimientos', movimientosRoutes);

/**
 * Módulo de donantes.
 */

app.use('/api/donantes', donantesRoutes);

/**
 * ============================================
 * PUERTO DEL SERVIDOR
 * ============================================
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
    );

});