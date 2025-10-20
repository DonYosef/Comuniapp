'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ExpenseCategoriesService,
  ExpenseCategory,
} from '@/services/api/expense-categories.service';
import { CommonExpensesService, CommonExpense } from '@/services/api/common-expenses.service';
import { useToast } from '@/components/ui/Toast';
import { invalidateExpenseCache } from '@/hooks/useExpenseData';
import { eventBus, EVENTS } from '@/utils/eventBus';

// Las interfaces ya están importadas desde los servicios

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

interface ExpenseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onDataChange?: () => void; // Callback para notificar cambios
}

export default function ExpenseConfigModal({
  isOpen,
  onClose,
  communityId,
  onDataChange,
}: ExpenseConfigModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook para mostrar notificaciones
  const { showToast, ToastContainer } = useToast();

  // Estados para el formulario de nuevo gasto
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState({
    title: '',
    description: '',
  });
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});

  // Estados para la edición inline de gastos
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseData, setEditExpenseData] = useState({
    title: '',
    description: '',
  });
  const [editExpenseErrors, setEditExpenseErrors] = useState<Record<string, string>>({});

  // Estados para eliminación
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadExpenses();
    }
  }, [isOpen, communityId]);

  // Establecer pestaña activa cuando se cargan las categorías
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  const loadCategories = async () => {
    try {
      // Cargar categorías desde la API
      const categoriesData = await ExpenseCategoriesService.getCategoriesByCommunity(communityId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      // En caso de error, mostrar datos de ejemplo para desarrollo
      const fallbackCategories = [
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
      setCategories(fallbackCategories);
    }
  };

  const loadExpenses = async () => {
    try {
      // Cargar gastos comunes desde la API
      const commonExpensesData = await CommonExpensesService.getCommonExpenses(communityId);

      // Transformar los gastos comunes a formato de gastos individuales (optimizado)
      const expensesData = commonExpensesData.flatMap((commonExpense) =>
        (commonExpense.items || []).map((item) => ({
          id: item.id,
          title: item.name,
          amount: item.amount,
          description: item.description,
          categoryId: item.categoryId || '',
          date: commonExpense.dueDate,
          status: 'PENDING' as const,
          createdAt: item.createdAt,
        })),
      );

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  };

  const handleCreateCategory = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Crear categoría en la base de datos
      const newCategory = await ExpenseCategoriesService.createCategory({
        name: formData.name,
        description: formData.description,
        communityId: communityId,
      });

      setCategories((prev) => [...prev, newCategory]);
      setShowCreateForm(false);
      setIsCreatingCategory(false);
      setActiveTab(newCategory.id); // Seleccionar la nueva categoría creada
      setFormData({ name: '', description: '' });
      setErrors({});
    } catch (error) {
      console.error('Error al crear categoría:', error);
      // Mostrar error al usuario
      alert('Error al crear la categoría. Verifique que el nombre no esté duplicado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!validateForm() || !editingCategory) return;

    setIsLoading(true);
    try {
      // TODO: Implementar llamada a la API para actualizar categoría
      // await ExpenseCategoryService.updateCategory(editingCategory.id, formData);

      // Simular actualización
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                name: formData.name,
                description: formData.description,
                updatedAt: new Date().toISOString(),
              }
            : cat,
        ),
      );

      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      setErrors({});
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setErrors({});
  };

  // Funciones para manejar nuevo gasto
  const handleCreateExpense = async () => {
    if (!validateExpenseForm()) return;

    setIsLoading(true);
    try {
      // Obtener el período actual (YYYY-MM)
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Verificar si ya existe un CommonExpense para este período
      const existingExpenses = await CommonExpensesService.getCommonExpenses(communityId);
      const currentPeriodExpense = existingExpenses.find(
        (expense) => expense.period === currentPeriod,
      );

      if (currentPeriodExpense) {
        // Si existe, actualizar agregando el nuevo item
        const updatedItems = [
          ...(currentPeriodExpense.items || []),
          {
            name: newExpenseData.title,
            amount: 0.01, // Mínimo requerido por la validación
            description: newExpenseData.description,
            categoryId: activeTab !== 'no-category' ? activeTab : null, // ← AGREGAR CATEGORYID
          },
        ];

        console.log(
          '🔄 Actualizando gasto común existente:',
          currentPeriodExpense.id,
          'con items:',
          updatedItems.length,
        );
        await CommonExpensesService.updateCommonExpense(currentPeriodExpense.id, {
          items: updatedItems,
        });
        console.log('✅ Gasto común actualizado exitosamente');
      } else {
        // Si no existe, crear un nuevo CommonExpense
        const newCommonExpense = {
          communityId: communityId,
          period: currentPeriod,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde ahora
          items: [
            {
              name: newExpenseData.title,
              amount: 0.01, // Mínimo requerido por la validación
              description: newExpenseData.description,
              categoryId: activeTab !== 'no-category' ? activeTab : null, // ← AGREGAR CATEGORYID
            },
          ],
          prorrateMethod: 'EQUAL' as const,
        };

        console.log('🚀 Creando nuevo gasto común:', newCommonExpense);
        await CommonExpensesService.createCommonExpense(newCommonExpense);
        console.log('✅ Gasto común creado exitosamente');
      }

      // Recargar los datos para mostrar el nuevo gasto
      console.log('🔄 Recargando datos después de crear gasto...');
      await loadExpenses();
      console.log('✅ Datos recargados exitosamente');

      // Invalidar caché y emitir evento
      invalidateExpenseCache(communityId);
      eventBus.emit(EVENTS.EXPENSE_CREATED, { communityId, expense: newExpenseData });
      eventBus.emit(EVENTS.DATA_REFRESH_NEEDED, { communityId });
      console.log('📢 Eventos emitidos para actualizar datos');

      setShowNewExpenseForm(false);
      setNewExpenseData({ title: '', description: '' });
      setExpenseErrors({});

      // Mostrar mensaje de éxito
      showToast('Gasto creado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al crear gasto:', error);

      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al crear el gasto. Por favor, inténtalo de nuevo.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        // Manejar caso específico de no hay unidades
        if (errorMessage.includes('No active units found')) {
          errorMessage =
            'No se pueden crear gastos comunes porque la comunidad no tiene unidades activas. Por favor, contacta al administrador para agregar unidades a la comunidad.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelExpense = () => {
    setShowNewExpenseForm(false);
    setNewExpenseData({ title: '', description: '' });
    setExpenseErrors({});
  };

  const validateExpenseForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newExpenseData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    setExpenseErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Funciones para manejar la edición de gastos
  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditExpenseData({
      title: expense.title,
      description: expense.description || '',
    });
    setEditExpenseErrors({});
  };

  const handleUpdateExpense = async () => {
    if (!validateEditExpenseForm() || !editingExpenseId) return;

    setIsLoading(true);
    try {
      // TODO: Implementar llamada a la API para actualizar gasto
      // await ExpenseService.updateExpense(editingExpenseId, editExpenseData);

      // Simular actualización
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === editingExpenseId
            ? { ...expense, title: editExpenseData.title, description: editExpenseData.description }
            : expense,
        ),
      );

      setEditingExpenseId(null);
      setEditExpenseData({ title: '', description: '' });
      setEditExpenseErrors({});
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseData({ title: '', description: '' });
    setEditExpenseErrors({});
  };

  const validateEditExpenseForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editExpenseData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    setEditExpenseErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obtener gastos de la categoría activa
  // Memoización de funciones de filtrado
  const getExpensesByCategory = useCallback(
    (categoryId: string) => {
      return expenses.filter((expense) => expense.categoryId === categoryId);
    },
    [expenses],
  );

  const getExpensesWithoutCategory = useCallback(() => {
    return expenses.filter((expense) => !expense.categoryId || expense.categoryId === '');
  }, [expenses]);

  // Función para mostrar modal de confirmación de eliminación
  const handleDeleteCategoryClick = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setCategoryToDelete(category);
      setShowDeleteCategoryModal(true);
    }
  };

  // Función para confirmar eliminación de categoría
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategoryId(categoryToDelete.id);
    setIsLoading(true);

    try {
      console.log('🗑️ Eliminando categoría:', categoryToDelete.id, categoryToDelete.name);
      console.log('📡 Llamando a la API:', `/expense-categories/${categoryToDelete.id}`);

      // Eliminar la categoría
      const result = await ExpenseCategoriesService.deleteCategory(categoryToDelete.id);
      console.log('✅ Respuesta de la API:', result);

      // Recargar categorías
      console.log('🔄 Recargando categorías...');
      await loadCategories();
      console.log('✅ Categorías recargadas');

      // Invalidar caché y emitir evento
      invalidateExpenseCache(communityId);
      eventBus.emit(EVENTS.DATA_REFRESH_NEEDED, { communityId });
      console.log('📢 Eventos emitidos para actualizar datos (eliminación de categoría)');

      showToast('Categoría eliminada exitosamente', 'success');

      // Cerrar modal de confirmación
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('❌ Error al eliminar categoría:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Mostrar mensaje de error específico
      let errorMessage = 'Error al eliminar la categoría';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setDeletingCategoryId(null);
      setIsLoading(false);
    }
  };

  // Función para cancelar eliminación
  const handleCancelDeleteCategory = () => {
    setShowDeleteCategoryModal(false);
    setCategoryToDelete(null);
  };

  // Función para eliminar un gasto
  const handleDeleteExpense = async (expenseId: string) => {
    setDeletingExpenseId(expenseId);
    setIsLoading(true);

    try {
      console.log('🗑️ Iniciando eliminación del gasto:', expenseId);

      // Encontrar el gasto común al que pertenece este item
      const commonExpenses = await CommonExpensesService.getCommonExpenses(communityId);
      console.log('📊 Gastos comunes obtenidos:', commonExpenses.length);

      const expense = expenses.find((e) => e.id === expenseId);
      console.log('🔍 Gasto encontrado:', expense);

      if (!expense) {
        throw new Error('Gasto no encontrado en la lista local');
      }

      // Buscar el gasto común que contiene este item
      let commonExpenseId = '';
      let targetItem = null;

      for (const commonExpense of commonExpenses) {
        console.log(
          '🔍 Buscando en gasto común:',
          commonExpense.id,
          'con',
          commonExpense.items.length,
          'items',
        );

        const item = commonExpense.items.find((item) => {
          const nameMatch = item.name === expense.title;
          const descMatch = (item.description || '') === (expense.description || '');
          console.log('🔍 Comparando item:', {
            itemName: item.name,
            expenseTitle: expense.title,
            nameMatch,
            itemDesc: item.description,
            expenseDesc: expense.description,
            descMatch,
          });
          return nameMatch && descMatch;
        });

        if (item) {
          commonExpenseId = commonExpense.id;
          targetItem = item;
          console.log('✅ Item encontrado:', item);
          break;
        }
      }

      if (!commonExpenseId || !targetItem) {
        console.error('❌ No se pudo encontrar el gasto común o item asociado');
        console.log(
          '📊 Gastos comunes disponibles:',
          commonExpenses.map((ce) => ({
            id: ce.id,
            period: ce.period,
            itemsCount: ce.items.length,
            items: ce.items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
            })),
          })),
        );
        throw new Error('No se pudo encontrar el gasto común o item asociado');
      }

      console.log('🚀 Eliminando item:', targetItem.id, 'del gasto común:', commonExpenseId);

      // Eliminar el item
      const result = await CommonExpensesService.deleteExpenseItem(commonExpenseId, targetItem.id);
      console.log('✅ Resultado de eliminación:', result);

      // Recargar los datos
      await loadExpenses();

      // Invalidar caché y emitir evento
      invalidateExpenseCache(communityId);
      eventBus.emit(EVENTS.EXPENSE_DELETED, { communityId, expenseId });
      eventBus.emit(EVENTS.DATA_REFRESH_NEEDED, { communityId });
      console.log('📢 Eventos emitidos para actualizar datos (eliminación)');

      showToast('Gasto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error al eliminar gasto:', error);
      showToast(`Error al eliminar el gasto: ${error.message}`, 'error');
    } finally {
      setDeletingExpenseId(null);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configuración de Gastos Comunes
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

        {/* Pestañas de categorías */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 px-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveTab(category.id);
                  setIsCreatingCategory(false);
                  setShowCreateForm(false);
                  setShowNewExpenseForm(false);
                  setEditingExpenseId(null);
                }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === category.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}

            {/* Pestaña para gastos sin categoría */}
            {getExpensesWithoutCategory().length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('no-category');
                  setIsCreatingCategory(false);
                  setShowCreateForm(false);
                  setShowNewExpenseForm(false);
                  setEditingExpenseId(null);
                }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'no-category'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Sin categoría ({getExpensesWithoutCategory().length})
              </button>
            )}

            <button
              onClick={() => {
                setShowCreateForm(true);
                setIsCreatingCategory(true);
                setActiveTab('create-category');
                setShowNewExpenseForm(false);
                setEditingExpenseId(null);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center ${
                isCreatingCategory
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar categoría
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {showCreateForm ? (
            /* Formulario de creación/edición de categoría */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Mantenimiento, Servicios Básicos, etc."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe qué tipo de gastos incluye esta categoría..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          ) : (
            /* Lista de gastos de la categoría activa */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {activeTab === 'no-category'
                        ? 'Sin categoría'
                        : categories.find((cat) => cat.id === activeTab)?.name || 'Gastos'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'no-category'
                        ? getExpensesWithoutCategory().length
                        : getExpensesByCategory(activeTab).length}{' '}
                      gastos registrados
                    </p>
                  </div>
                  {/* Botón de eliminar categoría - solo para categorías reales, no para "Sin categoría" */}
                  {activeTab !== 'no-category' && activeTab !== 'create-category' && (
                    <button
                      onClick={() => handleDeleteCategoryClick(activeTab)}
                      disabled={deletingCategoryId === activeTab}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 disabled:opacity-50"
                      title="Eliminar categoría"
                    >
                      {deletingCategoryId === activeTab ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowNewExpenseForm(true);
                    setEditingExpenseId(null);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Nuevo Gasto
                </button>
              </div>

              {/* Formulario de nuevo gasto */}
              {showNewExpenseForm && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Nuevo Gasto
                    </h4>
                    <button
                      onClick={handleCancelExpense}
                      className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Título del Gasto *
                      </label>
                      <input
                        type="text"
                        value={newExpenseData.title}
                        onChange={(e) =>
                          setNewExpenseData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Factura de Agua, Reparación Ascensor..."
                      />
                      {expenseErrors.title && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {expenseErrors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Descripción (Opcional)
                      </label>
                      <textarea
                        value={newExpenseData.description}
                        onChange={(e) =>
                          setNewExpenseData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe el gasto..."
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={handleCancelExpense}
                        className="px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors duration-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateExpense}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isLoading ? 'Creando...' : 'Crear Gasto'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                  activeTab === 'no-category'
                    ? getExpensesWithoutCategory().length === 0
                    : getExpensesByCategory(activeTab).length === 0
                ) ? (
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
                    No hay gastos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Comienza agregando un nuevo gasto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeTab === 'no-category'
                    ? getExpensesWithoutCategory()
                    : getExpensesByCategory(activeTab)
                  ).map((expense) => (
                    <div
                      key={expense.id}
                      className={`rounded-lg p-4 ${
                        editingExpenseId === expense.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      {editingExpenseId === expense.id ? (
                        /* Modo de edición */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Editando Gasto
                            </h4>
                            <button
                              onClick={handleCancelEditExpense}
                              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Título del Gasto *
                            </label>
                            <input
                              type="text"
                              value={editExpenseData.title}
                              onChange={(e) =>
                                setEditExpenseData((prev) => ({ ...prev, title: e.target.value }))
                              }
                              className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Factura de Agua, Reparación Ascensor..."
                            />
                            {editExpenseErrors.title && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {editExpenseErrors.title}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Descripción (Opcional)
                            </label>
                            <textarea
                              value={editExpenseData.description}
                              onChange={(e) =>
                                setEditExpenseData((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Describe el gasto..."
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              onClick={handleCancelEditExpense}
                              className="px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors duration-200"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleUpdateExpense}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {isLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Modo de visualización */
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {expense.title}
                            </h4>
                            {expense.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {expense.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deletingExpenseId === expense.id || isLoading}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingExpenseId === expense.id ? (
                                <svg
                                  className="w-4 h-4 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar categoría */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Eliminar Categoría
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  ¿Estás seguro de que quieres eliminar la categoría:
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  "{categoryToDelete.name}"
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Esta acción no se puede deshacer y eliminará permanentemente la categoría.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDeleteCategory}
                  disabled={deletingCategoryId === categoryToDelete.id}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteCategory}
                  disabled={deletingCategoryId === categoryToDelete.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                >
                  {deletingCategoryId === categoryToDelete.id ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar Categoría'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container para las notificaciones toast */}
      <ToastContainer />
    </div>
  );
}
