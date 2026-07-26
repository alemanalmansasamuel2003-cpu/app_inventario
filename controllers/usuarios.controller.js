/**
 * ============================================================
 * CONTROLADOR DE USUARIOS
 * ============================================================
 *
 * Funcionalidades:
 *
 * ✔ Obtener todos los usuarios.
 * ✔ Actualizar usuarios.
 * ✔ Eliminar usuarios.
 * ✔ Validar identificadores.
 * ✔ Validar correos duplicados.
 * ✔ Encriptar nuevas contraseñas.
 *
 * ============================================================
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * ============================================================
 * CONVERTIR IDENTIFICADOR
 * ============================================================
 *
 * Convierte un valor en un número entero positivo.
 * Devuelve null cuando no es válido.
 */
const convertirId = (valor) => {

  const id = Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
};

/**
 * ============================================================
 * OBTENER TODOS LOS USUARIOS
 * ============================================================
 *
 * GET /api/usuarios
 */
const obtenerUsuarios = async (
  req,
  res
) => {

  try {

    /**
     * No se devuelve la contraseña
     * por seguridad.
     *
     * La columna correcta es fecha_registro,
     * no fecha_creacion.
     */
    const [usuarios] =
      await db.query(
        `
        SELECT
          id_usuario,
          nombre,
          correo,
          rol,
          activo,
          fecha_registro,
          fecha_actualizacion
        FROM usuarios
        ORDER BY
          nombre ASC,
          id_usuario ASC
        `
      );

    return res.status(200).json({
      success: true,
      mensaje:
        'Usuarios obtenidos correctamente',
      data: usuarios,
    });

  } catch (error) {

    console.error(
      'Error al obtener usuarios:',
      error
    );

    return res.status(500).json({
      success: false,
      mensaje:
        error?.sqlMessage ||
        error?.message ||
        'Error al obtener usuarios',
    });
  }
};

/**
 * ============================================================
 * ACTUALIZAR USUARIO
 * ============================================================
 *
 * PUT /api/usuarios/:id
 */
const actualizarUsuario = async (
  req,
  res
) => {

  try {

    const idUsuario =
      convertirId(req.params.id);

    if (idUsuario === null) {

      return res.status(400).json({
        success: false,
        mensaje:
          'El identificador del usuario no es válido',
      });
    }

    const {
      nombre,
      correo,
      password,
      rol,
    } = req.body;

    const nombreLimpio =
      String(nombre || '').trim();

    const correoLimpio =
      String(correo || '')
        .trim()
        .toLowerCase();

    const rolLimpio =
      String(rol || '').trim();

    const passwordLimpio =
      String(password || '');

    /**
     * Validar campos obligatorios.
     */
    if (
      nombreLimpio.length === 0 ||
      correoLimpio.length === 0 ||
      rolLimpio.length === 0
    ) {

      return res.status(400).json({
        success: false,
        mensaje:
          'Nombre, correo y rol son obligatorios',
      });
    }

    /**
     * Validar formato básico del correo.
     */
    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !correoValido.test(
        correoLimpio
      )
    ) {

      return res.status(400).json({
        success: false,
        mensaje:
          'Ingrese un correo electrónico válido',
      });
    }

    /**
     * Validar roles permitidos.
     */
    const rolesPermitidos = [
      'Administrador',
      'Encargado',
    ];

    if (
      !rolesPermitidos.includes(
        rolLimpio
      )
    ) {

      return res.status(400).json({
        success: false,
        mensaje:
          'El rol seleccionado no es válido',
      });
    }

    /**
     * Verificar existencia.
     */
    const [usuarios] =
      await db.query(
        `
        SELECT
          id_usuario,
          correo
        FROM usuarios
        WHERE id_usuario = ?
        `,
        [idUsuario]
      );

    if (usuarios.length === 0) {

      return res.status(404).json({
        success: false,
        mensaje:
          'Usuario no encontrado',
      });
    }

    /**
     * Verificar que el correo no pertenezca
     * a otro usuario.
     */
    const [correoExistente] =
      await db.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE correo = ?
          AND id_usuario <> ?
        `,
        [
          correoLimpio,
          idUsuario,
        ]
      );

    if (
      correoExistente.length > 0
    ) {

      return res.status(400).json({
        success: false,
        mensaje:
          'El correo ya está registrado',
      });
    }

    /**
     * Actualizar incluyendo contraseña.
     */
    if (
      passwordLimpio.trim().length > 0
    ) {

      if (
        passwordLimpio.length < 6
      ) {

        return res.status(400).json({
          success: false,
          mensaje:
            'La contraseña debe contener al menos 6 caracteres',
        });
      }

      const passwordHash =
        await bcrypt.hash(
          passwordLimpio,
          10
        );

      await db.query(
        `
        UPDATE usuarios
        SET
          nombre = ?,
          correo = ?,
          password = ?,
          rol = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_usuario = ?
        `,
        [
          nombreLimpio,
          correoLimpio,
          passwordHash,
          rolLimpio,
          idUsuario,
        ]
      );

    } else {

      /**
       * Actualizar sin cambiar contraseña.
       */
      await db.query(
        `
        UPDATE usuarios
        SET
          nombre = ?,
          correo = ?,
          rol = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_usuario = ?
        `,
        [
          nombreLimpio,
          correoLimpio,
          rolLimpio,
          idUsuario,
        ]
      );
    }

    return res.status(200).json({
      success: true,
      mensaje:
        'Usuario actualizado correctamente',
    });

  } catch (error) {

    console.error(
      'Error al actualizar usuario:',
      error
    );

    return res.status(500).json({
      success: false,
      mensaje:
        error?.sqlMessage ||
        error?.message ||
        'Error al actualizar usuario',
    });
  }
};

/**
 * ============================================================
 * ELIMINAR USUARIO
 * ============================================================
 *
 * DELETE /api/usuarios/:id
 */
const eliminarUsuario = async (
  req,
  res
) => {

  try {

    const idUsuario =
      convertirId(req.params.id);

    if (idUsuario === null) {

      return res.status(400).json({
        success: false,
        mensaje:
          'El identificador del usuario no es válido',
      });
    }

    /**
     * Verificar que exista.
     */
    const [usuarios] =
      await db.query(
        `
        SELECT
          id_usuario,
          nombre
        FROM usuarios
        WHERE id_usuario = ?
        `,
        [idUsuario]
      );

    if (usuarios.length === 0) {

      return res.status(404).json({
        success: false,
        mensaje:
          'Usuario no encontrado',
      });
    }

    /**
     * Eliminar usuario.
     */
    await db.query(
      `
      DELETE FROM usuarios
      WHERE id_usuario = ?
      `,
      [idUsuario]
    );

    return res.status(200).json({
      success: true,
      mensaje:
        'Usuario eliminado correctamente',
    });

  } catch (error) {

    console.error(
      'Error al eliminar usuario:',
      error
    );

    /**
     * Puede ocurrir si el usuario está
     * relacionado con movimientos registrados.
     */
    if (
      error?.code ===
      'ER_ROW_IS_REFERENCED_2'
    ) {

      return res.status(409).json({
        success: false,
        mensaje:
          'No se puede eliminar el usuario porque tiene movimientos asociados.',
      });
    }

    return res.status(500).json({
      success: false,
      mensaje:
        error?.sqlMessage ||
        error?.message ||
        'Error al eliminar usuario',
    });
  }
};

/**
 * ============================================================
 * EXPORTACIONES
 * ============================================================
 */
module.exports = {
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario,
};