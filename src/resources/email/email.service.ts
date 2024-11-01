import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  // Método para enviar el correo de restablecimiento de contraseña
  async sendPasswordResetEmail(
    username: string,
    email: string,
    token: string,
  ): Promise<void> {
    const reset_link = `${process.env.FRONTEND_URL}/auth/reset?token=${token}`;

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
}
