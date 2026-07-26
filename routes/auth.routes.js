/**
 * ============================================================
 * RUTAS DE AUTENTICACIÓN
 * ============================================================
 */

const express = require('express');

const router = express.Router();

const authController =
    require('../controllers/auth.controller');

/**
 * Registrar usuario.
 *
 * POST /api/auth/register
 */
router.post(
    '/register',
    authController.register
);

/**
 * Iniciar sesión.
 *
 * POST /api/auth/login
 */
router.post(
    '/login',
    authController.login
);

/**
 * Cambiar contraseña directamente.
 *
 * PUT /api/auth/password
 */
router.put(
    '/password',
    authController.cambiarPassword
);

/**
 * Solicitar código de recuperación.
 *
 * POST /api/auth/recuperar-password
 */
router.post(
    '/recuperar-password',
    authController.solicitarRecuperacion
);

/**
 * Verificar código de recuperación.
 *
 * POST /api/auth/verificar-codigo
 */
router.post(
    '/verificar-codigo',
    authController.verificarCodigoRecuperacion
);

/**
 * Restablecer contraseña.
 *
 * POST /api/auth/restablecer-password
 */
router.post(
    '/restablecer-password',
    authController.restablecerPassword
);

/**
 * Obtener perfil.
 *
 * GET /api/auth/perfil/:id_usuario
 */
router.get(
    '/perfil/:id_usuario',
    authController.obtenerPerfil
);

/**
 * Actualizar perfil.
 *
 * PUT /api/auth/perfil/:id_usuario
 */
router.put(
    '/perfil/:id_usuario',
    authController.actualizarPerfil
);

/**
 * Activar o desactivar usuario.
 *
 * PUT /api/auth/estado/:id_usuario
 */
router.put(
    '/estado/:id_usuario',
    authController.cambiarEstadoUsuario
);

/**
 * Eliminar códigos vencidos.
 *
 * DELETE /api/auth/codigos-vencidos
 */
router.delete(
    '/codigos-vencidos',
    authController.eliminarCodigosVencidos
);

module.exports = router;