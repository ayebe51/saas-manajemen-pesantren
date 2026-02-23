import { PartialType } from '@nestjs/swagger';
import { CreatePpdbDto } from './create-ppdb.dto';

export class UpdatePpdbDto extends PartialType(CreatePpdbDto) {}
