const db = require('../config/db');

/**
 * ============================================================
 * OBTENER TODOS LOS PRODUCTOS ACTIVOS
 * ============================================================
 */
const obtenerProductos = async (req, res) => {
    try {

        const sql = `
            SELECT
                p.*,
                c.nombre AS nombre_categoria
            FROM productos p
            LEFT JOIN categorias c
                ON p.id_categoria = c.id_categoria
            WHERE p.activo = 1
            ORDER BY p.id_producto DESC
        `;

        const [productos] = await db.query(sql);

        return res.status(200).json({
            success: true,
            data: productos
        });

    } catch (error) {

        console.error(
            'ERROR AL OBTENER PRODUCTOS:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los productos.',
            error: error.message
        });
    }
};

/**
 * ============================================================
 * CREAR PRODUCTO
 * ============================================================
 */
const crearProducto = async (req, res) => {
    try {

        const {
            nombre,
            descripcion,
            cantidad,
            unidad_medida,
            stock_minimo,
            fecha_vencimiento,
            id_categoria
        } = req.body;

        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del producto es obligatorio.'
            });
        }

        if (!unidad_medida || !String(unidad_medida).trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'La unidad de medida es obligatoria.'
            });
        }

        const cantidadValida = Number(cantidad);
        const stockMinimoValido = Number(stock_minimo);

        if (
            !Number.isInteger(cantidadValida) ||
            cantidadValida < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'La cantidad debe ser un número entero mayor o igual a cero.'
            });
        }

        if (
            !Number.isInteger(stockMinimoValido) ||
            stockMinimoValido < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El stock mínimo debe ser un número entero mayor o igual a cero.'
            });
        }

        const descripcionValida =
            descripcion && String(descripcion).trim()
                ? String(descripcion).trim()
                : null;

        const fechaValida =
            fecha_vencimiento &&
            String(fecha_vencimiento).trim()
                ? String(fecha_vencimiento).trim()
                : null;

        const categoriaValida =
            id_categoria !== undefined &&
            id_categoria !== null &&
            String(id_categoria).trim() !== ''
                ? Number(id_categoria)
                : null;

        if (
            categoriaValida !== null &&
            (
                !Number.isInteger(categoriaValida) ||
                categoriaValida <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría seleccionada no es válida.'
            });
        }

        const sql = `
            INSERT INTO productos (
                nombre,
                descripcion,
                cantidad,
                unidad_medida,
                stock_minimo,
                fecha_vencimiento,
                id_categoria,
                activo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;

        const [resultado] = await db.query(sql, [
            String(nombre).trim(),
            descripcionValida,
            cantidadValida,
            String(unidad_medida).trim(),
            stockMinimoValido,
            fechaValida,
            categoriaValida
        ]);

        return res.status(201).json({
            success: true,
            mensaje: 'Producto registrado correctamente.',
            id_producto: resultado.insertId
        });

    } catch (error) {

        console.error(
            'ERROR AL REGISTRAR PRODUCTO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el producto.',
            error: error.message
        });
    }
};

/**
 * ============================================================
 * OBTENER PRODUCTO POR ID
 * ============================================================
 *
 * También permite consultar productos inactivos para que
 * el historial de movimientos continúe mostrando sus datos.
 */
const obtenerProductoPorId = async (req, res) => {
    try {

        const idProducto = Number(req.params.id);

        if (
            !Number.isInteger(idProducto) ||
            idProducto <= 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'El ID del producto no es válido.'
            });
        }

        const [productos] = await db.query(
            `
            SELECT
                p.*,
                c.nombre AS nombre_categoria
            FROM productos p
            LEFT JOIN categorias c
                ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?
            `,
            [idProducto]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Producto no encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            data: productos[0]
        });

    } catch (error) {

        console.error(
            'ERROR AL OBTENER PRODUCTO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener el producto.',
            error: error.message
        });
    }
};

/**
 * ============================================================
 * ACTUALIZAR PRODUCTO
 * ============================================================
 */
const actualizarProducto = async (req, res) => {
    try {

        const idProducto = Number(req.params.id);

        const {
            nombre,
            descripcion,
            cantidad,
            unidad_medida,
            stock_minimo,
            fecha_vencimiento,
            id_categoria
        } = req.body;

        if (
            !Number.isInteger(idProducto) ||
            idProducto <= 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'El ID del producto no es válido.'
            });
        }

        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del producto es obligatorio.'
            });
        }

        if (!unidad_medida || !String(unidad_medida).trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'La unidad de medida es obligatoria.'
            });
        }

        const [productoExistente] = await db.query(
            `
            SELECT id_producto, activo
            FROM productos
            WHERE id_producto = ?
            `,
            [idProducto]
        );

        if (productoExistente.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Producto no encontrado.'
            });
        }

        if (Number(productoExistente[0].activo) === 0) {
            return res.status(409).json({
                success: false,
                mensaje:
                    'No se puede editar un producto eliminado.'
            });
        }

        const cantidadValida = Number(cantidad);
        const stockMinimoValido = Number(stock_minimo);

        if (
            !Number.isInteger(cantidadValida) ||
            cantidadValida < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'La cantidad debe ser un número entero mayor o igual a cero.'
            });
        }

        if (
            !Number.isInteger(stockMinimoValido) ||
            stockMinimoValido < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El stock mínimo debe ser un número entero mayor o igual a cero.'
            });
        }

        const descripcionValida =
            descripcion && String(descripcion).trim()
                ? String(descripcion).trim()
                : null;

        const fechaValida =
            fecha_vencimiento &&
            String(fecha_vencimiento).trim()
                ? String(fecha_vencimiento).trim()
                : null;

        const categoriaValida =
            id_categoria !== undefined &&
            id_categoria !== null &&
            String(id_categoria).trim() !== ''
                ? Number(id_categoria)
                : null;

        if (
            categoriaValida !== null &&
            (
                !Number.isInteger(categoriaValida) ||
                categoriaValida <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría seleccionada no es válida.'
            });
        }

        const [resultado] = await db.query(
            `
            UPDATE productos
            SET
                nombre = ?,
                descripcion = ?,
                cantidad = ?,
                unidad_medida = ?,
                stock_minimo = ?,
                fecha_vencimiento = ?,
                id_categoria = ?
            WHERE id_producto = ?
              AND activo = 1
            `,
            [
                String(nombre).trim(),
                descripcionValida,
                cantidadValida,
                String(unidad_medida).trim(),
                stockMinimoValido,
                fechaValida,
                categoriaValida,
                idProducto
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje:
                    'No se encontró un producto activo para actualizar.'
            });
        }

        return res.status(200).json({
            success: true,
            mensaje: 'Producto actualizado correctamente.'
        });

    } catch (error) {

        console.error(
            'ERROR AL ACTUALIZAR PRODUCTO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el producto.',
            error: error.message
        });
    }
};

/**
 * ============================================================
 * ELIMINAR PRODUCTO
 * ============================================================
 *
 * Realiza un borrado lógico:
 *
 * - No elimina el registro de la tabla productos.
 * - No elimina los movimientos.
 * - Marca el producto como inactivo.
 * - El producto deja de aparecer en la lista principal.
 */
const eliminarProducto = async (req, res) => {
    try {

        const idProducto = Number(req.params.id);

        if (
            !Number.isInteger(idProducto) ||
            idProducto <= 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'El ID del producto no es válido.'
            });
        }

        const [productos] = await db.query(
            `
            SELECT
                id_producto,
                nombre,
                activo
            FROM productos
            WHERE id_producto = ?
            `,
            [idProducto]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Producto no encontrado.'
            });
        }

        if (Number(productos[0].activo) === 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'El producto ya se encuentra eliminado.'
            });
        }

        const [resultado] = await db.query(
            `
            UPDATE productos
            SET activo = 0
            WHERE id_producto = ?
              AND activo = 1
            `,
            [idProducto]
        );

        if (resultado.affectedRows === 0) {
            return res.status(409).json({
                success: false,
                mensaje:
                    'El producto ya se encontraba eliminado.'
            });
        }

        return res.status(200).json({
            success: true,
            mensaje:
                'Producto eliminado correctamente. Los movimientos se conservaron.'
        });

    } catch (error) {

        console.error(
            'ERROR AL ELIMINAR PRODUCTO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: 'Error interno al eliminar el producto.',
            error: error.message
        });
    }
};

/**
 * ============================================================
 * EXPORTAR CONTROLADORES
 * ============================================================
 */
module.exports = {
    obtenerProductos,
    crearProducto,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
};