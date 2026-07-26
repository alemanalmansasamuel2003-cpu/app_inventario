const express = require('express');

const router = express.Router();

const donantesController =
  require('../controllers/donantes.controller');

/**
 * Obtiene todos los donantes activos.
 *
 * GET /donantes
 */
router.get(
  '/',
  donantesController.obtenerDonantes
);

/**
 * Obtiene un donante específico.
 *
 * GET /donantes/:id
 */
router.get(
  '/:id',
  donantesController.obtenerDonantePorId
);

/**
 * Registra un nuevo donante.
 *
 * POST /donantes
 */
router.post(
  '/',
  donantesController.crearDonante
);

/**
 * Actualiza un donante.
 *
 * PUT /donantes/:id
 */
router.put(
  '/:id',
  donantesController.actualizarDonante
);

/**
 * Desactiva un donante.
 *
 * DELETE /donantes/:id
 */
router.delete(
  '/:id',
  donantesController.eliminarDonante
);

module.exports = router;