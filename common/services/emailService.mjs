import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea y configura el transporte SMTP para envío de correos
 */
const createTransporter = () => {
    const port = parseInt(process.env.SMTP_PORT || '587');
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465, // true para puerto 465 (SSL), false para 587 (TLS)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Configuraciones adicionales para mejorar conectividad
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        debug: true,
        logger: true,
        // Forzar IPv4 para evitar problemas con IPv6
        family: 4,
        // Requerir TLS para puerto 587
        requireTLS: port === 587,
        tls: {
            // No rechazar certificados no autorizados (solo para desarrollo)
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });
};

/**
 * Envía un correo electrónico
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendEmail = async (to, subject, html) => {
    try {
        // Validar que existan las credenciales SMTP
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('Las credenciales SMTP no están configuradas en las variables de entorno');
        }

        const transporter = createTransporter({
            service: process.env.SMTP_SERVICE || 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            requireTLS: true,
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al enviar correo:', error.message);
        throw error;
    }
};

/**
 * Crea el contenido HTML para la notificación de inserción masiva de informes
 * @param {string} usuario - Nombre del usuario que realizó la acción
 * @param {string} mes - Mes de los informes (formato ISO: YYYY-MM-DD)
 * @param {number} grupo - Número del grupo
 * @returns {string} Contenido HTML del correo
 */
export const createBulkReportEmailHTML = (usuario, mes, grupo) => {
    // Formatear el mes para mostrar de forma legible
    const fecha = new Date(mes + 'T00:00:00');
    const opciones = { year: 'numeric', month: 'long' };
    const mesFormateado = fecha.toLocaleDateString('es-ES', opciones);

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #4a5568;
                    color: white;
                    padding: 20px;
                    border-radius: 5px 5px 0 0;
                }
                .content {
                    background-color: #f7fafc;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-top: none;
                    border-radius: 0 0 5px 5px;
                }
                .info-row {
                    margin: 10px 0;
                    padding: 10px;
                    background-color: white;
                    border-left: 4px solid #4299e1;
                }
                .label {
                    font-weight: bold;
                    color: #2d3748;
                }
                .value {
                    color: #4a5568;
                }
                .footer {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    color: #718096;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2 style="margin: 0;">📊 Notificación de Editor Masivo de Informes</h2>
            </div>
            <div class="content">
                <p>Se ha realizado una inserción masiva de informes en el sistema.</p>
                
                <div class="info-row">
                    <span class="label">👤 Usuario:</span>
                    <span class="value">${usuario}</span>
                </div>
                
                <div class="info-row">
                    <span class="label">📅 Mes:</span>
                    <span class="value">${mesFormateado}</span>
                </div>
                
                <div class="info-row">
                    <span class="label">👥 Grupo:</span>
                    <span class="value">${grupo}</span>
                </div>
                
                <p style="margin-top: 20px; font-size: 14px;">
                    Esta es una notificación automática generada por el sistema Secretario-API.
                </p>
            </div>
            <div class="footer">
                <p>Sistema de Gestión del Secretario de la Congregación</p>
            </div>
        </body>
        </html>
    `;
};
