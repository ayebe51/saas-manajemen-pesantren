import { PartialType } from '@nestjs/swagger';
import { CreateTahfidzDto } from './create-tahfidz.dto';

export class UpdateTahfidzDto extends PartialType(CreateTahfidzDto) {}
