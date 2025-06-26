const nodemailer = require('nodemailer');
const config = require('../config');

// Configurar el transporter usando la configuración
const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Verificar la configuración de email al iniciar
const verificarConfiguracionEmail = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
  } catch (error) {
    console.error('❌ Error en la configuración de email:', error.message);
    if (config.server.nodeEnv === 'production') {
      console.error('🚫 Email es crítico en producción');
      process.exit(1);
    }
  }
};

// Verificar solo si las credenciales están configuradas
if (config.email.user && config.email.pass) {
  verificarConfiguracionEmail();
}

const enviarEmailConfirmacion = async (datosCita) => {
  try {
    const fechaOpciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const horaOpciones = { hour: '2-digit', minute: '2-digit', hour12: false };
    
    const fechaFormateada = new Date(datosCita.fecha_hora_inicio).toLocaleDateString('es-ES', fechaOpciones);
    const horaFormateada = new Date(datosCita.fecha_hora_inicio).toLocaleTimeString('es-ES', horaOpciones);
    
    // Usar la configuración para construir la URL
    const urlCancelacion = `${config.frontend.url}${config.frontend.cancelationPath}?token=${datosCita.token_cancelacion}`;

    const mailOptions = {
      from: config.email.from,
      to: datosCita.cliente_email_nr,
      subject: '✅ Confirmación de tu Cita en Barbería Premium',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #bfa88b;">¡Tu cita está confirmada!</h1>
          <p>Hola ${datosCita.cliente_nombre_nr},</p>
          <p>Gracias por reservar con nosotros. Aquí están los detalles de tu cita:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
              <li><strong>📅 Fecha:</strong> ${fechaFormateada}</li>
              <li><strong>🕒 Hora:</strong> ${horaFormateada}</li>
              <li><strong>💇‍♂️ Barbero:</strong> ${datosCita.barbero_nombre}</li>
              <li><strong>✂️ Servicio:</strong> ${datosCita.servicio_nombre}</li>
            </ul>
          </div>
          
          <p>Si no puedes asistir, puedes cancelar tu cita haciendo clic en el siguiente enlace:</p>
          <p style="margin: 20px 0; text-align: center;">
            <a href="${urlCancelacion}" 
               style="background-color: #e53e3e; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Cancelar Cita
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            <strong>Barbería Premium</strong><br>
            Campus de Vicálvaro, URJC<br>
            📧 Email: info@barberiapremium.com<br>
            📞 Teléfono: +34 91 234 56 78
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Email de confirmación enviado a:', datosCita.cliente_email_nr);

  } catch (error) {
    console.error('❌ Error al enviar el email de confirmación:', error.message);
    
    // En desarrollo, el error no debe romper la aplicación
    if (config.server.nodeEnv !== 'production') {
      console.warn('⚠️  La cita se creó correctamente pero no se pudo enviar el email');
    }
  }
};

module.exports = {
  enviarEmailConfirmacion,
};