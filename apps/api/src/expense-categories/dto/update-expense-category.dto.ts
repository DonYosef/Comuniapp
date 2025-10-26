import { PartialType, OmitType } from '@nestjs/mapped-types';

import { CreateExpenseCategoryDto } from './create-expense-category.dto';

export class UpdateExpenseCategoryDto extends PartialType(
  OmitType(CreateExpenseCategoryDto, ['communityId'] as const),
) {
  // Hereda todos los campos de CreateExpenseCategoryDto como opcionales
  // excepto communityId que no se puede cambiar
}
