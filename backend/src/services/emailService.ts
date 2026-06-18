import nodemailer from 'nodemailer';
import { config } from '../config';

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function logEmailAccepted(provider: string, message: MailMessage, providerMessageId?: string | null) {
  if (process.env.NODE_ENV === 'test') return;
  const messageId = providerMessageId ? ` | providerMessageId: ${providerMessageId}` : '';
  console.log(`[email] accepted by ${provider} | to: ${message.to} | subject: ${message.subject}${messageId}`);
}

function isSendGridSmtpConfig() {
  return config.smtpHost.toLowerCase() === 'smtp.sendgrid.net' && config.smtpUser === 'apikey';
}

function getSendGridApiKey() {
  return config.sendgridApiKey || (isSendGridSmtpConfig() ? config.smtpPass : '');
}

function parseMailAddress(value: string) {
  const match = value.match(/^\s*(?:"?([^"<]*)"?)?\s*<([^<>]+)>\s*$/);
  if (match) {
    const name = match[1]?.trim();
    return { email: match[2].trim(), ...(name ? { name } : {}) };
  }

  return { email: value.trim() };
}

export function describeEmailError(err: unknown) {
  if (!(err instanceof Error)) return { message: String(err) };
  const details = err as Error & { code?: string; command?: string; responseCode?: number };

  return {
    message: details.message,
    code: details.code,
    command: details.command,
    responseCode: details.responseCode
  };
}

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtpHost) return null;

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: config.smtpRequireTls,
    connectionTimeout: config.smtpConnectionTimeoutMs,
    greetingTimeout: config.smtpGreetingTimeoutMs,
    socketTimeout: config.smtpSocketTimeoutMs,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined
  });

  return transporter;
}

async function sendWithSendGrid(message: MailMessage, apiKey: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.smtpSocketTimeoutMs);

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [parseMailAddress(message.to)] }],
        from: parseMailAddress(config.mailFrom),
        subject: message.subject,
        content: [
          { type: 'text/plain', value: message.text },
          { type: 'text/html', value: message.html || message.text.replace(/\n/g, '<br/>') }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid API request failed with status ${response.status}${body ? `: ${body}` : ''}`);
    }

    logEmailAccepted('sendgrid', message, response.headers.get('x-message-id'));
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('SendGrid API request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendEmail(message: MailMessage) {
  const sendGridApiKey = getSendGridApiKey();
  if (sendGridApiKey) {
    await sendWithSendGrid(message, sendGridApiKey);
    return { mocked: false };
  }

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
  logEmailAccepted('smtp', message);

  return { mocked: false };
}
