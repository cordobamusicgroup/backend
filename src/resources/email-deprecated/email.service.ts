import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import env from 'src/config/env.config';

/**
 * @deprecated This service is deprecated and will be removed in future versions.
 * Please migrate all methods to their respective modules or services.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  // Método para enviar el correo de restablecimiento de contraseña
  async sendPasswordResetEmail(
    username: string,
    email: string,
    token: string,
  ): Promise<void> {
    this.logger.warn(
      'sendPasswordResetEmail is deprecated and should be migrated.',
    );
    const reset_link = `${env.APP_FRONTEND_URL}/auth/reset?token=${token}`;

    // Enviar el correo usando el servicio de MailerModule
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: './reset-password', // Ruta a la plantilla de Handlebars (sin la extensión)
      context: {
        username, // Variables que se pasarán a la plantilla
        reset_link,
      },
    });
  }

  async sendJobResultEmail(
    email: string,
    subject: string,
    message: string,
    logFilePath: string,
  ): Promise<void> {
    this.logger.warn(
      'sendJobResultEmail is deprecated and should be migrated.',
    );
    await this.mailerService.sendMail({
      to: email,
      subject: subject,
      template: './basic-template',
      context: {
        subject, // Include subject in the context
        title: subject,
        message: message,
      },
      attachments: [
        {
          filename: 'log.txt',
          path: logFilePath,
        },
      ],
    });
  }
}
