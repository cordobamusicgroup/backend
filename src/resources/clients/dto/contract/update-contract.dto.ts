import { CreateContractDto } from './create-contract.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateContractDto extends PartialType(CreateContractDto) {}
