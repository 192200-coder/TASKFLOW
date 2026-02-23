// src/services/emailService.js
const nodemailer = require('nodemailer');
const { email: emailConfig } = require('../config/environment');

const transporter = nodemailer.createTransporter({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: false,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password
  }
});

const sendInvitation = async (toEmail, boardName, inviterName) => {
  const mailOptions = {
    from: '"TaskFlow" <noreply@taskflow.com>',
    to: toEmail,
    subject: `Invitación a tablero: ${boardName}`,
    html: `
      <h2>¡Has sido invitado a TaskFlow!</h2>
      <p><strong>${inviterName}</strong> te ha invitado a colaborar en el tablero <strong>${boardName}</strong>.</p>
      <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
      <a href="${process.env.FRONTEND_URL}/boards/invite">Aceptar invitación</a>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de invitación enviado a ${toEmail}`);
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

module.exports = {
  sendInvitation
};