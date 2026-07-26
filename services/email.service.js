const nodemailer = require('nodemailer');

/**
 * ============================================================
 * CONFIGURACIÓN DEL SERVICIO DE CORREO
 * ============================================================
 */

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,

    port: Number(process.env.EMAIL_PORT),

    secure: Number(process.env.EMAIL_PORT) === 465,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * ============================================================
 * ENVÍO DEL CÓDIGO DE RECUPERACIÓN
 * ============================================================
 */
const enviarCodigoRecuperacion = async (
    correo,
    nombre,
    codigo
) => {

    try {

        const info = await transporter.sendMail({

            from:
                process.env.EMAIL_FROM ||
                process.env.EMAIL_USER,

            to: correo,

            subject: 'Recuperación de contraseña',

            html: `
            <!DOCTYPE html>
            <html lang="es">

            <head>
                <meta charset="UTF-8">
            </head>

            <body style="
                font-family: Arial, sans-serif;
                background:#f4f4f4;
                padding:25px;
            ">

                <div style="
                    max-width:500px;
                    margin:auto;
                    background:#fff;
                    border-radius:12px;
                    padding:25px;
                ">

                    <h2 style="
                        color:#0D3B66;
                        text-align:center;
                    ">
                        Recuperación de contraseña
                    </h2>

                    <p>
                        Hola <strong>${nombre}</strong>.
                    </p>

                    <p>
                        Hemos recibido una solicitud para
                        recuperar la contraseña de tu cuenta.
                    </p>

                    <p>
                        Utiliza el siguiente código:
                    </p>

                    <div style="
                        background:#EAF4FF;
                        padding:18px;
                        border-radius:10px;
                        text-align:center;
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        color:#0D3B66;
                    ">
                        ${codigo}
                    </div>

                    <p>
                        Este código estará disponible durante
                        <strong>15 minutos</strong>.
                    </p>

                    <p>
                        Si no solicitaste este cambio,
                        puedes ignorar este mensaje.
                    </p>

                </div>

            </body>

            </html>
            `
        });

        console.log(
            'Correo enviado correctamente:',
            info.messageId
        );

        return info;

    } catch (error) {

        console.error(
            'ERROR ENVIANDO CORREO:',
            error
        );

        throw error;
    }
};

module.exports = {
    enviarCodigoRecuperacion
};