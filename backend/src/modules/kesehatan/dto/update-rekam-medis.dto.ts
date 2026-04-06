import { PartialType } from '@nestjs/swagger';
import { CreateRekamMedisDto } from './create-rekam-medis.dto';

export class UpdateRekamMedisDto extends PartialType(CreateRekamMedisDto) {}
