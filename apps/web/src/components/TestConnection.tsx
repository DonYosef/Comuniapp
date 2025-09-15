'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function TestConnection() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPublicEndpoint = async () => {
    setLoading(true);
    try {
      const response = await api.get('/public/health');
      setResult({ success: true, data: response.data });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setResult({ success: true, data: response.data });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Prueba de Conexión API</h2>

      <div className="space-y-4">
        <button
          onClick={testPublicEndpoint}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Endpoint Público (/public/health)'}
        </button>

        <button
          onClick={testAuthEndpoint}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Endpoint Protegido (/users)'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-bold mb-2">{result.success ? '✅ Éxito' : '❌ Error'}</h3>

          {result.success ? (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          ) : (
            <div>
              <p>
                <strong>Error:</strong> {result.error}
              </p>
              {result.status && (
                <p>
                  <strong>Status:</strong> {result.status}
                </p>
              )}
              {result.data && (
                <pre className="bg-red-100 p-2 rounded text-sm mt-2 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
