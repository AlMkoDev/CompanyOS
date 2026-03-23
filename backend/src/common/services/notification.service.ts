import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { getSmsConfig, getSmtpConfig } from '../env';

@Injectable()
export class NotificationService {
  private mailer: nodemailer.Transporter | null;
  private mailFrom: string | null;
  private smsUsername: string | null;
  private smsApiKey: string | null;

  constructor() {
    const smtpConfig = getSmtpConfig();

    if (smtpConfig) {
      this.mailer = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });
      this.mailFrom = smtpConfig.from;
    } else {
      this.mailer = null;
      this.mailFrom = null;
    }

    const smsConfig = getSmsConfig();
    this.smsUsername = smsConfig?.username || null;
    this.smsApiKey = smsConfig?.apiKey || null;
  }

  private ensureEmailConfigured() {
    if (!this.mailer || !this.mailFrom) {
      throw new Error(
        'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.',
      );
    }
  }

  private ensureSmsConfigured() {
    if (!this.smsUsername || !this.smsApiKey) {
      throw new Error(
        'SMS is not configured. Set AT_USERNAME and AT_API_KEY.',
      );
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    this.ensureEmailConfigured();
    await this.mailer.sendMail({
      from: this.mailFrom,
      to,
      subject,
      text,
      html,
    });
  }

  async sendSMS(to: string, message: string) {
    this.ensureSmsConfigured();
    const url = 'https://api.africastalking.com/version1/messaging';

    try {
      await axios.post(
        url,
        new URLSearchParams({
          username: this.smsUsername,
          to,
          message,
        }).toString(),
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.smsApiKey,
          },
        },
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('SMS sending failed:', error.response?.data || error.message);
        return;
      }

      console.error(
        'SMS sending failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
