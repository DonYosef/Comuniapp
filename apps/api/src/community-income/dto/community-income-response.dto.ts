import { ProrrateMethod } from '../../types/prisma.types';

export class CommunityIncomeItemResponseDto {
  id: string;
  name: string;
  amount: number;
  description?: string;
  categoryId: string;
  categoryName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommunityIncomeResponseDto {
  id: string;
  communityId: string;
  communityName?: string;
  period: string;
  totalAmount: number;
  dueDate: Date;
  prorrateMethod: ProrrateMethod;
  items: CommunityIncomeItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
