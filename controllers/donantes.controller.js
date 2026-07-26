const pool = require('../config/db');

/**
 * ============================================================
 * TIPOS DE DONANTE PERMITIDOS
 * ============================================================
 */
const TIPOS_DONANTE = [
  'PERSONA',
  'EMPRESA',
  'INSTITUCION',
  'ANONIMO'
];

/**
 * ============================================================
 * VALIDAR IDENTIFICADOR
 * ============================================================
 *
 * Convierte el identificador recibido en número
 * y verifica que sea un entero positivo.
 */
const obtenerIdValido = (valor) => {

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
 * NORMALIZAR TEXTO OPCIONAL
 * ============================================================
 *
 * Devuelve null cuando el valor está vacío.
 */
const normalizarTextoOpcional = (valor) => {

  const texto =
    String(valor ?? '').trim();

  return texto || null;
};

/**
 * ============================================================
 * NORMALIZAR CORREO
 * ============================================================
 */
const normalizarCorreo = (correo) => {

  const correoNormalizado =
    String(correo ?? '')
      .trim()
      .toLowerCase();

  return correoNormalizado || null;
};

/**
 * ============================================================
 * VALIDAR CORREO
 * ============================================================
 */
const correoValido = (correo) => {

  if (!correo) {
    return true;
  }

  const expresion =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return expresion.test(correo);
};

/**
 * ============================================================
 * OBTENER TODOS LOS DONANTES
 * ============================================================
 *
 * GET /api/donantes
 *
 * Devuelve únicamente los donantes activos.
 */
const obtenerDonantes = async (
  req,
  res
) => {

  try {

    const [donantes] =
      await pool.query(
        `
        SELECT
          id_donante,
          nombre,
          tipo_donante,
          identificacion,
          telefono,
          correo,
          direccion,
          observaciones,
          activo,
          fecha_registro
        FROM donantes
        WHERE activo = 1
        ORDER BY nombre ASC
        `
      );

    return res.status(200).json({
      success: true,
      message:
        'Donantes obtenidos correctamente.',
      data: donantes
    });

  } catch (error) {

    console.error(
      'Error al obtener donantes:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Error interno al obtener los donantes.'
    });
  }
};

/**
 * ============================================================
 * OBTENER DONANTE POR ID
 * ============================================================
 *
 * GET /api/donantes/:id
 */
const obtenerDonantePorId = async (
  req,
  res
) => {

  try {

    const idDonante =
      obtenerIdValido(req.params.id);

    if (!idDonante) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del donante no es válido.'
      });
    }

    const [donantes] =
      await pool.query(
        `
        SELECT
          id_donante,
          nombre,
          tipo_donante,
          identificacion,
          telefono,
          correo,
          direccion,
          observaciones,
          activo,
          fecha_registro
        FROM donantes
        WHERE id_donante = ?
        LIMIT 1
        `,
        [idDonante]
      );

    if (donantes.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          'Donante no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Donante obtenido correctamente.',
      data: donantes[0]
    });

  } catch (error) {

    console.error(
      'Error al obtener el donante:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Error interno al obtener el donante.'
    });
  }
};

/**
 * ============================================================
 * CREAR DONANTE
 * ============================================================
 *
 * POST /api/donantes
 */
const crearDonante = async (
  req,
  res
) => {

  try {

    const {
      nombre,
      tipo_donante,
      identificacion,
      telefono,
      correo,
      direccion,
      observaciones
    } = req.body;

    const nombreNormalizado =
      String(nombre ?? '').trim();

    const tipoNormalizado =
      String(
        tipo_donante ?? 'PERSONA'
      )
        .trim()
        .toUpperCase();

    const identificacionNormalizada =
      normalizarTextoOpcional(
        identificacion
      );

    const telefonoNormalizado =
      normalizarTextoOpcional(
        telefono
      );

    const correoNormalizado =
      normalizarCorreo(correo);

    const direccionNormalizada =
      normalizarTextoOpcional(
        direccion
      );

    const observacionesNormalizadas =
      normalizarTextoOpcional(
        observaciones
      );

    /**
     * Validación del nombre.
     */
    if (!nombreNormalizado) {

      return res.status(400).json({
        success: false,
        message:
          'El nombre del donante es obligatorio.'
      });
    }

    if (nombreNormalizado.length < 2) {

      return res.status(400).json({
        success: false,
        message:
          'El nombre debe contener al menos 2 caracteres.'
      });
    }

    /**
     * Validación del tipo.
     */
    if (
      !TIPOS_DONANTE.includes(
        tipoNormalizado
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El tipo de donante no es válido.'
      });
    }

    /**
     * Validación del correo.
     */
    if (
      correoNormalizado &&
      !correoValido(correoNormalizado)
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El correo electrónico no es válido.'
      });
    }

    /**
     * Comprueba identificación duplicada.
     */
    if (identificacionNormalizada) {

      const [existentes] =
        await pool.query(
          `
          SELECT id_donante
          FROM donantes
          WHERE identificacion = ?
          LIMIT 1
          `,
          [identificacionNormalizada]
        );

      if (existentes.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            'Ya existe un donante con esa identificación.'
        });
      }
    }

    const [resultado] =
      await pool.query(
        `
        INSERT INTO donantes (
          nombre,
          tipo_donante,
          identificacion,
          telefono,
          correo,
          direccion,
          observaciones,
          activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          nombreNormalizado,
          tipoNormalizado,
          identificacionNormalizada,
          telefonoNormalizado,
          correoNormalizado,
          direccionNormalizada,
          observacionesNormalizadas
        ]
      );

    const [nuevoDonante] =
      await pool.query(
        `
        SELECT
          id_donante,
          nombre,
          tipo_donante,
          identificacion,
          telefono,
          correo,
          direccion,
          observaciones,
          activo,
          fecha_registro
        FROM donantes
        WHERE id_donante = ?
        LIMIT 1
        `,
        [resultado.insertId]
      );

    return res.status(201).json({
      success: true,
      message:
        'Donante registrado correctamente.',
      data: nuevoDonante[0]
    });

  } catch (error) {

    console.error(
      'Error al crear donante:',
      error
    );

    /**
     * Control adicional para restricciones
     * UNIQUE de MySQL.
     */
    if (error?.code === 'ER_DUP_ENTRY') {

      return res.status(409).json({
        success: false,
        message:
          'Ya existe un donante con esos datos.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Error interno al registrar el donante.'
    });
  }
};

/**
 * ============================================================
 * ACTUALIZAR DONANTE
 * ============================================================
 *
 * PUT /api/donantes/:id
 */
const actualizarDonante = async (
  req,
  res
) => {

  try {

    const idDonante =
      obtenerIdValido(req.params.id);

    if (!idDonante) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del donante no es válido.'
      });
    }

    const {
      nombre,
      tipo_donante,
      identificacion,
      telefono,
      correo,
      direccion,
      observaciones,
      activo
    } = req.body;

    const nombreNormalizado =
      String(nombre ?? '').trim();

    const tipoNormalizado =
      String(
        tipo_donante ?? 'PERSONA'
      )
        .trim()
        .toUpperCase();

    const identificacionNormalizada =
      normalizarTextoOpcional(
        identificacion
      );

    const telefonoNormalizado =
      normalizarTextoOpcional(
        telefono
      );

    const correoNormalizado =
      normalizarCorreo(correo);

    const direccionNormalizada =
      normalizarTextoOpcional(
        direccion
      );

    const observacionesNormalizadas =
      normalizarTextoOpcional(
        observaciones
      );

    const [donanteExistente] =
      await pool.query(
        `
        SELECT
          id_donante,
          activo
        FROM donantes
        WHERE id_donante = ?
        LIMIT 1
        `,
        [idDonante]
      );

    if (
      donanteExistente.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          'Donante no encontrado.'
      });
    }

    if (!nombreNormalizado) {

      return res.status(400).json({
        success: false,
        message:
          'El nombre del donante es obligatorio.'
      });
    }

    if (nombreNormalizado.length < 2) {

      return res.status(400).json({
        success: false,
        message:
          'El nombre debe contener al menos 2 caracteres.'
      });
    }

    if (
      !TIPOS_DONANTE.includes(
        tipoNormalizado
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El tipo de donante no es válido.'
      });
    }

    if (
      correoNormalizado &&
      !correoValido(correoNormalizado)
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El correo electrónico no es válido.'
      });
    }

    /**
     * Comprueba que la identificación
     * no pertenezca a otro donante.
     */
    if (identificacionNormalizada) {

      const [duplicados] =
        await pool.query(
          `
          SELECT id_donante
          FROM donantes
          WHERE identificacion = ?
            AND id_donante <> ?
          LIMIT 1
          `,
          [
            identificacionNormalizada,
            idDonante
          ]
        );

      if (duplicados.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            'La identificación pertenece a otro donante.'
        });
      }
    }

    /**
     * Si activo no viene en el cuerpo,
     * conserva el estado actual.
     */
    const activoActual =
      Number(
        donanteExistente[0].activo
      ) === 1
        ? 1
        : 0;

    const activoNormalizado =
      activo === undefined ||
      activo === null
        ? activoActual
        : (
            activo === false ||
            activo === 0 ||
            activo === '0'
              ? 0
              : 1
          );

    await pool.query(
      `
      UPDATE donantes
      SET
        nombre = ?,
        tipo_donante = ?,
        identificacion = ?,
        telefono = ?,
        correo = ?,
        direccion = ?,
        observaciones = ?,
        activo = ?
      WHERE id_donante = ?
      `,
      [
        nombreNormalizado,
        tipoNormalizado,
        identificacionNormalizada,
        telefonoNormalizado,
        correoNormalizado,
        direccionNormalizada,
        observacionesNormalizadas,
        activoNormalizado,
        idDonante
      ]
    );

    const [donanteActualizado] =
      await pool.query(
        `
        SELECT
          id_donante,
          nombre,
          tipo_donante,
          identificacion,
          telefono,
          correo,
          direccion,
          observaciones,
          activo,
          fecha_registro
        FROM donantes
        WHERE id_donante = ?
        LIMIT 1
        `,
        [idDonante]
      );

    return res.status(200).json({
      success: true,
      message:
        'Donante actualizado correctamente.',
      data: donanteActualizado[0]
    });

  } catch (error) {

    console.error(
      'Error al actualizar donante:',
      error
    );

    if (error?.code === 'ER_DUP_ENTRY') {

      return res.status(409).json({
        success: false,
        message:
          'Ya existe otro donante con esos datos.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Error interno al actualizar el donante.'
    });
  }
};

/**
 * ============================================================
 * ELIMINAR DONANTE
 * ============================================================
 *
 * DELETE /api/donantes/:id
 *
 * Realiza una eliminación lógica, cambiando
 * el campo activo a 0.
 */
const eliminarDonante = async (
  req,
  res
) => {

  try {

    const idDonante =
      obtenerIdValido(req.params.id);

    if (!idDonante) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del donante no es válido.'
      });
    }

    const [donantes] =
      await pool.query(
        `
        SELECT
          id_donante,
          activo
        FROM donantes
        WHERE id_donante = ?
        LIMIT 1
        `,
        [idDonante]
      );

    if (donantes.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          'Donante no encontrado.'
      });
    }

    if (
      Number(donantes[0].activo) === 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El donante ya se encuentra desactivado.'
      });
    }

    await pool.query(
      `
      UPDATE donantes
      SET activo = 0
      WHERE id_donante = ?
      `,
      [idDonante]
    );

    return res.status(200).json({
      success: true,
      message:
        'Donante desactivado correctamente.'
    });

  } catch (error) {

    console.error(
      'Error al eliminar donante:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Error interno al eliminar el donante.'
    });
  }
};

/**
 * ============================================================
 * EXPORTACIONES
 * ============================================================
 */
module.exports = {
  obtenerDonantes,
  obtenerDonantePorId,
  crearDonante,
  actualizarDonante,
  eliminarDonante
};