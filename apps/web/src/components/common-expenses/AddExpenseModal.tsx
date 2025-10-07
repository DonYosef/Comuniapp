'use client';

import { useState, useEffect } from 'react';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  type: 'expense' | 'income';
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  communityId,
  type,
}: AddExpenseModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadExpenses();
      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [isOpen, type]);

  const loadCategories = async () => {
    try {
      // TODO: Implementar llamada a la API para obtener categorías
      // const response = await ExpenseCategoryService.getCategories(communityId);
      // setCategories(response.data);

      // Datos de ejemplo por ahora
      const categoriesData = [
        {
          id: '1',
          name: 'Servicios Básicos',
          description: 'Agua, luz, gas, internet',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Mantenimiento',
          description: 'Gastos de mantenimiento general del edificio',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Remuneraciones',
          description: 'Salarios y honorarios del personal',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      // TODO: Implementar llamada a la API para obtener gastos
      // const response = await ExpenseService.getExpenses(communityId);
      // setExpenses(response.data);

      // Datos de ejemplo por ahora
      const expensesData = [
        {
          id: '1',
          title: 'Factura de Agua',
          description: 'Consumo mensual de agua',
          categoryId: '1',
          categoryName: 'Servicios Básicos',
          amount: 0, // Monto editable
          date: '2024-01-15',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Factura de Luz',
          description: 'Consumo mensual de electricidad',
          categoryId: '1',
          categoryName: 'Servicios Básicos',
          amount: 0, // Monto editable
          date: '2024-01-15',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Reparación Ascensor',
          description: 'Mantenimiento preventivo del ascensor',
          categoryId: '2',
          categoryName: 'Mantenimiento',
          amount: 0, // Monto editable
          date: '2024-01-10',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Salario Conserje',
          description: 'Salario mensual del conserje',
          categoryId: '3',
          categoryName: 'Remuneraciones',
          amount: 0, // Monto editable
          date: '2024-01-01',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      ];
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // TODO: Implementar llamada a la API para crear gasto/ingreso
      // await ExpenseService.createExpense(communityId, { ...formData, type });

      // Simular creación
      console.log('Creando:', { ...formData, type });

      // Cerrar modal y resetear formulario
      onClose();
      setFormData({
        title: '',
        description: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    } catch (error) {
      console.error('Error al crear gasto/ingreso:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'El monto es requerido';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número válido mayor a 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmountChange = (expenseId: string, amount: string) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === expenseId ? { ...expense, amount: parseFloat(amount) || 0 } : expense,
      ),
    );
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar llamada a la API para guardar todos los gastos
      // await ExpenseService.saveExpenses(communityId, expenses);

      // Simular guardado
      console.log('Guardando gastos:', expenses);

      // Cerrar modal
      onClose();
    } catch (error) {
      console.error('Error al guardar gastos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 'expense' ? 'Agregar Gastos' : 'Agregar Ingresos'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ingresa los montos para cada {type === 'expense' ? 'gasto' : 'ingreso'} y guarda la
                información.
              </p>
              <button
                onClick={handleSaveAll}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {isLoading ? 'Guardando...' : 'Guardar Todo'}
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No hay gastos configurados
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configura los gastos en el modal de configuración primero.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {type === 'expense' ? 'Gasto' : 'Ingreso'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {expense.title}
                            </div>
                            {expense.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {expense.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {expense.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                            <input
                              type="number"
                              value={expense.amount || ''}
                              onChange={(e) => handleAmountChange(expense.id, e.target.value)}
                              className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                              min="0"
                              step="1"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
