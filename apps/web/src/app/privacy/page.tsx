export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold gradient-title-primary mb-8">Política de Privacidad</h1>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Información que Recopilamos
            </h2>
            <p className="text-gray-700 mb-6">
              Recopilamos información que usted nos proporciona directamente, como su nombre,
              dirección de correo electrónico, número de teléfono y otra información de contacto
              cuando se registra en nuestro servicio.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Cómo Utilizamos su Información
            </h2>
            <p className="text-gray-700 mb-6">Utilizamos la información recopilada para:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Proporcionar y mantener nuestro servicio</li>
              <li>Notificarle sobre cambios en nuestro servicio</li>
              <li>Permitirle participar en funciones interactivas de nuestro servicio</li>
              <li>Proporcionar soporte al cliente</li>
              <li>Recopilar análisis o información valiosa para mejorar nuestro servicio</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Compartir su Información
            </h2>
            <p className="text-gray-700 mb-6">
              No vendemos, alquilamos ni compartimos su información personal con terceros, excepto
              en las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Con su consentimiento explícito</li>
              <li>Para cumplir con una obligación legal</li>
              <li>Para proteger y defender nuestros derechos o propiedad</li>
              <li>
                Para prevenir o investigar posibles irregularidades en relación con el servicio
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Seguridad de los Datos</h2>
            <p className="text-gray-700 mb-6">
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger
              su información personal contra acceso no autorizado, alteración, divulgación o
              destrucción.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Retención de Datos</h2>
            <p className="text-gray-700 mb-6">
              Conservamos su información personal solo durante el tiempo necesario para cumplir con
              los propósitos descritos en esta política de privacidad, a menos que la ley requiera
              un período de retención más largo.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Sus Derechos</h2>
            <p className="text-gray-700 mb-6">
              Tiene derecho a acceder, actualizar, corregir o eliminar su información personal.
              También puede retirar su consentimiento en cualquier momento.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cambios a esta Política</h2>
            <p className="text-gray-700 mb-6">
              Podemos actualizar esta política de privacidad de vez en cuando. Le notificaremos
              sobre cualquier cambio publicando la nueva política de privacidad en esta página.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contacto</h2>
            <p className="text-gray-700 mb-6">
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos a través de
              admin@comuniapp.com
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Volver al Registro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
