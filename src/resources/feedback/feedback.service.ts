import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async submitFeedback(
    description: string,
    userJwt: JwtPayloadDto,
  ): Promise<void> {
    const user = await this.usersService.findByUsername(userJwt.username);

    try {
      const emailContent = {
        username: user.username,
        email: user.email,
        description,
      };
      await this.emailService.sendFeedbackEmail(emailContent);
    } catch (error) {
      this.logger.error(`Failed to submit feedback: ${error.message}`);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }
}
