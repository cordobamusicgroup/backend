import { PartialType } from '@nestjs/mapped-types';
import { CreateDmbDto } from './create-dmb.dto';

export class UpdateDmbDto extends PartialType(CreateDmbDto) {}
