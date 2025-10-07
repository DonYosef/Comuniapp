export class ExpenseCategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  communityId: string;
  communityName?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
