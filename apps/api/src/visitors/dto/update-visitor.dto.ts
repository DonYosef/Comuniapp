import { PartialType } from '@nestjs/mapped-types';

import { CreateVisitorDto } from './create-visitor.dto';

export class UpdateVisitorDto extends PartialType(CreateVisitorDto) {
  // Hereda todos los campos de CreateVisitorDto como opcionales
}
