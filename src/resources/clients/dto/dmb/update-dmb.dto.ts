import { CreateDmbDto } from './create-dmb.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateDmbDto extends PartialType(CreateDmbDto) {}
