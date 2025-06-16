const nodemailer = require('nodemailer');

// 1. Configurar el "transporter" de Nodemailer usando las credenciales del .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un email de confirmación de cita.
 * @param {object} datosCita 
 */
const enviarEmailConfirmacion = async (datosCita) => {
  try {
    // Para formatear la fecha y hora en un formato legible
    const fechaOpciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const horaOpciones = { hour: '2-digit', minute: '2-digit', hour12: false };
    
    const fechaFormateada = new Date(datosCita.fecha_hora_inicio).toLocaleDateString('es-ES', fechaOpciones);
    const horaFormateada = new Date(datosCita.fecha_hora_inicio).toLocaleTimeString('es-ES', horaOpciones);

    // Opciones del email
    const mailOptions = {
      from: `"Barbería TFG" <${process.env.EMAIL_USER}>`,
      to: datosCita.cliente_email_nr, // El email del cliente
      subject: '✅ Confirmación de tu Cita en Barbería TFG',
      html: `
        <h1>¡Tu cita está confirmada!</h1>
        <p>Hola ${datosCita.cliente_nombre_nr},</p>
        <p>Gracias por reservar con nosotros. Aquí están los detalles de tu cita:</p>
        <ul>
          <li><strong>Fecha:</strong> ${fechaFormateada}</li>
          <li><strong>Hora:</strong> ${horaFormateada}</li>
          <li><strong>Barbero ID:</strong> ${datosCita.barbero_id}</li>
          <li><strong>Servicio ID:</strong> ${datosCita.servicio_id}</li>
        </ul>
        <p>¡Te esperamos!</p>
      `,
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);
    console.log('Email de confirmación enviado a:', datosCita.cliente_email_nr);

  } catch (error) {
    console.error('Error al enviar el email de confirmación:', error);
  }
};

module.exports = {
  enviarEmailConfirmacion,
};