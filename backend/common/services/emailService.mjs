import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente de Resend con la API Key del entorno
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo electrónico usando la API de Resend
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('La API Key de Resend (RESEND_API_KEY) no está configurada.');
        }

        const fromEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';

        const { data, error } = await resend.emails.send({
            from: `Secretario-API <${fromEmail}>`,
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log('Correo enviado con éxito (Resend ID):', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('Error al enviar correo con Resend:', error.message);
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
                <h2 style="margin: 0;">📊 Notificación de Editor de Informes</h2>
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
