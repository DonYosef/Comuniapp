'use client';

import React, { memo } from 'react';

interface Expense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  categoryId: string;
  date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  createdAt: string;
}

interface ExpenseRowProps {
  expense: Expense;
  value: number;
  onValueChange: (expenseId: string, value: string) => void;
}

const ExpenseRow = memo(({ expense, value, onValueChange }: ExpenseRowProps) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
        {expense.title}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {expense.description || '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onValueChange(expense.id, e.target.value)}
            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>
      </td>
    </tr>
  );
});

ExpenseRow.displayName = 'ExpenseRow';

export default ExpenseRow;
