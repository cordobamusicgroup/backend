import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { LabelDto } from './dto/label.dto';
import { convertToDto } from 'src/common/utils/convert-dto.util';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userObject: CreateLabelDto): Promise<LabelDto> {
    const label = await this.prisma.label.create({
      data: {
        clientId: userObject.clientId,
        name: userObject.name,
        status: userObject.status,
        website: userObject.website,
        countryId: userObject.countryId,
        beatportStatus: userObject.beatportStatus,
        traxsourceStatus: userObject.traxsourceStatus,
        beatportUrl: userObject.beatportUrl,
        traxsourceUrl: userObject.traxsourceUrl,
      },
    });
    return convertToDto(label, LabelDto);
  }
}
