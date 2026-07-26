const db = require('../config/db');

const obtenerProductos = async (req, res) => {
    try {

        const sql = `
            SELECT
                p.*,
                c.nombre AS nombre_categoria
            FROM productos p
            LEFT JOIN categorias c
                ON p.id_categoria = c.id_categoria
        `;

        const [productos] = await db.query(sql);

        res.status(200).json({
            success: true,
            data: productos
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los productos'
        });
    }
};

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

        const sql = `
            INSERT INTO productos
            (nombre, descripcion, cantidad, unidad_medida,
            stock_minimo, fecha_vencimiento, id_categoria)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultado] = await db.query(sql, [
            nombre,
            descripcion,
            cantidad,
            unidad_medida,
            stock_minimo,
            fecha_vencimiento,
            id_categoria
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Producto registrado correctamente',
            id_producto: resultado.insertId
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar producto'
        });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {

        const { id } = req.params;

        const [producto] = await db.query(
            `
            SELECT
                p.*,
                c.nombre AS nombre_categoria
            FROM productos p
            LEFT JOIN categorias c
                ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?
            `,
            [id]
        );

        if (producto.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: producto[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener producto'
        });
    }
};

const actualizarProducto = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            nombre,
            descripcion,
            cantidad,
            unidad_medida,
            stock_minimo,
            fecha_vencimiento,
            id_categoria
        } = req.body;

        await db.query(`
            UPDATE productos
            SET nombre = ?,
                descripcion = ?,
                cantidad = ?,
                unidad_medida = ?,
                stock_minimo = ?,
                fecha_vencimiento = ?,
                id_categoria = ?
            WHERE id_producto = ?
        `, [
            nombre,
            descripcion,
            cantidad,
            unidad_medida,
            stock_minimo,
            fecha_vencimiento,
            id_categoria,
            id
        ]);

        res.json({
            success: true,
            mensaje: 'Producto actualizado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar producto'
        });
    }
};

const eliminarProducto = async (req, res) => {
    try {

        const { id } = req.params;

        await db.query(
            'DELETE FROM productos WHERE id_producto = ?',
            [id]
        );

        res.json({
            success: true,
            mensaje: 'Producto eliminado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar producto'
        });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
};