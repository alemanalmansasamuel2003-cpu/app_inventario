const pool = require('../config/db');

/**
 * ============================================================
 * CONTROLADOR DE MOVIMIENTOS
 * ============================================================
 */

/**
 * Convierte un valor a un identificador entero positivo.
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
 * OBTENER TODOS LOS MOVIMIENTOS
 * ============================================================
 *
 * GET /api/movimientos
 */
const obtenerMovimientos = async (req, res) => {

  try {

    const [movimientos] = await pool.query(
      `
      SELECT
        m.id_movimiento,
        m.id_producto,
        m.id_usuario,
        m.id_donacion,
        m.tipo_movimiento,
        m.cantidad,
        m.cantidad_anterior AS existencia_anterior,
        m.cantidad_nueva AS existencia_resultante,
        m.motivo,
        m.destinatario,
        m.fecha_movimiento,
        m.observaciones,
        p.nombre AS nombre_producto,
        p.unidad_medida,
        u.nombre AS nombre_usuario

      FROM movimientos AS m

      INNER JOIN productos AS p
        ON p.id_producto = m.id_producto

      LEFT JOIN usuarios AS u
        ON u.id_usuario = m.id_usuario

      ORDER BY
        m.fecha_movimiento DESC,
        m.id_movimiento DESC
      `
    );

    return res.status(200).json({
      success: true,
      message:
        'Movimientos obtenidos correctamente',
      data: movimientos,
    });

  } catch (error) {

    console.error(
      'Error al obtener movimientos:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al obtener los movimientos',
    });
  }
};

/**
 * ============================================================
 * OBTENER MOVIMIENTO POR ID
 * ============================================================
 *
 * GET /api/movimientos/:id
 */
const obtenerMovimientoPorId = async (req, res) => {

  try {

    const idMovimiento =
      convertirId(req.params.id);

    if (idMovimiento === null) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del movimiento no es válido',
      });
    }

    const [movimientos] = await pool.query(
      `
      SELECT
        m.id_movimiento,
        m.id_producto,
        m.id_usuario,
        m.id_donacion,
        m.tipo_movimiento,
        m.cantidad,
        m.cantidad_anterior AS existencia_anterior,
        m.cantidad_nueva AS existencia_resultante,
        m.motivo,
        m.destinatario,
        m.fecha_movimiento,
        m.observaciones,
        p.nombre AS nombre_producto,
        p.descripcion AS descripcion_producto,
        p.unidad_medida,
        u.nombre AS nombre_usuario

      FROM movimientos AS m

      INNER JOIN productos AS p
        ON p.id_producto = m.id_producto

      LEFT JOIN usuarios AS u
        ON u.id_usuario = m.id_usuario

      WHERE m.id_movimiento = ?
      `,
      [idMovimiento]
    );

    if (movimientos.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          'Movimiento no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: movimientos[0],
    });

  } catch (error) {

    console.error(
      'Error al obtener movimiento:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al obtener el movimiento',
    });
  }
};

/**
 * ============================================================
 * OBTENER MOVIMIENTOS POR PRODUCTO
 * ============================================================
 *
 * GET /api/movimientos/producto/:id
 */
const obtenerMovimientosPorProducto = async (
  req,
  res
) => {

  try {

    const idProducto =
      convertirId(req.params.id);

    if (idProducto === null) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del producto no es válido',
      });
    }

    const [productos] = await pool.query(
      `
      SELECT id_producto
      FROM productos
      WHERE id_producto = ?
      `,
      [idProducto]
    );

    if (productos.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado',
      });
    }

    const [movimientos] = await pool.query(
      `
      SELECT
        m.id_movimiento,
        m.id_producto,
        m.id_usuario,
        m.id_donacion,
        m.tipo_movimiento,
        m.cantidad,
        m.cantidad_anterior AS existencia_anterior,
        m.cantidad_nueva AS existencia_resultante,
        m.motivo,
        m.destinatario,
        m.fecha_movimiento,
        m.observaciones,
        p.nombre AS nombre_producto,
        p.unidad_medida,
        u.nombre AS nombre_usuario

      FROM movimientos AS m

      INNER JOIN productos AS p
        ON p.id_producto = m.id_producto

      LEFT JOIN usuarios AS u
        ON u.id_usuario = m.id_usuario

      WHERE m.id_producto = ?

      ORDER BY
        m.fecha_movimiento DESC,
        m.id_movimiento DESC
      `,
      [idProducto]
    );

    return res.status(200).json({
      success: true,
      data: movimientos,
    });

  } catch (error) {

    console.error(
      'Error al obtener movimientos del producto:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al obtener el historial del producto',
    });
  }
};

/**
 * ============================================================
 * REGISTRAR ENTRADA
 * ============================================================
 *
 * POST /api/movimientos/entrada
 *
 * Permite registrar:
 *
 * - Entradas normales.
 * - Entradas procedentes de donaciones.
 * - Documento automático para donaciones.
 * - Estado automático Registrada.
 */
const registrarEntrada = async (req, res) => {

  let connection;

  try {

    const {
      id_producto,
      id_usuario,
      id_donacion,
      id_donante,
      origen,
      cantidad,
      motivo,
      observaciones,
      detalle,
      fecha_vencimiento,
    } = req.body;

    const idProducto =
      convertirId(id_producto);

    const idUsuario =
      id_usuario !== undefined &&
      id_usuario !== null &&
      id_usuario !== ''
        ? convertirId(id_usuario)
        : null;

    const idDonacionRecibida =
      id_donacion !== undefined &&
      id_donacion !== null &&
      id_donacion !== ''
        ? convertirId(id_donacion)
        : null;

    const idDonante =
      id_donante !== undefined &&
      id_donante !== null &&
      id_donante !== ''
        ? convertirId(id_donante)
        : null;

    const cantidadNumerica =
      Number(cantidad);

    const motivoLimpio =
      String(motivo || '').trim();

    const detalleLimpio =
      String(
        detalle ||
        observaciones ||
        ''
      ).trim();

    const fechaVencimientoLimpia =
      String(
        fecha_vencimiento || ''
      ).trim();

    const origenNormalizado =
      String(origen || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

    /*
     * Una entrada solo se considera donación formal cuando:
     *
     * - La pantalla envía origen = DONACION.
     * - Se selecciona un donante.
     * - Se envía una donación existente.
     *
     * Escribir "Donación" en el motivo no obliga
     * a seleccionar un donante.
     */
    const esDonacion =
      origenNormalizado === 'DONACION' ||
      idDonante !== null ||
      idDonacionRecibida !== null;

    if (idProducto === null) {

      return res.status(400).json({
        success: false,
        message:
          'Debe seleccionar un producto válido',
      });
    }

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          'La cantidad debe ser un número entero mayor que cero',
      });
    }

    if (motivoLimpio.length === 0) {

      return res.status(400).json({
        success: false,
        message:
          'El motivo de la entrada es obligatorio',
      });
    }

    if (
      id_usuario !== undefined &&
      id_usuario !== null &&
      id_usuario !== '' &&
      idUsuario === null
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del usuario no es válido',
      });
    }

    if (
      id_donacion !== undefined &&
      id_donacion !== null &&
      id_donacion !== '' &&
      idDonacionRecibida === null
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador de la donación no es válido',
      });
    }

    if (
      id_donante !== undefined &&
      id_donante !== null &&
      id_donante !== '' &&
      idDonante === null
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del donante no es válido',
      });
    }

    if (
      origenNormalizado === 'DONACION' &&
      idDonacionRecibida === null &&
      idDonante === null
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Debe seleccionar el donante',
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [productos] =
      await connection.query(
        `
        SELECT
          id_producto,
          nombre,
          cantidad,
          unidad_medida

        FROM productos

        WHERE id_producto = ?

        FOR UPDATE
        `,
        [idProducto]
      );

    if (productos.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          'El producto seleccionado no existe',
      });
    }

    if (idUsuario !== null) {

      const [usuarios] =
        await connection.query(
          `
          SELECT id_usuario
          FROM usuarios
          WHERE id_usuario = ?
          `,
          [idUsuario]
        );

      if (usuarios.length === 0) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            'El usuario seleccionado no existe',
        });
      }
    }

    let idDonacionFinal =
      idDonacionRecibida;

    let idDonanteFinal =
      idDonante;

    let nombreDonante =
      null;

    let numeroDocumentoFinal =
      null;

    let estadoDonacionFinal =
      null;

    /*
     * Consultar una donación existente.
     */
    if (idDonacionRecibida !== null) {

      const [donacionesExistentes] =
        await connection.query(
          `
          SELECT
            d.id_donacion,
            d.id_donante,
            d.numero_documento,
            d.estado,
            dn.nombre AS nombre_donante

          FROM donaciones AS d

          LEFT JOIN donantes AS dn
            ON dn.id_donante = d.id_donante

          WHERE d.id_donacion = ?

          FOR UPDATE
          `,
          [idDonacionRecibida]
        );

      if (donacionesExistentes.length === 0) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            'La donación seleccionada no existe',
        });
      }

      const donacionExistente =
        donacionesExistentes[0];

      const estadoNormalizado =
        String(
          donacionExistente.estado || ''
        )
          .trim()
          .toUpperCase();

      if (estadoNormalizado === 'ANULADA') {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            'No se pueden agregar productos a una donación anulada',
        });
      }

      idDonanteFinal =
        donacionExistente.id_donante;

      nombreDonante =
        donacionExistente.nombre_donante ||
        null;

      numeroDocumentoFinal =
        donacionExistente.numero_documento ||
        null;

      estadoDonacionFinal =
        donacionExistente.estado ||
        'Registrada';
    }

    /*
     * Crear una donación nueva.
     */
    if (
      esDonacion &&
      idDonacionRecibida === null
    ) {

      const [donantes] =
        await connection.query(
          `
          SELECT
            id_donante,
            nombre,
            activo

          FROM donantes

          WHERE id_donante = ?
          `,
          [idDonante]
        );

      if (donantes.length === 0) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            'El donante seleccionado no existe',
        });
      }

      if (
        donantes[0].activo !== null &&
        donantes[0].activo !== undefined &&
        Number(donantes[0].activo) !== 1
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            'El donante seleccionado está inactivo',
        });
      }

      nombreDonante =
        donantes[0].nombre;

      estadoDonacionFinal =
        'Registrada';

      /*
       * Crear primero la donación para obtener
       * el ID generado automáticamente.
       */
      const [resultadoDonacion] =
        await connection.query(
          `
          INSERT INTO donaciones (
            id_donante,
            id_usuario,
            fecha_donacion,
            numero_documento,
            observaciones,
            estado
          )
          VALUES (
            ?,
            ?,
            NOW(),
            NULL,
            ?,
            ?
          )
          `,
          [
            idDonante,
            idUsuario,
            detalleLimpio || null,
            estadoDonacionFinal,
          ]
        );

      idDonacionFinal =
        resultadoDonacion.insertId;

      /*
       * Obtener la fecha almacenada en MySQL.
       */
      const [fechaDonacion] =
        await connection.query(
          `
          SELECT
            DATE_FORMAT(
              fecha_donacion,
              '%Y%m%d'
            ) AS fecha_documento

          FROM donaciones

          WHERE id_donacion = ?
          `,
          [idDonacionFinal]
        );

      const fechaDocumento =
        String(
          fechaDonacion[0].fecha_documento
        );

      const consecutivo =
        String(
          idDonacionFinal
        ).padStart(
          6,
          '0'
        );

      /*
       * Ejemplo:
       * HBS-DON-20260726-000001
       */
      numeroDocumentoFinal =
        `HBS-DON-${fechaDocumento}-${consecutivo}`;

      /*
       * Guardar documento y estado.
       */
      await connection.query(
        `
        UPDATE donaciones
        SET
          numero_documento = ?,
          estado = ?
        WHERE id_donacion = ?
        `,
        [
          numeroDocumentoFinal,
          estadoDonacionFinal,
          idDonacionFinal,
        ]
      );
    }

    /*
     * Guardar detalle de la donación.
     */
    if (
      esDonacion &&
      idDonacionFinal !== null
    ) {

      await connection.query(
        `
        INSERT INTO detalle_donaciones (
          id_donacion,
          id_producto,
          cantidad,
          fecha_vencimiento,
          observaciones
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          idDonacionFinal,
          idProducto,
          cantidadNumerica,
          fechaVencimientoLimpia || null,
          detalleLimpio || null,
        ]
      );
    }

    const cantidadAnterior =
      Number(
        productos[0].cantidad
      );

    const cantidadNueva =
      cantidadAnterior +
      cantidadNumerica;

    /*
     * Actualizar la existencia.
     */
    await connection.query(
      `
      UPDATE productos
      SET cantidad = ?
      WHERE id_producto = ?
      `,
      [
        cantidadNueva,
        idProducto,
      ]
    );

    /*
     * Registrar movimiento.
     */
    const [resultadoMovimiento] =
      await connection.query(
        `
        INSERT INTO movimientos (
          id_producto,
          id_usuario,
          id_donacion,
          tipo_movimiento,
          cantidad,
          cantidad_anterior,
          cantidad_nueva,
          motivo,
          destinatario,
          observaciones,
          fecha_movimiento
        )
        VALUES (
          ?,
          ?,
          ?,
          'ENTRADA',
          ?,
          ?,
          ?,
          ?,
          NULL,
          ?,
          NOW()
        )
        `,
        [
          idProducto,
          idUsuario,
          idDonacionFinal,
          cantidadNumerica,
          cantidadAnterior,
          cantidadNueva,
          esDonacion
            ? 'Donación'
            : motivoLimpio,
          detalleLimpio || null,
        ]
      );

    await connection.commit();

    return res.status(201).json({
      success: true,

      message:
        esDonacion
          ? `Donación ${numeroDocumentoFinal || ''} registrada correctamente`
          : 'Entrada registrada correctamente',

      data: {
        id_movimiento:
          resultadoMovimiento.insertId,

        id_producto:
          idProducto,

        nombre_producto:
          productos[0].nombre,

        id_usuario:
          idUsuario,

        id_donacion:
          idDonacionFinal,

        numero_documento:
          numeroDocumentoFinal,

        estado:
          estadoDonacionFinal,

        id_donante:
          idDonanteFinal,

        nombre_donante:
          nombreDonante,

        tipo_movimiento:
          'ENTRADA',

        cantidad:
          cantidadNumerica,

        existencia_anterior:
          cantidadAnterior,

        existencia_resultante:
          cantidadNueva,

        unidad_medida:
          productos[0].unidad_medida,

        detalle:
          detalleLimpio || null,

        fecha_vencimiento:
          fechaVencimientoLimpia || null,
      },
    });

  } catch (error) {

    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.error(
          'Error al revertir la entrada:',
          rollbackError
        );
      }
    }

    console.error(
      'Error al registrar entrada:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al registrar la entrada',
    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
/**
 * ============================================================
 * REGISTRAR SALIDA
 * ============================================================
 *
 * POST /api/movimientos/salida
 */
const registrarSalida = async (req, res) => {

  let connection;

  try {

    const {
      id_producto,
      id_usuario,
      cantidad,
      motivo,
      destinatario,
      observaciones,
      detalle,
    } = req.body;

    const idProducto =
      convertirId(id_producto);

    const idUsuario =
      id_usuario !== undefined &&
      id_usuario !== null &&
      id_usuario !== ''
        ? convertirId(id_usuario)
        : null;

    const cantidadNumerica =
      Number(cantidad);

    const motivoLimpio =
      String(motivo || '').trim();

    const destinatarioLimpio =
      String(destinatario || '').trim();

    const detalleLimpio =
      String(
        detalle ||
        observaciones ||
        ''
      ).trim();

    if (idProducto === null) {

      return res.status(400).json({
        success: false,
        message:
          'Debe seleccionar un producto válido',
      });
    }

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          'La cantidad debe ser un número entero mayor que cero',
      });
    }

    if (motivoLimpio.length === 0) {

      return res.status(400).json({
        success: false,
        message:
          'El motivo de la salida es obligatorio',
      });
    }

    if (
      id_usuario !== undefined &&
      id_usuario !== null &&
      id_usuario !== '' &&
      idUsuario === null
    ) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del usuario no es válido',
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [productos] = await connection.query(
      `
      SELECT
        id_producto,
        nombre,
        cantidad,
        unidad_medida

      FROM productos

      WHERE id_producto = ?

      FOR UPDATE
      `,
      [idProducto]
    );

    if (productos.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado',
      });
    }

    if (idUsuario !== null) {

      const [usuarios] = await connection.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE id_usuario = ?
        `,
        [idUsuario]
      );

      if (usuarios.length === 0) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            'El usuario seleccionado no existe',
        });
      }
    }

    const cantidadAnterior =
      Number(productos[0].cantidad);

    if (
      cantidadNumerica >
      cantidadAnterior
    ) {

      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Inventario insuficiente. Disponible: ${cantidadAnterior} ${productos[0].unidad_medida}`,
      });
    }

    const cantidadNueva =
      cantidadAnterior -
      cantidadNumerica;

    await connection.query(
      `
      UPDATE productos
      SET cantidad = ?
      WHERE id_producto = ?
      `,
      [
        cantidadNueva,
        idProducto,
      ]
    );

    const [resultado] = await connection.query(
      `
      INSERT INTO movimientos (
        id_producto,
        id_usuario,
        id_donacion,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        destinatario,
        observaciones,
        fecha_movimiento
      )
      VALUES (
        ?,
        ?,
        NULL,
        'SALIDA',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        NOW()
      )
      `,
      [
        idProducto,
        idUsuario,
        cantidadNumerica,
        cantidadAnterior,
        cantidadNueva,
        motivoLimpio,
        destinatarioLimpio || null,
        detalleLimpio || null,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        'Salida registrada correctamente',

      data: {
        id_movimiento:
          resultado.insertId,

        id_producto:
          idProducto,

        nombre_producto:
          productos[0].nombre,

        id_usuario:
          idUsuario,

        tipo_movimiento:
          'SALIDA',

        cantidad:
          cantidadNumerica,

        existencia_anterior:
          cantidadAnterior,

        existencia_resultante:
          cantidadNueva,

        destinatario:
          destinatarioLimpio || null,

        detalle:
          detalleLimpio || null,
      },
    });

  } catch (error) {

    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.error(
          'Error al revertir la salida:',
          rollbackError
        );
      }
    }

    console.error(
      'Error al registrar salida:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al registrar la salida',
    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
};

/**
 * ============================================================
 * OBTENER HISTORIAL DE DONACIONES
 * ============================================================
 *
 * GET /api/movimientos/donaciones
 */
const obtenerDonaciones = async (req, res) => {

  try {

    const [donaciones] = await pool.query(
      `
      SELECT *
      FROM vw_historial_donaciones
      ORDER BY
        fecha_donacion DESC,
        id_donacion DESC
      `
    );

    return res.status(200).json({
      success: true,
      message:
        'Historial de donaciones obtenido correctamente',
      data: donaciones,
    });

  } catch (error) {

    console.error(
      'Error al obtener donaciones:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al obtener las donaciones',
    });
  }
};

/**
 * ============================================================
 * OBTENER DONACIONES POR DONANTE
 * ============================================================
 *
 * GET /api/movimientos/donaciones/donante/:id
 */
const obtenerDonacionesPorDonante = async (
  req,
  res
) => {

  try {

    const idDonante =
      convertirId(req.params.id);

    if (idDonante === null) {

      return res.status(400).json({
        success: false,
        message:
          'El identificador del donante no es válido',
      });
    }

    const [donantes] = await pool.query(
      `
      SELECT
        id_donante,
        nombre

      FROM donantes

      WHERE id_donante = ?
      `,
      [idDonante]
    );

    if (donantes.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          'Donante no encontrado',
      });
    }

    const [donaciones] = await pool.query(
      `
      SELECT *
      FROM vw_historial_donaciones

      WHERE id_donante = ?

      ORDER BY
        fecha_donacion DESC,
        id_donacion DESC
      `,
      [idDonante]
    );

    return res.status(200).json({
      success: true,
      message:
        'Donaciones del donante obtenidas correctamente',
      data: donaciones,
    });

  } catch (error) {

    console.error(
      'Error al obtener donaciones del donante:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        'Error interno al obtener las donaciones del donante',
    });
  }
};

/**
 * ============================================================
 * EXPORTACIONES
 * ============================================================
 */
module.exports = {
  obtenerMovimientos,
  obtenerMovimientoPorId,
  obtenerMovimientosPorProducto,
  registrarEntrada,
  registrarSalida,
  obtenerDonaciones,
  obtenerDonacionesPorDonante,
};