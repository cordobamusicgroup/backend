import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async submitFeedback(@Body('description') description: string, @Req() req) {
    return this.feedbackService.submitFeedback(description, req.user);
  }
}
