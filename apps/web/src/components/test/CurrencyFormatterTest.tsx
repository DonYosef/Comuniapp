'use client';

import React, { useState } from 'react';
import { formatInputValue, parseCurrency } from '@/utils/currencyFormatter';

export default function CurrencyFormatterTest() {
  const [value, setValue] = useState('1000');
  const [numericValue, setNumericValue] = useState(1000);

  const handleChange = (inputValue: string) => {
    setValue(inputValue);
    const parsed = parseCurrency(inputValue);
    setNumericValue(parsed);
  };

  const handleBlur = () => {
    setValue(formatInputValue(numericValue));
  };

  const handleFocus = () => {
    setValue(numericValue.toString());
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Prueba de Formateo de Moneda</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Valor de entrada:</label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Ingresa un número"
        />
      </div>

      <div className="space-y-2">
        <p>
          <strong>Valor numérico:</strong> {numericValue}
        </p>
        <p>
          <strong>Valor formateado:</strong> {formatInputValue(numericValue)}
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Casos de prueba:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>1000 → {formatInputValue(1000)}</div>
          <div>10000 → {formatInputValue(10000)}</div>
          <div>100000 → {formatInputValue(100000)}</div>
          <div>1000000 → {formatInputValue(1000000)}</div>
        </div>
      </div>
    </div>
  );
}
