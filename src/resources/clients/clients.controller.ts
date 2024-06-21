import { Controller } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('clients')
export class ClientsController {
  constructor(private prisma: PrismaService) {}
}
