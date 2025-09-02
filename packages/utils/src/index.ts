// Utilidades comunes para el proyecto
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
