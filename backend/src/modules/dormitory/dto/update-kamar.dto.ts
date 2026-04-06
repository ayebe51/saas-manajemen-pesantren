import { PartialType } from '@nestjs/swagger';
import { CreateKamarDto } from './create-kamar.dto';

export class UpdateKamarDto extends PartialType(CreateKamarDto) {}
