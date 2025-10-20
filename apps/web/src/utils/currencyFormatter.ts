import { useState } from 'react';

// Utilidades para formateo de moneda
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

export const parseCurrency = (value: string): number => {
  // Remover símbolos de moneda, espacios y puntos (separadores de miles)
  const cleanValue = value.replace(/[^\d]/g, '');
  return parseInt(cleanValue) || 0;
};

export const formatInputValue = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseInt(value) || 0 : Math.round(value);
  return numericValue.toLocaleString('es-CL');
};

// Hook para manejar formateo de input de moneda
export const useCurrencyInput = (initialValue: number = 0) => {
  const [displayValue, setDisplayValue] = useState(formatInputValue(initialValue));
  const [numericValue, setNumericValue] = useState(initialValue);

  const handleChange = (value: string) => {
    const parsed = parseCurrency(value);
    setNumericValue(parsed);
    setDisplayValue(formatInputValue(parsed));
  };

  const handleBlur = () => {
    setDisplayValue(formatInputValue(numericValue));
  };

  const handleFocus = () => {
    setDisplayValue(numericValue.toString());
  };

  return {
    displayValue,
    numericValue,
    handleChange,
    handleBlur,
    handleFocus,
  };
};
