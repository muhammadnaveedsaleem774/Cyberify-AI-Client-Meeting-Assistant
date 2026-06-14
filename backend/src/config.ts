import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/cyberify',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  smtpHost: process.env.SMTP_HOST || (process.env.SENDGRID_API_KEY ? 'smtp.sendgrid.net' : ''),
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || (process.env.SENDGRID_API_KEY ? 'apikey' : ''),
  smtpPass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'Cyberify <no-reply@cyberify.local>',
  appName: process.env.APP_NAME || 'Cyberify AI Client Meeting Assistant'
};
