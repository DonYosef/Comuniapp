// Enums
export enum ProrrateMethod {
  EQUAL = "EQUAL",
  COEFFICIENT = "COEFFICIENT",
}

export enum ExpenseStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

// DTOs para crear gastos comunes
export interface CreateCommonExpenseItemDto {
  name: string;
  amount: number;
  description?: string;
}

export interface CreateCommonExpenseDto {
  communityId: string;
  period: string; // Formato YYYY-MM
  dueDate: string; // ISO date string
  items: CreateCommonExpenseItemDto[];
  prorrateMethod: ProrrateMethod;
}

// DTOs de respuesta
export interface CommonExpenseItemResponseDto {
  id: string;
  name: string;
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitExpenseResponseDto {
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

export interface CommonExpenseResponseDto {
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

export interface CommonExpenseSummaryDto {
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

// Tipos para el frontend
export interface CommonExpenseFormData {
  period: string;
  dueDate: string;
  items: Array<{
    name: string;
    amount: number;
    description?: string;
  }>;
  prorrateMethod: ProrrateMethod;
}

export interface ProrratePreview {
  unitId: string;
  unitNumber: string;
  coefficient: number;
  amount: number;
}

export interface CommonExpenseStats {
  totalAmount: number;
  totalUnits: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paidUnits: number;
  pendingUnits: number;
  overdueUnits: number;
  paymentPercentage: number;
}
