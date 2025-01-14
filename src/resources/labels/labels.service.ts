import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { LabelDto } from './dto/label.dto';
import { getCountryName } from 'src/common/utils/get-countryname.util';
import { convertToDto } from 'src/common/utils/convert-dto.util';
import { ConflictRecordsException } from 'src/common/exceptions/CustomHttpException';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new label.
   *
   * @param userObject - DTO containing the label creation data
   * @returns A Promise resolving to the created LabelDto
   */
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
    return this.convertToLabelDto(label);
  }

  /**
   * Updates an existing label by ID.
   *
   * Before updating, it checks if the label exists.
   *
   * @param id - The ID of the label to update
   * @param updateLabelDto - DTO containing the label update data
   * @returns A Promise resolving to the updated LabelDto
   * @throws NotFoundException if the label is not found
   */
  async update(id: number, updateLabelDto: UpdateLabelDto): Promise<LabelDto> {
    // Ensure the label exists before updating
    await this.getLabelById(id);

    const label = await this.prisma.label.update({
      where: { id },
      data: {
        ...updateLabelDto,
      },
    });

    return this.convertToLabelDto(label);
  }

  /**
   * Deletes multiple labels by their IDs.
   *
   * Before deleting, it checks if all the specified labels exist.
   *
   * @param ids - Array of label IDs to delete
   * @throws NotFoundException if any labels are not found
   */
  async deleteMultiple(ids: number[]): Promise<void> {
    const existingLabels = await this.prisma.label.findMany({
      where: { id: { in: ids } },
    });

    if (existingLabels.length !== ids.length) {
      const existingIds = existingLabels.map((label) => label.id);
      const missingIds = ids.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Labels with IDs ${missingIds.join(', ')} not found`,
      );
    }

    try {
      await this.prisma.label.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      if (error.code === 'P2003') {
        // Prisma foreign key constraint violation code
        throw new ConflictRecordsException();
      }
      throw error;
    }
  }

  /**
   * Retrieves a label by its ID.
   *
   * @param id - The ID of the label to retrieve
   * @returns A Promise resolving to the found LabelDto
   * @throws NotFoundException if the label is not found
   */
  async getLabelById(id: number): Promise<LabelDto> {
    const label = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return this.convertToLabelDto(label);
  }

  /**
   * Retrieves all labels.
   *
   * @returns A Promise resolving to an array of LabelDto objects
   */
  async getLabels(): Promise<LabelDto[]> {
    const labels = await this.prisma.label.findMany();

    // Use Promise.all to ensure all promises resolve before returning
    const labelDtos = await Promise.all(
      labels.map((label) => this.convertToLabelDto(label)),
    );

    return labelDtos;
  }

  /**
   * Helper method to convert a label entity to a LabelDto.
   * Also adds additional fields like country name if applicable.
   *
   * @param label - The label entity
   * @returns The converted LabelDto
   */
  private async convertToLabelDto(label: any): Promise<LabelDto> {
    const labelDto = await convertToDto(label, LabelDto);

    if (label.countryId) {
      labelDto.countryName = await getCountryName(this.prisma, label.countryId);
    }

    return labelDto;
  }
}
