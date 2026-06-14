import nodemailer from 'nodemailer';
import { config } from '../config';

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtpHost) return null;

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined
  });

  return transporter;
}

export async function sendEmail(message: MailMessage) {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[email mock] To: ${message.to} | Subject: ${message.subject}\n${message.text}`);
    }
    return { mocked: true };
  }

  await transport.sendMail({
    from: config.mailFrom,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html || message.text.replace(/\n/g, '<br/>')
  });

  return { mocked: false };
}
