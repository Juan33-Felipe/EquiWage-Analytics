import nodemailer, { type Transporter } from 'nodemailer';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.js';

export interface SendVerificationEmailResult {
  delivered: boolean;
  messageId?: string;
  previewUrl?: string | false;
  mode: 'smtp' | 'dev_fallback';
}

export class EmailService {
  private transporter: Transporter | null = null;

  public setTransporter(transporter: Transporter | null): void {
    this.transporter = transporter;
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    if (envConfig.email.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: envConfig.email.host,
        port: envConfig.email.port,
        secure: envConfig.email.secure,
        auth: {
          user: envConfig.email.user,
          pass: envConfig.email.pass,
        },
      });
      return this.transporter;
    }

    return null;
  }

  /**
   * Sends a branded HTML email containing the 4-digit verification code.
   * If SMTP credentials are not configured, outputs the code cleanly to the backend logs
   * and provides a safe local development mode so user testing never breaks.
   */
  public async sendVerificationCodeEmail(
    toEmail: string,
    firstName: string,
    code: string
  ): Promise<SendVerificationEmailResult> {
    const subject = `Your EquiWage Verification Code: ${code}`;
    const cleanName = firstName ? firstName.trim() : 'Compensation Analyst';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EquiWage Analytics Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 24px; color: #111827; }
    .card { max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; padding: 36px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6; }
    .brand { font-size: 18px; font-weight: 700; color: #111827; display: flex; align-items: center; margin-bottom: 24px; }
    .brand-accent { color: #F97316; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #FFF7ED; color: #EA580C; font-size: 11px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #FFEDD5; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #111827; }
    p { font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 20px 0; }
    .code-box { background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 1px dashed #FDBA74; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
    .code-text { font-family: monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #EA580C; margin: 0; padding-left: 12px; }
    .code-label { font-size: 11px; text-transform: uppercase; tracking: 0.05em; font-weight: 700; color: #9A3412; margin-top: 8px; }
    .footer { font-size: 12px; color: #9CA3AF; margin-top: 32px; border-top: 1px solid #F3F4F6; padding-top: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <span>EquiWage <span class="brand-accent">Analytics</span></span>
    </div>
    <div class="badge">Local Identity Verification</div>
    <h1>Verify Your HR Account</h1>
    <p>Hello ${cleanName},</p>
    <p>Thank you for registering on EquiWage Analytics. Use the 4-digit code below to activate your account and start auditing compensation structures with 100% local data privacy.</p>
    
    <div class="code-box">
      <div class="code-text">${code}</div>
      <div class="code-label">4-Digit Security Code • Expires in 15 minutes</div>
    </div>

    <p>If you did not request this verification code, you can safely ignore this email.</p>

    <div class="footer">
      EquiWage Analytics • Salary Structure Modeler & Validator<br>
      Local Session Security & Privacy by Design
    </div>
  </div>
</body>
</html>
    `.trim();

    if (!envConfig.email.isConfigured && !this.transporter) {
      logger.error('Email delivery requested but SMTP credentials (SMTP_USER / SMTP_PASS) are not configured in apps/backend/.env');
      throw new Error(
        'The email service is not configured. Please set SMTP_USER and SMTP_PASS (Gmail App Password) in the backend configuration.'
      );
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      throw new Error('Unable to initialize email transporter. Please verify your mail server settings.');
    }

    try {
      const info = await transporter.sendMail({
        from: envConfig.email.from,
        to: toEmail,
        subject,
        html: htmlContent,
        text: `Hello ${cleanName},\n\nYour 4-digit EquiWage Analytics verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nEquiWage Analytics`,
      });

      logger.info('Verification email successfully dispatched via Gmail SMTP', {
        to: toEmail,
        messageId: info.messageId,
      });

      return {
        delivered: true,
        messageId: info.messageId,
        mode: 'smtp',
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send verification email via Gmail SMTP', {
        to: toEmail,
        error: errMessage,
      });
      throw new Error(
        `Failed to deliver email: ${errMessage}. Please verify your Gmail address and Google App Password.`
      );
    }
  }
}

export const emailService = new EmailService();
