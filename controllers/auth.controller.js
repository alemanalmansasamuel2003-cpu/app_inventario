/**
 * ============================================================
 * CONTROLADOR DE AUTENTICACIÓN
 * ============================================================
 *
 * Funciones:
 *
 * ✔ Registrar usuarios.
 * ✔ Iniciar sesión.
 * ✔ Cambiar contraseña.
 * ✔ Solicitar recuperación.
 * ✔ Verificar código.
 * ✔ Restablecer contraseña.
 * ✔ Obtener perfil.
 * ✔ Actualizar perfil.
 * ✔ Activar o desactivar usuarios.
 * ✔ Eliminar códigos vencidos.
 *
 * IMPORTANTE:
 * Este archivo solo contiene funciones del controlador.
 * Las rutas deben estar en routes/auth.routes.js.
 * ============================================================
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {
    enviarCodigoRecuperacion
} = require('../services/email.service');

/**
 * Normaliza un correo electrónico.
 */
const normalizarCorreo = (correo) => {
    return String(correo || '')
        .trim()
        .toLowerCase();
};

/**
 * Valida el formato básico de un correo.
 */
const correoValido = (correo) => {
    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(correo);
};

/**
 * Genera el hash SHA-256 del código.
 */
const generarHashCodigo = (codigo) => {
    return crypto
        .createHash('sha256')
        .update(String(codigo).trim())
        .digest('hex');
};

/**
 * Valida si una contraseña almacenada
 * tiene formato bcrypt.
 */
const tieneFormatoBcrypt = (password) => {
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(
        String(password || '')
    );
};

/**
 * ============================================================
 * REGISTRAR USUARIO
 * ============================================================
 */
const register = async (req, res) => {
    try {
        const {
            nombre,
            correo,
            password,
            rol
        } = req.body;

        if (!nombre || !correo || !password || !rol) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son obligatorios.'
            });
        }

        const nombreNormalizado = String(nombre).trim();
        const correoNormalizado = normalizarCorreo(correo);
        const rolNormalizado = String(rol).trim();

        if (nombreNormalizado.length < 3) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El nombre debe contener al menos 3 caracteres.'
            });
        }

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'La contraseña debe contener al menos 6 caracteres.'
            });
        }

        const rolesPermitidos = [
            'Administrador',
            'Encargado'
        ];

        if (!rolesPermitidos.includes(rolNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El rol seleccionado no es válido.'
            });
        }

        const [usuariosExistentes] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje:
                    'Ya existe un usuario registrado con este correo.'
            });
        }

        const passwordHash = await bcrypt.hash(
            String(password),
            10
        );

        const [resultado] = await db.query(
            `
            INSERT INTO usuarios (
                nombre,
                correo,
                password,
                rol,
                activo
            )
            VALUES (?, ?, ?, ?, 1)
            `,
            [
                nombreNormalizado,
                correoNormalizado,
                passwordHash,
                rolNormalizado
            ]
        );

        return res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado correctamente.',
            id_usuario: resultado.insertId
        });
    } catch (error) {
        console.error(
            'ERROR REGISTRANDO USUARIO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'Ocurrió un error al registrar el usuario.'
        });
    }
};

/**
 * ============================================================
 * INICIAR SESIÓN
 * ============================================================
 */
const login = async (req, res) => {
    try {
        const {
            correo,
            password
        } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'Debe ingresar el correo y la contraseña.'
            });
        }

        const correoNormalizado = normalizarCorreo(correo);

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                nombre,
                correo,
                password,
                rol,
                activo
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        const usuario = usuarios[0];

        if (Number(usuario.activo) !== 1) {
            return res.status(403).json({
                success: false,
                mensaje:
                    'La cuenta del usuario se encuentra desactivada.'
            });
        }

        if (!tieneFormatoBcrypt(usuario.password)) {
            console.error(
                'La contraseña no tiene formato bcrypt:',
                usuario.correo
            );

            return res.status(500).json({
                success: false,
                mensaje:
                    'La contraseña almacenada debe ser actualizada.'
            });
        }

        const passwordValida = await bcrypt.compare(
            String(password),
            String(usuario.password)
        );

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                'JWT_SECRET no está configurado en el archivo .env.'
            );

            return res.status(500).json({
                success: false,
                mensaje:
                    'Existe un error de configuración en el servidor.'
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        return res.status(200).json({
            success: true,
            mensaje: 'Inicio de sesión correcto.',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error(
            'ERROR EN LOGIN:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'Ocurrió un error al iniciar sesión.'
        });
    }
};

/**
 * ============================================================
 * CAMBIAR CONTRASEÑA
 * ============================================================
 */
const cambiarPassword = async (req, res) => {
    try {
        const {
            correo,
            nuevaPassword
        } = req.body;

        if (!correo || !nuevaPassword) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El correo y la nueva contraseña son obligatorios.'
            });
        }

        const correoNormalizado = normalizarCorreo(correo);

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        if (String(nuevaPassword).length < 6) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'La nueva contraseña debe contener al menos 6 caracteres.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                activo
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado.'
            });
        }

        if (Number(usuarios[0].activo) !== 1) {
            return res.status(403).json({
                success: false,
                mensaje:
                    'La cuenta del usuario se encuentra desactivada.'
            });
        }

        const passwordHash = await bcrypt.hash(
            String(nuevaPassword),
            10
        );

        await db.query(
            `
            UPDATE usuarios
            SET password = ?
            WHERE id_usuario = ?
            `,
            [
                passwordHash,
                usuarios[0].id_usuario
            ]
        );

        return res.status(200).json({
            success: true,
            mensaje:
                'Contraseña actualizada correctamente.'
        });
    } catch (error) {
        console.error(
            'ERROR AL CAMBIAR CONTRASEÑA:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'Ocurrió un error al actualizar la contraseña.'
        });
    }
};

/**
 * ============================================================
 * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * ============================================================
 */
const solicitarRecuperacion = async (req, res) => {
    let idRecuperacionCreada = null;

    try {
        const { correo } = req.body;

        if (!correo || !String(correo).trim()) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El correo electrónico es obligatorio.'
            });
        }

        const correoNormalizado = normalizarCorreo(correo);

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                nombre,
                correo,
                activo
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje:
                    'No existe un usuario registrado con ese correo.'
            });
        }

        const usuario = usuarios[0];

        if (Number(usuario.activo) !== 1) {
            return res.status(403).json({
                success: false,
                mensaje:
                    'La cuenta del usuario se encuentra desactivada.'
            });
        }

        const codigo = crypto
            .randomInt(100000, 1000000)
            .toString();

        const codigoHash = generarHashCodigo(codigo);

        await db.query(
            `
            UPDATE recuperacion_password
            SET utilizado = 1
            WHERE id_usuario = ?
              AND utilizado = 0
            `,
            [usuario.id_usuario]
        );

        const [resultado] = await db.query(
            `
            INSERT INTO recuperacion_password (
                id_usuario,
                codigo,
                fecha_expiracion,
                utilizado,
                intentos
            )
            VALUES (
                ?,
                ?,
                DATE_ADD(NOW(), INTERVAL 15 MINUTE),
                0,
                0
            )
            `,
            [
                usuario.id_usuario,
                codigoHash
            ]
        );

        idRecuperacionCreada = resultado.insertId;

        await enviarCodigoRecuperacion(
            usuario.correo,
            usuario.nombre,
            codigo
        );

        console.log(
            `Código de recuperación enviado a ${usuario.correo}`
        );

        return res.status(200).json({
            success: true,
            mensaje:
                `El código fue enviado al correo ${usuario.correo}.`
        });
    } catch (error) {
        /*
         * Si el código se guardó, pero el correo no pudo enviarse,
         * se marca como utilizado para impedir que quede activo.
         */
        if (idRecuperacionCreada) {
            try {
                await db.query(
                    `
                    UPDATE recuperacion_password
                    SET utilizado = 1
                    WHERE id_recuperacion = ?
                    `,
                    [idRecuperacionCreada]
                );
            } catch (errorActualizacion) {
                console.error(
                    'ERROR INVALIDANDO EL CÓDIGO:',
                    errorActualizacion
                );
            }
        }

        console.error(
            'ERROR AL SOLICITAR RECUPERACIÓN:',
            error
        );

        if (error.code === 'EAUTH') {
            return res.status(500).json({
                success: false,
                mensaje:
                    'Gmail rechazó las credenciales. Revisa EMAIL_USER y EMAIL_PASSWORD en el archivo .env.'
            });
        }

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo procesar la recuperación de contraseña.'
        });
    }
};

/**
 * ============================================================
 * VERIFICAR CÓDIGO DE RECUPERACIÓN
 * ============================================================
 */
const verificarCodigoRecuperacion = async (req, res) => {
    try {
        const {
            correo,
            codigo
        } = req.body;

        if (!correo || !codigo) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El correo y el código son obligatorios.'
            });
        }

        const correoNormalizado = normalizarCorreo(correo);
        const codigoLimpio = String(codigo).trim();

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        if (!/^\d{6}$/.test(codigoLimpio)) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El código debe contener exactamente 6 dígitos.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                activo
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado.'
            });
        }

        const usuario = usuarios[0];

        if (Number(usuario.activo) !== 1) {
            return res.status(403).json({
                success: false,
                mensaje:
                    'La cuenta del usuario se encuentra desactivada.'
            });
        }

        const [recuperaciones] = await db.query(
            `
            SELECT
                id_recuperacion,
                codigo,
                intentos
            FROM recuperacion_password
            WHERE id_usuario = ?
              AND utilizado = 0
              AND fecha_expiracion > NOW()
            ORDER BY id_recuperacion DESC
            LIMIT 1
            `,
            [usuario.id_usuario]
        );

        if (recuperaciones.length === 0) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'No existe un código activo o el código ha vencido.'
            });
        }

        const recuperacion = recuperaciones[0];

        if (Number(recuperacion.intentos) >= 5) {
            await db.query(
                `
                UPDATE recuperacion_password
                SET utilizado = 1
                WHERE id_recuperacion = ?
                `,
                [recuperacion.id_recuperacion]
            );

            return res.status(429).json({
                success: false,
                mensaje:
                    'Se superó el máximo de intentos. Solicita un código nuevo.'
            });
        }

        const codigoHash = generarHashCodigo(codigoLimpio);

        if (codigoHash !== recuperacion.codigo) {
            await db.query(
                `
                UPDATE recuperacion_password
                SET intentos = intentos + 1
                WHERE id_recuperacion = ?
                `,
                [recuperacion.id_recuperacion]
            );

            return res.status(400).json({
                success: false,
                mensaje: 'El código ingresado es incorrecto.'
            });
        }

        return res.status(200).json({
            success: true,
            mensaje:
                'Código verificado correctamente.'
        });
    } catch (error) {
        console.error(
            'ERROR AL VERIFICAR CÓDIGO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo verificar el código.'
        });
    }
};

/**
 * ============================================================
 * RESTABLECER CONTRASEÑA
 * ============================================================
 */
const restablecerPassword = async (req, res) => {
    let conexion;

    try {
        const {
            correo,
            codigo,
            nuevaPassword
        } = req.body;

        if (!correo || !codigo || !nuevaPassword) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El correo, el código y la nueva contraseña son obligatorios.'
            });
        }

        const correoNormalizado = normalizarCorreo(correo);
        const codigoLimpio = String(codigo).trim();
        const nuevaPasswordLimpia = String(nuevaPassword);

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        if (!/^\d{6}$/.test(codigoLimpio)) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El código debe contener exactamente 6 dígitos.'
            });
        }

        if (nuevaPasswordLimpia.length < 6) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'La nueva contraseña debe contener al menos 6 caracteres.'
            });
        }

        const codigoHash = generarHashCodigo(codigoLimpio);

        conexion = await db.getConnection();

        await conexion.beginTransaction();

        const [registros] = await conexion.query(
            `
            SELECT
                r.id_recuperacion,
                r.id_usuario,
                r.codigo,
                r.intentos,
                u.activo
            FROM recuperacion_password r
            INNER JOIN usuarios u
                ON u.id_usuario = r.id_usuario
            WHERE LOWER(TRIM(u.correo)) = ?
              AND r.utilizado = 0
              AND r.fecha_expiracion > NOW()
            ORDER BY r.id_recuperacion DESC
            LIMIT 1
            FOR UPDATE
            `,
            [correoNormalizado]
        );

        if (registros.length === 0) {
            await conexion.rollback();

            return res.status(400).json({
                success: false,
                mensaje:
                    'El código ya fue utilizado, no existe o ha vencido.'
            });
        }

        const recuperacion = registros[0];

        if (Number(recuperacion.activo) !== 1) {
            await conexion.rollback();

            return res.status(403).json({
                success: false,
                mensaje:
                    'La cuenta del usuario se encuentra desactivada.'
            });
        }

        if (Number(recuperacion.intentos) >= 5) {
            await conexion.query(
                `
                UPDATE recuperacion_password
                SET utilizado = 1
                WHERE id_recuperacion = ?
                `,
                [recuperacion.id_recuperacion]
            );

            await conexion.commit();

            return res.status(429).json({
                success: false,
                mensaje:
                    'Se superó el máximo de intentos. Solicita un código nuevo.'
            });
        }

        if (codigoHash !== recuperacion.codigo) {
            await conexion.query(
                `
                UPDATE recuperacion_password
                SET intentos = intentos + 1
                WHERE id_recuperacion = ?
                `,
                [recuperacion.id_recuperacion]
            );

            await conexion.commit();

            return res.status(400).json({
                success: false,
                mensaje: 'El código ingresado es incorrecto.'
            });
        }

        const passwordHash = await bcrypt.hash(
            nuevaPasswordLimpia,
            10
        );

        await conexion.query(
            `
            UPDATE usuarios
            SET password = ?
            WHERE id_usuario = ?
            `,
            [
                passwordHash,
                recuperacion.id_usuario
            ]
        );

        await conexion.query(
            `
            UPDATE recuperacion_password
            SET utilizado = 1
            WHERE id_usuario = ?
              AND utilizado = 0
            `,
            [recuperacion.id_usuario]
        );

        await conexion.commit();

        return res.status(200).json({
            success: true,
            mensaje:
                'La contraseña fue restablecida correctamente.'
        });
    } catch (error) {
        if (conexion) {
            try {
                await conexion.rollback();
            } catch (errorRollback) {
                console.error(
                    'ERROR REVERTIENDO LA TRANSACCIÓN:',
                    errorRollback
                );
            }
        }

        console.error(
            'ERROR AL RESTABLECER CONTRASEÑA:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo restablecer la contraseña.'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
};

/**
 * ============================================================
 * OBTENER PERFIL
 * ============================================================
 */
const obtenerPerfil = async (req, res) => {
    try {
        const idUsuario =
            req.usuario?.id_usuario ||
            req.params?.id_usuario ||
            req.body?.id_usuario;

        if (!idUsuario) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'No se proporcionó el ID del usuario.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                nombre,
                correo,
                rol,
                activo
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            usuario: usuarios[0]
        });
    } catch (error) {
        console.error(
            'ERROR AL OBTENER PERFIL:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo obtener la información del usuario.'
        });
    }
};

/**
 * ============================================================
 * ACTUALIZAR PERFIL
 * ============================================================
 */
const actualizarPerfil = async (req, res) => {
    try {
        const idUsuario = req.params.id_usuario;

        const {
            nombre,
            correo,
            rol
        } = req.body;

        if (!idUsuario || !nombre || !correo) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El ID, nombre y correo son obligatorios.'
            });
        }

        const nombreNormalizado = String(nombre).trim();
        const correoNormalizado = normalizarCorreo(correo);

        if (nombreNormalizado.length < 3) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El nombre debe contener al menos 3 caracteres.'
            });
        }

        if (!correoValido(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado.'
            });
        }

        const [correoExiste] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE LOWER(TRIM(correo)) = ?
              AND id_usuario <> ?
            LIMIT 1
            `,
            [
                correoNormalizado,
                idUsuario
            ]
        );

        if (correoExiste.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje:
                    'El correo ya está registrado por otro usuario.'
            });
        }

        if (rol !== undefined && rol !== null && rol !== '') {
            const rolNormalizado = String(rol).trim();

            const rolesPermitidos = [
                'Administrador',
                'Encargado'
            ];

            if (!rolesPermitidos.includes(rolNormalizado)) {
                return res.status(400).json({
                    success: false,
                    mensaje:
                        'El rol seleccionado no es válido.'
                });
            }

            await db.query(
                `
                UPDATE usuarios
                SET
                    nombre = ?,
                    correo = ?,
                    rol = ?
                WHERE id_usuario = ?
                `,
                [
                    nombreNormalizado,
                    correoNormalizado,
                    rolNormalizado,
                    idUsuario
                ]
            );
        } else {
            await db.query(
                `
                UPDATE usuarios
                SET
                    nombre = ?,
                    correo = ?
                WHERE id_usuario = ?
                `,
                [
                    nombreNormalizado,
                    correoNormalizado,
                    idUsuario
                ]
            );
        }

        return res.status(200).json({
            success: true,
            mensaje: 'Perfil actualizado correctamente.'
        });
    } catch (error) {
        console.error(
            'ERROR AL ACTUALIZAR PERFIL:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo actualizar el perfil.'
        });
    }
};

/**
 * ============================================================
 * CAMBIAR ESTADO DEL USUARIO
 * ============================================================
 */
const cambiarEstadoUsuario = async (req, res) => {
    try {
        const idUsuario = req.params.id_usuario;
        const { activo } = req.body;

        if (!idUsuario) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El ID del usuario es obligatorio.'
            });
        }

        if (activo === undefined || activo === null) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'Debe indicar el estado del usuario.'
            });
        }

        const estadoNormalizado = Number(activo);

        if (
            estadoNormalizado !== 0 &&
            estadoNormalizado !== 1
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    'El estado del usuario debe ser 0 o 1.'
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado.'
            });
        }

        await db.query(
            `
            UPDATE usuarios
            SET activo = ?
            WHERE id_usuario = ?
            `,
            [
                estadoNormalizado,
                idUsuario
            ]
        );

        if (estadoNormalizado === 0) {
            await db.query(
                `
                UPDATE recuperacion_password
                SET utilizado = 1
                WHERE id_usuario = ?
                  AND utilizado = 0
                `,
                [idUsuario]
            );
        }

        return res.status(200).json({
            success: true,
            mensaje:
                estadoNormalizado === 1
                    ? 'Usuario activado correctamente.'
                    : 'Usuario desactivado correctamente.'
        });
    } catch (error) {
        console.error(
            'ERROR AL CAMBIAR ESTADO DEL USUARIO:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudo cambiar el estado del usuario.'
        });
    }
};

/**
 * ============================================================
 * ELIMINAR CÓDIGOS VENCIDOS O UTILIZADOS
 * ============================================================
 */
const eliminarCodigosVencidos = async (req, res) => {
    try {
        const [resultado] = await db.query(
            `
            DELETE FROM recuperacion_password
            WHERE fecha_expiracion < NOW()
               OR utilizado = 1
            `
        );

        return res.status(200).json({
            success: true,
            mensaje:
                'Códigos vencidos o utilizados eliminados correctamente.',
            eliminados: resultado.affectedRows
        });
    } catch (error) {
        console.error(
            'ERROR AL ELIMINAR CÓDIGOS:',
            error
        );

        return res.status(500).json({
            success: false,
            mensaje:
                'No se pudieron eliminar los códigos.'
        });
    }
};

/**
 * ============================================================
 * EXPORTACIÓN DEL CONTROLADOR
 * ============================================================
 */
module.exports = {
    register,
    login,
    cambiarPassword,
    solicitarRecuperacion,
    verificarCodigoRecuperacion,
    restablecerPassword,
    obtenerPerfil,
    actualizarPerfil,
    cambiarEstadoUsuario,
    eliminarCodigosVencidos
};