import { ProrrateMethod, ExpenseStatus } from '../../types/prisma.types';

export class CommonExpenseItemResponseDto {
  id: string;
  name: string;
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UnitExpenseResponseDto {
  id: string;
  unitId: string;
  unitNumber: string;
  amount: number;
  concept: string;
  description?: string;
  dueDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class CommonExpenseResponseDto {
  id: string;
  communityId: string;
  communityName: string;
  period: string;
  totalAmount: number;
  dueDate: Date;
  prorrateMethod: ProrrateMethod;
  items: CommonExpenseItemResponseDto[];
  unitExpenses: UnitExpenseResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class CommonExpenseSummaryDto {
  id: string;
  communityId: string;
  communityName: string;
  period: string;
  totalAmount: number;
  dueDate: Date;
  totalUnits: number;
  paidUnits: number;
  pendingUnits: number;
  overdueUnits: number;
  createdAt: Date;
}
