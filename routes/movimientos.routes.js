const express = require('express');

const router = express.Router();

const movimientosController =
  require('../controllers/movimientos.controller');

/**
 * ============================================================
 * RUTAS DE MOVIMIENTOS
 * ============================================================
 */

/**
 * Obtener todos los movimientos.
 *
 * GET /api/movimientos
 */
router.get(
  '/',
  movimientosController.obtenerMovimientos
);

/**
 * Obtener el historial completo de donaciones.
 *
 * Esta ruta debe colocarse antes de /:id para evitar que
 * Express interprete la palabra "donaciones" como si fuera
 * el identificador de un movimiento.
 *
 * GET /api/movimientos/donaciones
 */
router.get(
  '/donaciones',
  movimientosController.obtenerDonaciones
);

/**
 * Obtener las donaciones de un donante específico.
 *
 * GET /api/movimientos/donaciones/donante/:id
 */
router.get(
  '/donaciones/donante/:id',
  movimientosController.obtenerDonacionesPorDonante
);

/**
 * Obtener todos los movimientos de un producto.
 *
 * GET /api/movimientos/producto/:id
 */
router.get(
  '/producto/:id',
  movimientosController.obtenerMovimientosPorProducto
);

/**
 * Registrar una entrada de inventario.
 *
 * También permite registrar entradas procedentes
 * de una donación.
 *
 * POST /api/movimientos/entrada
 */
router.post(
  '/entrada',
  movimientosController.registrarEntrada
);

/**
 * Registrar una salida de inventario.
 *
 * POST /api/movimientos/salida
 */
router.post(
  '/salida',
  movimientosController.registrarSalida
);

/**
 * Obtener un movimiento específico por ID.
 *
 * Esta ruta debe permanecer al final porque acepta
 * cualquier valor después de /api/movimientos/.
 *
 * GET /api/movimientos/:id
 */
router.get(
  '/:id',
  movimientosController.obtenerMovimientoPorId
);

/**
 * Exportar el router.
 */
module.exports = router;