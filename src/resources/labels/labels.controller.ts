import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { LabelsService } from './labels.service';
import { Role } from 'generated/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateLabelDto } from './dto/create-label.dto';
import { LabelDto } from './dto/label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Controller('labels')
@UseGuards(RolesGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() userObject: CreateLabelDto): Promise<LabelDto> {
    return this.labelsService.create(userObject);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: number,
    @Body() updateLabelDto: UpdateLabelDto,
  ): Promise<LabelDto> {
    return this.labelsService.update(Number(id), updateLabelDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: number): Promise<LabelDto> {
    return this.labelsService.getLabelById(Number(id));
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<LabelDto[]> {
    return this.labelsService.getLabels();
  }

  /**
   * Endpoint to delete multiple clients by their IDs.
   * Only accessible by ADMIN role.
   *
   * @param deleteClientDto - Object containing an array of IDs to delete
   * @returns A success message
   */
  @Delete()
  @Roles(Role.ADMIN)
  async deleteMultiple(
    @Body() deleteLabelDto: { ids: number[] },
  ): Promise<{ message: string }> {
    await this.labelsService.deleteMultiple(deleteLabelDto.ids);
    return {
      message: `Labels with IDs ${deleteLabelDto.ids.join(', ')} deleted successfully`,
    };
  }
}
